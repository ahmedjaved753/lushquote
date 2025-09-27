import { supabase } from './supabaseClient';

// Supabase database operations for QuoteTemplate
export const QuoteTemplate = {
  // Create a new quote template
  create: async (templateData) => {
    const { data, error } = await supabase
      .from('quote_templates')
      .insert([templateData])
      .select();
    return { data, error };
  },

  // Get all quote templates for a user
  findMany: async (userId) => {
    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  // Get a single quote template by id
  findById: async (id) => {
    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Update a quote template
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('quote_templates')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  // Delete a quote template
  delete: async (id) => {
    const { data, error } = await supabase
      .from('quote_templates')
      .delete()
      .eq('id', id);
    return { data, error };
  }
};

// Supabase database operations for QuoteSubmission
export const QuoteSubmission = {
  // Create a new quote submission
  create: async (submissionData) => {
    const { data, error } = await supabase
      .from('quote_submissions')
      .insert([submissionData])
      .select();
    return { data, error };
  },

  // Get all quote submissions for a template
  findMany: async (templateId) => {
    const { data, error } = await supabase
      .from('quote_submissions')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Get a single quote submission by id
  findById: async (id) => {
    const { data, error } = await supabase
      .from('quote_submissions')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Update a quote submission
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('quote_submissions')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  // Delete a quote submission
  delete: async (id) => {
    const { data, error } = await supabase
      .from('quote_submissions')
      .delete()
      .eq('id', id);
    return { data, error };
  }
};

// Supabase auth operations
export const User = supabase.auth;