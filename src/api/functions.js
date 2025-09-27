import { supabase } from './supabaseClient';

// Supabase Edge Functions for Stripe integration
export const createCheckoutSession = async (sessionData) => {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: sessionData
  });
  return { data, error };
};

export const createBillingPortalSession = async (customerId) => {
  const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
    body: { customerId }
  });
  return { data, error };
};

export const stripeWebhook = async (event) => {
  const { data, error } = await supabase.functions.invoke('stripe-webhook', {
    body: event
  });
  return { data, error };
};

// Database operation to increment submission counter
export const incrementSubmissionCounter = async (templateId) => {
  const { data, error } = await supabase
    .rpc('increment_submission_counter', { template_id: templateId });
  return { data, error };
};

// Get template public data (without auth requirement)
export const getTemplatePublicData = async (templateId) => {
  const { data, error } = await supabase
    .from('quote_templates')
    .select(`
      id,
      title,
      description,
      services,
      branding,
      is_public,
      created_at
    `)
    .eq('id', templateId)
    .eq('is_public', true)
    .single();
  return { data, error };
};

