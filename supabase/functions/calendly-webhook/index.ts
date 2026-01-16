import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const CALENDLY_WEBHOOK_SIGNING_KEY = Deno.env.get("CALENDLY_WEBHOOK_SIGNING_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, calendly-webhook-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Verify Calendly webhook signature
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  signingKey: string
): Promise<boolean> {
  if (!signingKey || !signature) {
    console.warn("Missing signing key or signature, skipping verification");
    return true; // Allow without verification if no key configured
  }

  try {
    // Calendly uses HMAC-SHA256
    // Signature format: t=timestamp,v1=signature
    const parts = signature.split(",");
    const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
    const v1Signature = parts.find((p) => p.startsWith("v1="))?.slice(3);

    if (!timestamp || !v1Signature) {
      console.error("Invalid signature format");
      return false;
    }

    // Create the signed payload
    const signedPayload = `${timestamp}.${payload}`;

    // Compute HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(signingKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );

    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSignature === v1Signature;
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
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
    const payload = await req.text();
    const signature = req.headers.get("calendly-webhook-signature") || "";

    // Verify webhook signature if signing key is configured
    if (CALENDLY_WEBHOOK_SIGNING_KEY) {
      const isValid = await verifyWebhookSignature(
        payload,
        signature,
        CALENDLY_WEBHOOK_SIGNING_KEY
      );

      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const event = JSON.parse(payload);
    console.log("Received Calendly webhook event:", event.event);

    const eventType = event.event;
    const eventPayload = event.payload;

    if (!eventPayload) {
      return new Response(JSON.stringify({ error: "No payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract relevant URIs
    const eventUri = eventPayload.event?.uri || eventPayload.scheduled_event?.uri;
    const inviteeUri = eventPayload.uri; // The invitee URI
    const canceledAt = eventPayload.canceled_at || eventPayload.cancellation?.canceled_at;
    const cancellationReason = eventPayload.cancellation?.reason;
    const rescheduledUri = eventPayload.new_invitee?.uri; // For reschedule events

    console.log("Event details:", {
      eventType,
      eventUri,
      inviteeUri,
      canceledAt,
      rescheduledUri,
    });

    // Find the matching quote submission
    let submission = null;

    // Try to find by event URI first
    if (eventUri) {
      const { data } = await supabase
        .from("quote_submissions")
        .select("*")
        .eq("calendly_event_uri", eventUri)
        .single();
      submission = data;
    }

    // If not found, try by invitee URI
    if (!submission && inviteeUri) {
      const { data } = await supabase
        .from("quote_submissions")
        .select("*")
        .eq("calendly_invitee_uri", inviteeUri)
        .single();
      submission = data;
    }

    if (!submission) {
      console.log("No matching submission found for Calendly event");
      // Return 200 to acknowledge receipt even if no matching submission
      return new Response(JSON.stringify({
        success: true,
        message: "Event received but no matching submission found"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Found matching submission:", submission.id);

    // Handle different event types
    switch (eventType) {
      case "invitee.canceled": {
        // Update submission to indicate cancellation
        const updateData: Record<string, unknown> = {
          calendly_event_status: "canceled",
          calendly_canceled_at: canceledAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (cancellationReason) {
          updateData.calendly_cancellation_reason = cancellationReason;
        }

        const { error: updateError } = await supabase
          .from("quote_submissions")
          .update(updateData)
          .eq("id", submission.id);

        if (updateError) {
          console.error("Error updating submission:", updateError);
          return new Response(JSON.stringify({ error: "Failed to update submission" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Submission updated with cancellation status");
        break;
      }

      case "invitee.created": {
        // This is typically handled by the frontend when booking
        // But we can update here in case the frontend missed it
        const updateData: Record<string, unknown> = {
          calendly_event_status: "scheduled",
          updated_at: new Date().toISOString(),
        };

        // Update start/end times if available
        const scheduledEvent = eventPayload.scheduled_event;
        if (scheduledEvent) {
          if (scheduledEvent.start_time) {
            updateData.calendly_event_start_time = scheduledEvent.start_time;
          }
          if (scheduledEvent.end_time) {
            updateData.calendly_event_end_time = scheduledEvent.end_time;
          }
        }

        const { error: updateError } = await supabase
          .from("quote_submissions")
          .update(updateData)
          .eq("id", submission.id);

        if (updateError) {
          console.error("Error updating submission:", updateError);
        }

        console.log("Submission confirmed as scheduled");
        break;
      }

      default:
        console.log("Unhandled event type:", eventType);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${eventType} event`,
      submissionId: submission.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
