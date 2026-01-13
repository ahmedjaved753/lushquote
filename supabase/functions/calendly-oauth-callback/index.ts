import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const CALENDLY_CLIENT_ID = Deno.env.get("CALENDLY_CLIENT_ID") ?? "";
const CALENDLY_CLIENT_SECRET = Deno.env.get("CALENDLY_CLIENT_SECRET") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // Contains user_id
  const error = url.searchParams.get("error");

  // Handle OAuth errors
  if (error || !code || !state) {
    console.error("OAuth error or missing params:", { error, code: !!code, state: !!state });
    return Response.redirect(`${APP_URL}/settings?calendly_error=auth_failed`);
  }

  try {
    // Build redirect URI (must match what was registered in Calendly)
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/calendly-oauth-callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://auth.calendly.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: CALENDLY_CLIENT_ID,
        client_secret: CALENDLY_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return Response.redirect(`${APP_URL}/settings?calendly_error=token_exchange`);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get Calendly user info
    const userResponse = await fetch("https://api.calendly.com/users/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to get Calendly user info");
      return Response.redirect(`${APP_URL}/settings?calendly_error=user_fetch`);
    }

    const userData = await userResponse.json();
    const calendlyUserUri = userData.resource.uri;

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Store tokens in user_profiles
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        calendly_access_token: access_token,
        calendly_refresh_token: refresh_token,
        calendly_token_expires_at: expiresAt,
        calendly_user_uri: calendlyUserUri,
        calendly_connected_at: new Date().toISOString(),
      })
      .eq("id", state);

    if (updateError) {
      console.error("Failed to save tokens:", updateError);
      return Response.redirect(`${APP_URL}/settings?calendly_error=save_tokens`);
    }

    // Fetch and store event types
    const eventTypesResponse = await fetch(
      `https://api.calendly.com/event_types?user=${encodeURIComponent(calendlyUserUri)}&active=true`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (eventTypesResponse.ok) {
      const eventTypesData = await eventTypesResponse.json();

      // Delete existing event types for this user
      await supabase
        .from("calendly_event_types")
        .delete()
        .eq("user_id", state);

      // Insert new event types
      const eventTypes = eventTypesData.collection.map((et: any) => ({
        user_id: state,
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
        }
      }
    }

    // Redirect to settings page with success
    return Response.redirect(`${APP_URL}/settings?calendly_connected=true`);
  } catch (err) {
    console.error("Calendly OAuth error:", err);
    return Response.redirect(`${APP_URL}/settings?calendly_error=unknown`);
  }
});
