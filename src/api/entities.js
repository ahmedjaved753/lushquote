import { supabase } from './supabaseClient';

// Generate slug from business name with unique suffix
const generateSlug = (name, addUniqueSuffix = false) => {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (addUniqueSuffix) {
    // Add a short random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  }
  return baseSlug;
};

// Check if slug exists and generate a unique one if needed
const ensureUniqueSlug = async (baseSlug, userId) => {
  // First try the base slug
  const { data: existing } = await supabase
    .from('quote_templates')
    .select('id')
    .eq('slug', baseSlug)
    .maybeSingle();

  if (!existing) {
    return baseSlug;
  }

  // If slug exists, add a unique suffix
  let attempts = 0;
  while (attempts < 10) {
    const uniqueSlug = generateSlug(baseSlug, true);
    const { data: check } = await supabase
      .from('quote_templates')
      .select('id')
      .eq('slug', uniqueSlug)
      .maybeSingle();

    if (!check) {
      return uniqueSlug;
    }
    attempts++;
  }

  // Fallback: use timestamp-based suffix
  return `${baseSlug}-${Date.now()}`;
};

// User operations matching the expected API
export const User = {
  // Get current authenticated user with profile data
  me: async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No authenticated user');

      // Get or create user profile
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            id: user.id,
            email: user.email,
            preferred_name: user.user_metadata?.full_name || user.email?.split('@')[0]
          }])
          .select()
          .single();

        if (createError) throw createError;
        profile = newProfile;
      } else if (profileError) {
        throw profileError;
      }

      return {
        id: user.id,
        email: user.email,
        ...profile,
        role: user.user_metadata?.role || user.app_metadata?.role || 'user'
      };
    } catch (error) {
      console.error('Error in User.me():', error);
      throw error;
    }
  },

  // Update user profile data
  updateMyUserData: async (updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }
};

