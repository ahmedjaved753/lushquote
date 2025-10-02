import { supabase } from './supabaseClient';

// Supabase Edge Functions for Stripe integration
export const createCheckoutSession = async () => {
  console.log('[createCheckoutSession] Starting checkout session creation...');
  
  // Get current session to pass auth token
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('[createCheckoutSession] Session retrieved:', {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
  });

  console.log('[createCheckoutSession] Invoking create-checkout-session edge function...');
  
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: {}
  });
  
  console.log('[createCheckoutSession] Edge function response:', {
    data,
    error,
    hasUrl: !!data?.url,
  });
  
  if (error) {
    console.error('[createCheckoutSession] ERROR:', error);
  } else {
    console.log('[createCheckoutSession] SUCCESS - Checkout URL:', data?.url);
  }
  
  return { data, error };
};

export const createBillingPortalSession = async () => {
  console.log('[createBillingPortalSession] Starting billing portal session...');
  
  // Get current session to pass auth token
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('[createBillingPortalSession] Session retrieved:', {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
  });

  const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: {}
  });
  
  console.log('[createBillingPortalSession] Response:', { data, error });
  
  if (error) {
    console.error('[createBillingPortalSession] ERROR:', error);
  }
  
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
  try {
    console.log('[getTemplatePublicData] Starting fetch for template:', templateId);
    console.log('[getTemplatePublicData] Supabase client:', supabase);
    
    // Get template data (only active templates are public)
    const { data: template, error: templateError } = await supabase
      .from('quote_templates')
      .select(`
        id,
        business_name,
        description,
        branding,
        is_active,
        request_date_enabled,
        request_date_optional,
        date_request_label,
        request_time_enabled,
        request_time_optional,
        time_request_label,
        footer_enabled,
        footer_text,
        owner_email,
        owner_subscription_tier,
        created_at
      `)
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    console.log('[getTemplatePublicData] Template query result:', { template, templateError });

    if (templateError) {
      console.error('Template fetch error:', templateError);
      return { data: null, error: templateError };
    }

    if (!template) {
      console.error('Template not found or inactive');
      return { data: null, error: { message: 'Template not found or inactive' } };
    }

    // Get services from separate table
    const { data: services, error: servicesError } = await supabase
      .from('template_services')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true });

    console.log('[getTemplatePublicData] Services query result:', { services, servicesError });

    if (servicesError) {
      console.error('Error getting services for public template:', servicesError);
      // Don't fail, just return empty services
    }

    // Map services to UI format
    const uiServices = (services || []).map(service => ({
      id: service.temp_id || service.id,
      name: service.name,
      description: service.description,
      type: service.type,
      price: parseFloat(service.price || 0),
      unit_label: service.unit_label,
      frequency: service.frequency,
      selection_method: service.selection_method,
      min_quantity: service.min_quantity,
      max_quantity: service.max_quantity,
      default_quantity: service.default_quantity,
      quantity: service.quantity || service.default_quantity || 1
    }));

    // Return data in format expected by QuoteForm
    const result = {
      data: {
        template: {
          ...template,
          services: uiServices
        },
        owner: {
          subscription_tier: template.owner_subscription_tier,
          monthly_submission_count: 0, // We'll handle limit checking in backend
          email: template.owner_email
        }
      },
      error: null
    };
    
    console.log('[getTemplatePublicData] Returning result:', result);
    return result;
  } catch (error) {
    console.error('Error in getTemplatePublicData:', error);
    return { data: null, error };
  }
};

// Create a public quote submission (no auth required)
export const createPublicQuoteSubmission = async (submissionData) => {
  try {
    console.log('[createPublicQuoteSubmission] Starting submission:', submissionData);
    
    const { data, error } = await supabase
      .from('quote_submissions')
      .insert([submissionData])
      .select()
      .single();

    console.log('[createPublicQuoteSubmission] Result:', { data, error });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error in createPublicQuoteSubmission:', error);
    return { data: null, error };
  }
};

