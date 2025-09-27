import { supabase } from './supabaseClient';

// Core Supabase integrations
export const Core = {
  // Invoke LLM via Supabase Edge Function
  InvokeLLM: async (prompt, options = {}) => {
    const { data, error } = await supabase.functions.invoke('invoke-llm', {
      body: { prompt, ...options }
    });
    return { data, error };
  },

  // Send Email via Supabase Edge Function
  SendEmail: async (emailData) => {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailData
    });
    return { data, error };
  },

  // Upload File to Supabase Storage
  UploadFile: async (bucket, filePath, file) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
    return { data, error };
  },

  // Generate Image via Edge Function
  GenerateImage: async (imagePrompt) => {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { prompt: imagePrompt }
    });
    return { data, error };
  },

  // Extract Data from Uploaded File via Edge Function
  ExtractDataFromUploadedFile: async (fileUrl) => {
    const { data, error } = await supabase.functions.invoke('extract-file-data', {
      body: { fileUrl }
    });
    return { data, error };
  },

  // Create File Signed URL from Supabase Storage
  CreateFileSignedUrl: async (bucket, filePath, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);
    return { data, error };
  },

  // Upload Private File to Supabase Storage
  UploadPrivateFile: async (bucket, filePath, file) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
    return { data, error };
  }
};

// Export individual functions for backwards compatibility
export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;