// QuoteTemplate operations matching the expected API
export const QuoteTemplate = {
  // Create a new quote template
  create: async (templateData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate a unique slug
      const baseSlug = templateData.slug || generateSlug(templateData.business_name);
      const slug = await ensureUniqueSlug(baseSlug, user.id);
      const services = Array.isArray(templateData.services) ? templateData.services : [];
      
      // Create template first
      const { data: template, error: templateError } = await supabase
        .from('quote_templates')
        .insert([{
          ...templateData,
          user_id: user.id,
          created_by: user.email,
          slug: slug,
          owner_email: user.email,
          // Keep JSONB services for backward compatibility but also use separate table
          services: services,
          branding: typeof templateData.branding === 'object' ? templateData.branding : { primary_color: '#87A96B' }
        }])
        .select()
        .single();

      if (templateError) throw templateError;

      // Create services in separate table
      if (services && services.length > 0) {
        const servicesData = services.map((service, index) => ({
          template_id: template.id,
          temp_id: service.id, // Store UI-generated ID
          name: service.name || '',
          description: service.description || '',
          type: service.type || 'fixed', // Use UI field name
          price: parseFloat(service.price || 0), // Use UI field name
          unit_label: service.unit_label || '',
          frequency: service.frequency || '', // Use UI field name
          selection_method: service.selection_method || 'checkbox',
          min_quantity: parseInt(service.min_quantity || 1),
          max_quantity: service.max_quantity ? parseInt(service.max_quantity) : null,
          default_quantity: parseInt(service.default_quantity || service.quantity || 1),
          quantity: parseInt(service.quantity || 1), // Add quantity field for UI compatibility
          sort_order: index
        }));

        const { error: servicesError } = await supabase
          .from('template_services')
          .insert(servicesData);

        if (servicesError) {
          console.error('Error creating services:', servicesError);
          // Don't throw error here, template is already created
        }
      }

      return template;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  // Get templates by filter (e.g., { created_by: email })
  filter: async (filters, sortBy = '-created_at') => {
    try {
      let query = supabase.from('quote_templates').select('*');
      
      // Handle created_by filter
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      
      // Handle user_id filter
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      
      // Default to active templates only
      if (filters.is_active !== false) {
        query = query.eq('is_active', true);
      }
      
      // Handle sorting
      let orderColumn = 'created_at';
      let ascending = false;
      
      if (sortBy) {
        if (sortBy.startsWith('-')) {
          orderColumn = sortBy.substring(1);
          ascending = false;
        } else {
          orderColumn = sortBy;
          ascending = true;
        }
        
        // Map field names to actual column names
        if (orderColumn === 'updated_date') orderColumn = 'updated_at';
        if (orderColumn === 'created_date') orderColumn = 'created_at';
      }
      
      const { data, error } = await query.order(orderColumn, { ascending });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering templates:', error);
      throw error;
    }
  },

  // Get a single template by ID
  get: async (id) => {
    try {
      const { data: template, error: templateError } = await supabase
        .from('quote_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (templateError) throw templateError;

      // Get services from separate table
      const { data: services, error: servicesError } = await supabase
        .from('template_services')
        .select('*')
        .eq('template_id', id)
        .order('sort_order', { ascending: true });

      if (servicesError) {
        console.error('Error getting services:', servicesError);
        // Don't throw, just use empty services array
      }

      // Return template with services from separate table (overriding JSONB services)
      // Map database services to UI format
      const uiServices = (services || []).map(service => ({
        id: service.temp_id || service.id, // Use temp_id if available, fallback to database id
        name: service.name,
        description: service.description,
        type: service.type, // Already correct field name
        price: parseFloat(service.price || 0), // Already correct field name
        unit_label: service.unit_label,
        frequency: service.frequency, // Already correct field name
        selection_method: service.selection_method,
        min_quantity: service.min_quantity,
        max_quantity: service.max_quantity,
        default_quantity: service.default_quantity,
        quantity: service.quantity || service.default_quantity || 1,
        // Keep database fields for internal use
        _db_id: service.id,
        _sort_order: service.sort_order
      }));

      return {
        ...template,
        services: uiServices
      };
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  },

  // Update a template
  update: async (id, updates) => {
    try {
      const services = Array.isArray(updates.services) ? updates.services : [];
      
      // Ensure services and branding are properly formatted
      const sanitizedUpdates = {
        ...updates,
        services: services, // Keep JSONB for backward compatibility
        branding: typeof updates.branding === 'object' ? updates.branding : { primary_color: '#87A96B' }
      };

      // Update template
      const { data: template, error: templateError } = await supabase
        .from('quote_templates')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (templateError) throw templateError;

      // Update services in separate table
      // First, delete existing services
      const { error: deleteError } = await supabase
        .from('template_services')
        .delete()
        .eq('template_id', id);

      if (deleteError) {
        console.error('Error deleting old services:', deleteError);
      }

      // Then insert new services
      if (services && services.length > 0) {
        const servicesData = services.map((service, index) => ({
          template_id: id,
          temp_id: service.id, // Store UI-generated ID
          name: service.name || '',
          description: service.description || '',
          type: service.type || 'fixed', // Use UI field name
          price: parseFloat(service.price || 0), // Use UI field name
          unit_label: service.unit_label || '',
          frequency: service.frequency || '', // Use UI field name
          selection_method: service.selection_method || 'checkbox',
          min_quantity: parseInt(service.min_quantity || 1),
          max_quantity: service.max_quantity ? parseInt(service.max_quantity) : null,
          default_quantity: parseInt(service.default_quantity || service.quantity || 1),
          quantity: parseInt(service.quantity || 1), // Add quantity field for UI compatibility
          sort_order: index
        }));

        const { error: servicesError } = await supabase
          .from('template_services')
          .insert(servicesData);

        if (servicesError) {
          console.error('Error updating services:', servicesError);
        }
      }

      return template;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  // Delete a template
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('quote_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }
};

// QuoteSubmission operations
export const QuoteSubmission = {
  // Get a single quote submission by id (alias for findById for API consistency)
  get: async (id) => {
    try {
      const { data, error } = await supabase
        .from('quote_submissions')
        .select(`
          *,
          quote_templates!inner(
            id,
            business_name,
            owner_email,
            owner_subscription_tier
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Flatten the data to match expected structure
      const flattened = {
        ...data,
        owner_email: data.quote_templates?.owner_email,
        owner_subscription_tier: data.quote_templates?.owner_subscription_tier,
        template_business_name: data.quote_templates?.business_name,
        calculated_price: data.estimated_total
      };

      return flattened;
    } catch (error) {
      console.error('Error getting submission:', error);
      throw error;
    }
  },

  // Create a new quote submission
  create: async (submissionData) => {
    try {
      const { data, error } = await supabase
        .from('quote_submissions')
        .insert([submissionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  },

  // List submissions with sorting and limit
  list: async (sortBy = '-submitted_at', limit = 100) => {
    try {
      let query = supabase
        .from('quote_submissions')
        .select(`
          *,
          quote_templates!inner(
            id,
            business_name,
            owner_email,
            owner_subscription_tier
          )
        `);
      
      // Handle sorting
      let orderColumn = 'submitted_at';
      let ascending = false;
      
      if (sortBy) {
        if (sortBy.startsWith('-')) {
          orderColumn = sortBy.substring(1);
          ascending = false;
        } else {
          orderColumn = sortBy;
          ascending = true;
        }
        
        // Map field names to actual column names
        if (orderColumn === 'created_date') orderColumn = 'submitted_at';
      }
      
      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query.order(orderColumn, { ascending });
      
      if (error) throw error;
      
      // Flatten the data to match expected structure
      const flattenedData = (data || []).map(submission => ({
        ...submission,
        owner_email: submission.quote_templates?.owner_email,
        owner_subscription_tier: submission.quote_templates?.owner_subscription_tier,
        template_business_name: submission.quote_templates?.business_name,
        calculated_price: submission.estimated_total // Map estimated_total to calculated_price for Dashboard compatibility
      }));
      
      return flattenedData;
    } catch (error) {
      console.error('Error listing submissions:', error);
      throw error;
    }
  },

  // Get all quote submissions for a template
  findMany: async (templateId) => {
    try {
      const { data, error } = await supabase
        .from('quote_submissions')
        .select(`
          *,
          quote_templates!inner(
            id,
            business_name,
            owner_email,
            owner_subscription_tier
          )
        `)
        .eq('template_id', templateId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      // Flatten the data to match expected structure
      const flattenedData = (data || []).map(submission => ({
        ...submission,
        owner_email: submission.quote_templates?.owner_email,
        owner_subscription_tier: submission.quote_templates?.owner_subscription_tier,
        template_business_name: submission.quote_templates?.business_name,
        calculated_price: submission.estimated_total // Map estimated_total to calculated_price for Dashboard compatibility
      }));
      
      return flattenedData;
    } catch (error) {
      console.error('Error getting submissions:', error);
      throw error;
    }
  },

  // Get a single quote submission by id
  findById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('quote_submissions')
        .select(`
          *,
          quote_templates!inner(
            id,
            business_name,
            owner_email,
            owner_subscription_tier
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Flatten the data to match expected structure
      const flattened = {
        ...data,
        owner_email: data.quote_templates?.owner_email,
        owner_subscription_tier: data.quote_templates?.owner_subscription_tier,
        template_business_name: data.quote_templates?.business_name,
        calculated_price: data.estimated_total // Map estimated_total to calculated_price for Dashboard compatibility
      };
      
      return flattened;
    } catch (error) {
      console.error('Error getting submission:', error);
      throw error;
    }
  },

  // Update a quote submission
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('quote_submissions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          quote_templates!inner(
            id,
            business_name,
            owner_email,
            owner_subscription_tier
          )
        `)
        .single();

      if (error) throw error;
      
      // Flatten the data to match expected structure
      const flattened = {
        ...data,
        owner_email: data.quote_templates?.owner_email,
        owner_subscription_tier: data.quote_templates?.owner_subscription_tier,
        template_business_name: data.quote_templates?.business_name,
        calculated_price: data.estimated_total // Map estimated_total to calculated_price for Dashboard compatibility
      };
      
      return flattened;
    } catch (error) {
      console.error('Error updating submission:', error);
      throw error;
    }
  },

  // Delete a quote submission
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('quote_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  }
};