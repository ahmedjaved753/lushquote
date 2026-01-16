import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature) {
    console.error("No Stripe-Signature header");
    return new Response(JSON.stringify({ error: "No signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  try {
    const body = await req.text();

    // Verify the webhook signature using Stripe's async method for Deno
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log(`✅ Received webhook event: ${event.type}`);
    console.log(`Event ID: ${event.id}`);

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        // Get the subscription if mode is subscription
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Update user profile with subscription details
          if (session.metadata?.supabase_user_id) {
            const updateData = {
              subscription_tier: "premium",
              subscription_status: "active",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              monthly_submission_count: 0, // Reset counter on upgrade
            };

            console.log("Updating user profile with data:", updateData);

            const { data, error } = await supabase
              .from("user_profiles")
              .update(updateData)
              .eq("id", session.metadata.supabase_user_id)
              .select();

            if (error) {
              console.error("Error updating user profile:", error);
            } else {
              console.log("User profile updated successfully:", data);
              console.log(
                `✅ User ${session.metadata.supabase_user_id} upgraded to premium`
              );
            }
          } else {
            console.error("No supabase_user_id in session metadata!");
          }
        }
        break;

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", updatedSubscription.id);
        console.log("Subscription status:", updatedSubscription.status);

        // Build update data with proper null checks
        const updateData: any = {};

        // Set subscription status
        if (updatedSubscription.status === "active") {
          updateData.subscription_status = "active";
          updateData.subscription_tier = "premium";
        } else if (updatedSubscription.status === "canceled") {
          updateData.subscription_status = "canceled";
          updateData.subscription_tier = "free";
        } else if (updatedSubscription.status === "past_due") {
          updateData.subscription_status = "past_due";
        } else if (updatedSubscription.status === "incomplete") {
          updateData.subscription_status = "inactive";
        } else {
          updateData.subscription_status = "inactive";
        }

        // Handle cancel_at_period_end flag
        if (updatedSubscription.cancel_at_period_end) {
          updateData.subscription_status = "canceled";
        }

        // Safely get current_period_end from subscription or subscription items
        let periodEnd: number | null = null;

        if (updatedSubscription.current_period_end) {
          periodEnd = updatedSubscription.current_period_end;
        } else if (updatedSubscription.items?.data?.[0]?.current_period_end) {
          periodEnd = updatedSubscription.items.data[0].current_period_end;
        }

        if (periodEnd) {
          try {
            updateData.subscription_current_period_end = new Date(
              periodEnd * 1000
            ).toISOString();
          } catch (e) {
            console.error("Error converting period end date:", e);
          }
        }

        console.log("Updating subscription with data:", updateData);

        const { data: subData, error: subError } = await supabase
          .from("user_profiles")
          .update(updateData)
          .eq("stripe_subscription_id", updatedSubscription.id)
          .select();

        if (subError) {
          console.error("Error updating subscription:", subError);
        } else {
          console.log("Subscription updated successfully:", subData);
        }
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log("Subscription cancelled:", deletedSubscription.id);

        // Downgrade user to free tier
        await supabase
          .from("user_profiles")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
            subscription_current_period_end: null,
          })
          .eq("stripe_subscription_id", deletedSubscription.id);
        break;

      case "invoice.payment_failed":
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed for invoice:", invoice.id);

        // Update status to past_due
        if (invoice.subscription) {
          await supabase
            .from("user_profiles")
            .update({ subscription_status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription as string);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
