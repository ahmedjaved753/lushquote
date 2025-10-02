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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log(`Received webhook event: ${event.type}`);

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
            await supabase
              .from("user_profiles")
              .update({
                subscription_tier: "premium",
                subscription_status: "active",
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                subscription_current_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
                monthly_submission_count: 0, // Reset counter on upgrade
              })
              .eq("id", session.metadata.supabase_user_id);

            console.log(
              `User ${session.metadata.supabase_user_id} upgraded to premium`
            );
          }
        }
        break;

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", updatedSubscription.id);

        // Update subscription details
        const updateData: any = {
          subscription_status: updatedSubscription.status === "active" ? "active" : "inactive",
          subscription_current_period_end: new Date(
            updatedSubscription.current_period_end * 1000
          ).toISOString(),
        };

        // If subscription is being canceled or past due
        if (
          updatedSubscription.status === "canceled" ||
          updatedSubscription.cancel_at_period_end
        ) {
          updateData.subscription_status = "canceled";
        }

        if (updatedSubscription.status === "past_due") {
          updateData.subscription_status = "past_due";
        }

        await supabase
          .from("user_profiles")
          .update(updateData)
          .eq("stripe_subscription_id", updatedSubscription.id);
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
