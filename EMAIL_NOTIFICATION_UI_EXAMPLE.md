# Email Notification Settings - UI Example

Add email notification settings to your user Settings page.

## Settings Component Addition

Add this section to your `src/pages/Settings.jsx`:

```jsx
import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Bell, CheckCircle } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Email notification settings
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("email_notifications_enabled, notification_email")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setEmailNotificationsEnabled(data.email_notifications_enabled ?? true);
        setNotificationEmail(data.notification_email || user.email);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          email_notifications_enabled: emailNotificationsEnabled,
          notification_email: notificationEmail || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Email Notifications Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Manage how you receive notifications about new quote submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">
                Quote Submission Notifications
              </Label>
              <p className="text-sm text-gray-500">
                Receive an email when someone submits a quote on your template
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotificationsEnabled}
              onCheckedChange={setEmailNotificationsEnabled}
            />
          </div>

          {/* Notification Email Input */}
          {emailNotificationsEnabled && (
            <div className="space-y-2 pl-0 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="notification-email">
                Notification Email Address
              </Label>
              <Input
                id="notification-email"
                type="email"
                placeholder="notifications@example.com"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Leave empty to use your account email: {user?.email}
              </p>
            </div>
          )}

          {/* What You'll Receive */}
          {emailNotificationsEnabled && (
            <Alert className="bg-purple-50 border-purple-200">
              <Bell className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-gray-700">
                <strong>You'll receive notifications for:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>New quote submissions with customer details</li>
                  <li>Customer contact information and preferences</li>
                  <li>Estimated quote total and requested services</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={saveSettings}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {loading ? "Saving..." : "Save Notification Settings"}
            </Button>

            {saved && (
              <div className="flex items-center gap-2 text-green-600 animate-in fade-in slide-in-from-left-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Saved successfully!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Other settings sections... */}
    </div>
  );
}
```

## Email Notification Preview Component (Optional)

Create a component to show users what the notification email looks like:

```jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export function EmailNotificationPreview() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Email Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-lg text-white text-center">
            <h2 className="text-2xl font-bold">New Quote Submission!</h2>
          </div>

          <div className="bg-white p-6 rounded-b-lg">
            <p className="mb-4">Hi [Your Name],</p>
            <p className="mb-4">
              Great news! You have received a new quote submission for your
              template <strong>[Template Name]</strong>.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-bold text-purple-600 mb-2">Quote Details</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Customer:</strong> John Smith
                </p>
                <p>
                  <strong>Email:</strong> john@example.com
                </p>
                <p>
                  <strong>Estimated Total:</strong> $1,500.00
                </p>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700">
              View Quote in Dashboard
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-4 text-center">
          This is a preview. Actual emails will include complete quote details.
        </p>
      </CardContent>
    </Card>
  );
}
```

## Quick Settings Toggle (Optional)

Add a quick toggle in your navigation or dashboard:

```jsx
import { Bell, BellOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";

export function QuickNotificationToggle() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSetting();
  }, [user]);

  const loadSetting = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_profiles")
      .select("email_notifications_enabled")
      .eq("id", user.id)
      .single();

    if (data) {
      setEnabled(data.email_notifications_enabled ?? true);
    }
  };

  const toggleNotifications = async (newValue) => {
    setLoading(true);
    setEnabled(newValue);

    try {
      await supabase
        .from("user_profiles")
        .update({ email_notifications_enabled: newValue })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error toggling notifications:", error);
      setEnabled(!newValue); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50">
      {enabled ? (
        <Bell className="h-4 w-4 text-purple-600" />
      ) : (
        <BellOff className="h-4 w-4 text-gray-400" />
      )}
      <span className="text-sm font-medium">Notifications</span>
      <Switch
        checked={enabled}
        onCheckedChange={toggleNotifications}
        disabled={loading}
      />
    </div>
  );
}
```

## Testing the UI

1. **Load Settings**: Settings should load from `user_profiles` table
2. **Toggle Notifications**: Should update `email_notifications_enabled` field
3. **Custom Email**: Should update `notification_email` field
4. **Validation**: Validate email format before saving
5. **Feedback**: Show success/error messages after save

## Database Query Examples

```sql
-- Check current notification settings
SELECT
  id,
  email_notifications_enabled,
  notification_email
FROM user_profiles
WHERE id = 'your-user-id';

-- Enable notifications for a user
UPDATE user_profiles
SET email_notifications_enabled = true
WHERE id = 'your-user-id';

-- Set custom notification email
UPDATE user_profiles
SET notification_email = 'custom@example.com'
WHERE id = 'your-user-id';

-- Get all users with notifications enabled
SELECT
  up.id,
  au.email as account_email,
  up.notification_email,
  up.email_notifications_enabled
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.email_notifications_enabled = true;
```

## Additional Features to Consider

1. **Notification Types**: Add granular control (new quotes, status changes, etc.)
2. **Quiet Hours**: Allow users to set do-not-disturb times
3. **Digest Emails**: Option for daily/weekly summary instead of instant notifications
4. **SMS Notifications**: Integrate Twilio for text message alerts
5. **Webhook Integration**: Let users connect to Slack, Discord, etc.
6. **Email Templates**: Let users customize their notification email template

## Accessibility Considerations

- Use proper ARIA labels for switches
- Ensure sufficient color contrast
- Provide clear descriptions for screen readers
- Keyboard navigation support
- Clear error messages

## Mobile Responsive Design

The components above use Tailwind CSS and are mobile-responsive by default. Test on:

- Mobile devices (< 640px)
- Tablets (640px - 1024px)
- Desktop (> 1024px)
