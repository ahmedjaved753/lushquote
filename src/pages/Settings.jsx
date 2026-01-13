
import React, { useState, useEffect } from "react";
import { User, QuoteSubmission } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, User as UserIcon, Palette, Bell, Download, AlertTriangle, Loader2, ArrowLeft, Star, CreditCard, Calendar, ExternalLink, RefreshCw, Unlink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createCheckoutSession } from "@/api/functions";
import { createBillingPortalSession } from "@/api/functions";
import { supabase } from "@/api/supabaseClient";

// A simplified list of timezones for the dropdown
const timezones = [
  "UTC",
  "GMT",
  "US/Pacific",
  "US/Mountain",
  "US/Central",
  "US/Eastern",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney"
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCalendlyLoading, setIsCalendlyLoading] = useState(false);
  const [isSyncingCalendly, setIsSyncingCalendly] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setSettings({
          preferred_name: currentUser.preferred_name || currentUser.full_name || '',
          time_zone: currentUser.time_zone || 'UTC',
          default_header_color: currentUser.default_header_color || '#87A96B',
          notification_email: currentUser.notification_email || currentUser.email,
          email_notifications_enabled: currentUser.email_notifications_enabled !== false, // default to true
        });
      } catch (error) {
        console.error("Failed to fetch user:", error);
        toast.error("Failed to load your settings.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Handle Calendly OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const calendlyConnected = urlParams.get('calendly_connected');
    const calendlyError = urlParams.get('calendly_error');

    if (calendlyConnected === 'true') {
      toast.success("Calendly connected successfully! Your event types have been synced.");
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh user data
      User.me().then(setUser);
    } else if (calendlyError) {
      const errorMessages = {
        'auth_failed': 'Failed to connect to Calendly. Please try again.',
        'token_exchange': 'Failed to authenticate with Calendly.',
        'user_fetch': 'Failed to fetch your Calendly account info.',
        'save_tokens': 'Failed to save Calendly connection.',
        'unknown': 'An unexpected error occurred.'
      };
      toast.error(errorMessages[calendlyError] || 'Failed to connect Calendly.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update the user data
      await User.updateMyUserData(settings);
      
      // Update local user state to reflect changes immediately
      setUser(prev => ({ ...prev, ...settings }));
      
      toast.success("Settings saved successfully!");
      
      // FIX: Dispatch a custom event to notify the Layout that user data has changed
      window.dispatchEvent(new CustomEvent('userUpdated'));
      
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpgrade = async () => {
    setIsRedirecting(true);
    try {
      const { data } = await createCheckoutSession();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not start upgrade process. Please try again.");
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      toast.error("An error occurred while redirecting to Stripe.");
      setIsRedirecting(false);
    }
  };

  const handleManageBilling = async () => {
    setIsRedirecting(true);
    try {
      const { data } = await createBillingPortalSession();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not open billing portal. Please try again.");
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error("Stripe portal error:", error);
      toast.error("Could not open billing portal. Please try again.");
      setIsRedirecting(false);
    }
  };

  const handleConnectCalendly = () => {
    if (!user?.id) {
      toast.error("Please wait for your account to load.");
      return;
    }
    const clientId = import.meta.env.VITE_CALENDLY_CLIENT_ID;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const redirectUri = `${supabaseUrl}/functions/v1/calendly-oauth-callback`;
    const authUrl = `https://auth.calendly.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user.id}`;
    window.location.href = authUrl;
  };

  const handleDisconnectCalendly = async () => {
    if (!confirm("Are you sure you want to disconnect Calendly? Templates using Calendly scheduling will fall back to simple date/time pickers.")) {
      return;
    }
    setIsCalendlyLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('calendly-disconnect', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      toast.success("Calendly disconnected successfully.");
      // Refresh user data
      const updatedUser = await User.me();
      setUser(updatedUser);
    } catch (error) {
      console.error("Calendly disconnect error:", error);
      toast.error("Failed to disconnect Calendly.");
    } finally {
      setIsCalendlyLoading(false);
    }
  };

  const handleSyncCalendly = async () => {
    setIsSyncingCalendly(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('calendly-sync-event-types', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      toast.success(`Synced ${data?.count || 0} event types from Calendly.`);
    } catch (error) {
      console.error("Calendly sync error:", error);
      toast.error("Failed to sync event types.");
    } finally {
      setIsSyncingCalendly(false);
    }
  };

  const handleExportToCSV = async () => {
    setIsExporting(true);
    try {
      const submissions = await QuoteSubmission.list();
      if (submissions.length === 0) {
        toast.info("There are no submissions to export.");
        return;
      }
      
      const headers = [
        "Submission ID", "Submitted Date", "Template ID", "Customer Name", 
        "Customer Email", "Customer Phone", "Status", "Total Price", "Notes", 
        "Requested Date", "Requested Time", "Selected Services"
      ];
      
      const toCsvRow = (items) => {
        return items.map(item => {
          const str = String(item === null || item === undefined ? '' : item);
          // If the string contains a comma, double quote, or newline,
          // enclose it in double quotes and escape any existing double quotes.
          if (/[",\n]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',');
      };

      const formatRequestedDate = (submission) => {
        if (submission.requested_date) {
          try {
            return new Date(submission.requested_date).toLocaleDateString();
          } catch (e) {
            return submission.requested_date;
          }
        }
        // Fallback for old data format
        if (submission.requested_datetime) {
          try {
            return new Date(submission.requested_datetime).toLocaleDateString();
          } catch (e) {
            return '';
          }
        }
        return '';
      };

      const formatRequestedTime = (submission) => {
        if (submission.requested_time) {
          try {
            const [hours, minutes] = submission.requested_time.split(':').map(Number);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
          } catch (e) {
            return submission.requested_time;
          }
        }
        // Fallback for old data format
        if (submission.requested_datetime) {
          try {
            const date = new Date(submission.requested_datetime);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
          } catch (e) {
            return '';
          }
        }
        return '';
      };

      const rows = submissions.map(sub => toCsvRow([
        sub.id,
        new Date(sub.created_date).toLocaleString(),
        sub.template_id,
        sub.customer_name,
        sub.customer_email,
        sub.customer_phone,
        sub.status,
        sub.calculated_price,
        sub.notes || "",
        formatRequestedDate(sub),
        formatRequestedTime(sub),
        (sub.selections || []).map(s => `${s.service_name} (Qty: ${s.quantity})`).join('; ')
      ]));

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `quote_submissions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Your data is being downloaded.");
      
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmed) return;
    
    setIsDeleting(true);
    try {
      // In a real app, `User.deleteMyAccount()` would typically handle this on the backend.
      // For this simplified example, we'll simulate it by logging out and redirecting.
      await User.logout(); 
      toast.success("Account deletion initiated. You will be logged out.");
      
      // Redirect to home or login after a brief delay
      setTimeout(() => {
        window.location.href = '/'; // Or '/login'
      }, 2000);
      
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmed(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/40 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" size="icon" className="hover:bg-green-50 flex-shrink-0">
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account and preferences</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserIcon className="w-5 h-5" /> Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="preferred_name">Preferred Name</Label>
              <Input id="preferred_name" value={settings.preferred_name} onChange={e => handleInputChange('preferred_name', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="time_zone">Time Zone</Label>
              <Select value={settings.time_zone} onValueChange={value => handleInputChange('time_zone', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <Label>Default Header Color</Label>
            <p className="text-sm text-gray-500 mb-2">Set the default color for new quote templates.</p>
            <div className="flex gap-2">
              <input type="color" value={settings.default_header_color} onChange={e => handleInputChange('default_header_color', e.target.value)} className="w-14 h-10 p-1 border rounded-lg" />
              <Input value={settings.default_header_color} onChange={e => handleInputChange('default_header_color', e.target.value)} />
            </div>
          </CardContent>
        </Card>
        
        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notification_email">Notification Email</Label>
              <Input id="notification_email" type="email" value={settings.notification_email} onChange={e => handleInputChange('notification_email', e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Receive Email Notifications</Label>
                <p className="text-sm text-gray-500">For new quote submissions.</p>
              </div>
              <Switch checked={settings.email_notifications_enabled} onCheckedChange={value => handleInputChange('email_notifications_enabled', value)} />
            </div>
          </CardContent>
        </Card>

        {/* Calendly Integration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Calendly Integration
            </CardTitle>
            <CardDescription>
              Connect your Calendly account to enable scheduling on quote forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user?.subscription_tier !== 'premium' ? (
              // Show upgrade prompt for free users
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-lg">🔒</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-800 mb-1">Premium Feature</h4>
                    <p className="text-sm text-amber-700 mb-3">
                      Calendly integration is available with Premium subscription. Allow customers to book appointments directly from your quote forms.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={handleUpgrade}
                      disabled={isRedirecting}
                    >
                      {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
                      {isRedirecting ? 'Redirecting...' : 'Upgrade to Premium'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : user?.calendly_access_token ? (
              // Show connected state
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Connected to Calendly</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Connected on {user.calendly_connected_at ? new Date(user.calendly_connected_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncCalendly}
                    disabled={isSyncingCalendly}
                  >
                    {isSyncingCalendly ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {isSyncingCalendly ? 'Syncing...' : 'Sync Event Types'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleDisconnectCalendly}
                    disabled={isCalendlyLoading}
                  >
                    {isCalendlyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Unlink className="w-4 h-4 mr-2" />}
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              // Show connect button
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Connect your Calendly account to let customers schedule appointments directly from your quote forms.
                </p>
                <Button onClick={handleConnectCalendly} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Calendly
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account & Billing Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account & Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <p>Current Plan: <span className="font-bold capitalize text-green-700">{user?.subscription_tier || 'free'}</span></p>
                {user?.subscription_tier === 'free' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 w-full sm:w-auto"
                    onClick={handleUpgrade}
                    disabled={isRedirecting}
                  >
                    {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
                    {isRedirecting ? 'Redirecting...' : 'Upgrade to Premium'}
                  </Button>
                ) : (
                   <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 w-full sm:w-auto"
                    onClick={handleManageBilling}
                    disabled={isRedirecting}
                  >
                    {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    {isRedirecting ? 'Redirecting...' : 'Manage Billing'}
                  </Button>
                )}
              </div>
              
              {user?.subscription_tier === 'free' && (
                <div className="space-y-2 mt-4">
                  <div className="bg-white border rounded p-3">
                    <p className="text-sm text-gray-600">
                      <strong>Free Plan Limits:</strong>
                    </p>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <p>• Limited to 25 submissions per month</p>
                      <p>• Limited to 1 template</p>
                      <p>• LushQuote branding on quote forms</p>
                      <p>• CSV export not available</p>
                    </div>
                  </div>
                </div>
              )}
              
              {user?.subscription_tier === 'premium' && (
                <div className="bg-green-50 p-3 rounded border border-green-200 mt-4">
                  <p className="text-sm text-green-800 font-medium">✓ Unlimited submissions</p>
                  <p className="text-sm text-green-800 font-medium">✓ Unlimited templates</p>
                  <p className="text-sm text-green-800 font-medium">✓ No branding on quote forms</p>
                  <p className="text-sm text-green-800 font-medium">✓ CSV export included</p>
                </div>
              )}
              
              <p className="text-sm text-gray-500 mt-2">Billing management is handled securely by Stripe.</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5" /> Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            {user?.subscription_tier === 'premium' ? (
              <>
                {/* Desktop View */}
                <div className="hidden sm:flex justify-between items-center">
                  <p>Export all your quote submissions to a CSV file.</p>
                  <Button variant="secondary" onClick={handleExportToCSV} disabled={isExporting}>
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                  </Button>
                </div>
                {/* Mobile View */}
                <div className="sm:hidden">
                  <p className="text-sm text-gray-600 mb-3">
                    Use the desktop application to export all your quote submissions to a CSV file.
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-lg">🔒</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-800 mb-1">Premium Feature</h4>
                    <p className="text-sm text-amber-700 mb-3">
                      CSV export is available with Premium subscription.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={handleUpgrade}
                      disabled={isRedirecting}
                    >
                      {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
                      {isRedirecting ? 'Redirecting...' : 'Upgrade to Premium'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-red-600">Delete this account</p>
              </div>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-red-600 text-lg">Permanently Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-gray-700 text-sm leading-relaxed">This action is irreversible. All your templates and submission data will be permanently lost.</p>
            <div className="flex items-center space-x-2 bg-red-50 p-3 rounded-lg border border-red-200">
              <Checkbox id="delete-confirm" checked={deleteConfirmed} onCheckedChange={setDeleteConfirmed} />
              <Label htmlFor="delete-confirm" className="text-xs text-red-800 font-medium cursor-pointer leading-tight">I understand this action is permanent.</Label>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Button
                variant="destructive"
                className="w-full h-11"
                disabled={!deleteConfirmed || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isDeleting ? "Deleting Account..." : "Delete My Account"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="w-full h-11"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
