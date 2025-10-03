-- Function to send quote notification email to template owner
-- This function is triggered when a new quote submission is created
CREATE OR REPLACE FUNCTION send_quote_notification()
RETURNS TRIGGER AS $$
DECLARE
  owner_record RECORD;
  template_record RECORD;
  function_url TEXT;
  service_role_key TEXT;
  supabase_url TEXT;
  request_id BIGINT;
  payload JSONB;
BEGIN
  -- Get Supabase URL from environment or use default
  supabase_url := current_setting('app.settings.supabase_url', true);
  IF supabase_url IS NULL THEN
    -- Fallback: construct URL from request context if available
    supabase_url := current_setting('request.headers', true)::json->>'x-forwarded-host';
    IF supabase_url IS NOT NULL THEN
      supabase_url := 'https://' || supabase_url;
    END IF;
  END IF;

  -- Get template and owner information
  SELECT 
    qt.id,
    qt.name as template_name,
    qt.business_name,
    qt.user_id,
    up.preferred_name,
    up.email_notifications_enabled,
    COALESCE(up.notification_email, au.email) as owner_email
  INTO template_record
  FROM quote_templates qt
  JOIN user_profiles up ON up.id = qt.user_id
  JOIN auth.users au ON au.id = up.id
  WHERE qt.id = NEW.template_id;

  -- Check if owner exists and has notifications enabled
  IF NOT FOUND THEN
    RAISE WARNING 'Template owner not found for template_id: %', NEW.template_id;
    RETURN NEW;
  END IF;

  IF template_record.email_notifications_enabled IS FALSE THEN
    RAISE NOTICE 'Email notifications disabled for user: %', template_record.user_id;
    RETURN NEW;
  END IF;

  -- Build the payload
  payload := jsonb_build_object(
    'ownerEmail', template_record.owner_email,
    'ownerName', COALESCE(template_record.preferred_name, 'there'),
    'templateName', template_record.template_name,
    'businessName', template_record.business_name,
    'customerName', NEW.customer_name,
    'customerEmail', NEW.customer_email,
    'customerPhone', NEW.customer_phone,
    'customerNotes', NEW.customer_notes,
    'requestedDate', NEW.requested_date::TEXT,
    'requestedTime', NEW.requested_time::TEXT,
    'estimatedTotal', NEW.estimated_total,
    'submittedAt', NEW.submitted_at::TEXT,
    'submissionId', NEW.id::TEXT
  );

  -- Only proceed if we have a Supabase URL
  IF supabase_url IS NOT NULL THEN
    -- Call the edge function asynchronously using pg_net
    -- Note: pg_net extension must be enabled in Supabase
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/send-quote-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    ) INTO request_id;

    RAISE NOTICE 'Quote notification queued with request_id: %, payload: %', request_id, payload;
  ELSE
    RAISE WARNING 'Cannot send notification: Supabase URL not configured';
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the quote submission
    RAISE WARNING 'Error sending quote notification: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to send notification on quote insert
DROP TRIGGER IF EXISTS trigger_send_quote_notification ON quote_submissions;

CREATE TRIGGER trigger_send_quote_notification
  AFTER INSERT ON quote_submissions
  FOR EACH ROW
  EXECUTE FUNCTION send_quote_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_quote_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION send_quote_notification() TO anon;

-- Add helpful comment
COMMENT ON FUNCTION send_quote_notification() IS 'Sends email notification to template owner when a new quote is submitted. Uses Resend via edge function.';
COMMENT ON TRIGGER trigger_send_quote_notification ON quote_submissions IS 'Triggers email notification to template owner on new quote submission';

