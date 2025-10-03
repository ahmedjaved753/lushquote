-- Create RPC function to increment submission counter for template owner
-- This is called from the client after a successful quote submission

CREATE OR REPLACE FUNCTION increment_submission_counter(template_id UUID)
RETURNS JSON AS $$
DECLARE
    template_owner_id UUID;
    owner_tier TEXT;
    current_count INTEGER;
    result JSON;
BEGIN
    -- Get the template owner's ID and subscription tier
    SELECT qt.user_id, up.subscription_tier, up.monthly_submission_count
    INTO template_owner_id, owner_tier, current_count
    FROM quote_templates qt
    JOIN user_profiles up ON qt.user_id = up.id
    WHERE qt.id = template_id;

    -- Check if template was found
    IF template_owner_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Template not found'
        );
    END IF;

    -- Increment the counter for the template owner
    -- Note: We increment for all users to track stats, but limits are only enforced on free tier
    UPDATE user_profiles
    SET monthly_submission_count = monthly_submission_count + 1
    WHERE id = template_owner_id;

    -- Get the updated count
    SELECT monthly_submission_count INTO current_count
    FROM user_profiles
    WHERE id = template_owner_id;

    -- Return success with updated count
    RETURN json_build_object(
        'success', true,
        'owner_id', template_owner_id,
        'tier', owner_tier,
        'new_count', current_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
-- (anonymous users need this to submit public quote forms)
GRANT EXECUTE ON FUNCTION increment_submission_counter(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_submission_counter(UUID) TO anon;
