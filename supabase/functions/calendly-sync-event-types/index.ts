import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const CALENDLY_CLIENT_ID = Deno.env.get("CALENDLY_CLIENT_ID") ?? "";
const CALENDLY_CLIENT_SECRET = Deno.env.get("CALENDLY_CLIENT_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper to refresh token if needed
async function getValidAccessToken(userId: string, profile: any): Promise<string | null> {
  const now = new Date();
  const expiresAt = new Date(profile.calendly_token_expires_at);

  // If token is not expiring soon (more than 5 minutes), use it
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return profile.calendly_access_token;
  }

  // Token is expiring soon, refresh it
  try {
    const tokenResponse = await fetch("https://auth.calendly.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: profile.calendly_refresh_token,
        client_id: CALENDLY_CLIENT_ID,
        client_secret: CALENDLY_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token refresh failed");
      return null;
    }

    const tokens = await tokenResponse.json();
    const expiresAtNew = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Update tokens in database
    await supabase
      .from("user_profiles")
      .update({
        calendly_access_token: tokens.access_token,
        calendly_refresh_token: tokens.refresh_token,
        calendly_token_expires_at: expiresAtNew,
      })
      .eq("id", userId);

    return tokens.access_token;
  } catch (err) {
    console.error("Token refresh error:", err);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Get user from auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile with Calendly tokens
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("calendly_access_token, calendly_refresh_token, calendly_token_expires_at, calendly_user_uri")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.calendly_access_token) {
      return new Response(JSON.stringify({ error: "Calendly not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get valid access token (refresh if needed)
    const accessToken = await getValidAccessToken(user.id, profile);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Failed to get valid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch event types from Calendly
    const eventTypesResponse = await fetch(
      `https://api.calendly.com/event_types?user=${encodeURIComponent(profile.calendly_user_uri)}&active=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!eventTypesResponse.ok) {
      console.error("Failed to fetch event types from Calendly");
      return new Response(JSON.stringify({ error: "Failed to fetch event types" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventTypesData = await eventTypesResponse.json();

    // Delete existing event types for this user
    await supabase
      .from("calendly_event_types")
      .delete()
      .eq("user_id", user.id);

    // Insert new event types
    const eventTypes = eventTypesData.collection.map((et: any) => ({
      user_id: user.id,
      calendly_uri: et.uri,
      name: et.name,
      description: et.description_plain || null,
      duration_minutes: et.duration,
      scheduling_url: et.scheduling_url,
      color: et.color || null,
      is_active: et.active,
      synced_at: new Date().toISOString(),
    }));

    if (eventTypes.length > 0) {
      const { error: insertError } = await supabase
        .from("calendly_event_types")
        .insert(eventTypes);

      if (insertError) {
        console.error("Failed to save event types:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save event types" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      count: eventTypes.length,
      eventTypes: eventTypes.map((et: any) => ({ name: et.name, duration: et.duration_minutes }))
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sync event types error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
