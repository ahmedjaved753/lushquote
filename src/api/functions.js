import { supabase, supabaseAnon } from './supabaseClient';

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
// Uses anonymous client since this is called after public quote submissions
export const incrementSubmissionCounter = async (templateId) => {
  const { data, error } = await supabaseAnon
    .rpc('increment_submission_counter', { template_id: templateId });
  return { data, error };
};

// Get template public data (without auth requirement)
// Uses the anonymous Supabase client to ensure it always works for public access
export const getTemplatePublicData = async (templateId) => {
  try {
    console.log('[getTemplatePublicData] Starting fetch for template:', templateId);
    console.log('[getTemplatePublicData] Using anonymous Supabase client');

    // Get template data (only active templates are public)
    const { data: template, error: templateError } = await supabaseAnon
      .from('quote_templates')
      .select(`
        id,
        business_name,
        description,
        branding,
        services,
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
        created_at,
        use_calendly_scheduling,
        calendly_event_type_id
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

    // Fetch Calendly event type if template uses Calendly scheduling
    let calendlyEventType = null;
    if (template.use_calendly_scheduling && template.calendly_event_type_id) {
      const { data: eventType, error: eventTypeError } = await supabaseAnon
        .from('calendly_event_types')
        .select('id, name, duration_minutes, scheduling_url')
        .eq('id', template.calendly_event_type_id)
        .single();

      if (!eventTypeError && eventType) {
        calendlyEventType = eventType;
        console.log('[getTemplatePublicData] Calendly event type:', eventType);
      }
    }

    // Get owner's timezone from user_profiles
    let ownerTimezone = 'UTC';
    if (template.owner_email) {
      const { data: ownerProfile } = await supabaseAnon
        .from('user_profiles')
        .select('time_zone')
        .eq('email', template.owner_email)
        .single();

      if (ownerProfile?.time_zone) {
        ownerTimezone = ownerProfile.time_zone;
      }
    }

    // Get services from JSONB column in template (more reliable than separate table)
    const services = template.services || [];
    console.log('[getTemplatePublicData] Services from JSONB:', services);

    // Map services to UI format
    const uiServices = services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      type: service.type || 'fixed',
      price: parseFloat(service.price || 0),
      unit_label: service.unit_label,
      frequency: service.frequency,
      selection_method: service.selection_method || 'checkbox',
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
          services: uiServices,
          calendly_event_type: calendlyEventType
        },
        owner: {
          subscription_tier: template.owner_subscription_tier,
          monthly_submission_count: 0, // We'll handle limit checking in backend
          email: template.owner_email,
          time_zone: ownerTimezone
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
// Uses Edge Function with service role to bypass RLS completely
export const createPublicQuoteSubmission = async (submissionData) => {
  try {
    console.log('[createPublicQuoteSubmission] Starting submission via Edge Function:', submissionData);

    // Use the Edge Function which has service role access
    const { data, error } = await supabaseAnon.functions.invoke('submit-public-quote', {
      body: submissionData
    });

    console.log('[createPublicQuoteSubmission] Edge Function result:', { data, error });

    if (error) {
      console.error('[createPublicQuoteSubmission] Edge Function error:', error);
      throw error;
    }

    // Edge function returns { data: submission, error: null } on success
    if (data?.error) {
      throw new Error(data.error);
    }

    return { data: data?.data || data, error: null };
  } catch (error) {
    console.error('Error in createPublicQuoteSubmission:', error);
    return { data: null, error };
  }
};

