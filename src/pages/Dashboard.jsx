
import React, { useState, useEffect } from "react";

import { QuoteTemplate, QuoteSubmission, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  PlusCircle,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Edit,
  Share2,
  Copy,
  CheckCircle,
  X,
  Sparkles,
  Star,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createCheckoutSession } from "@/api/functions";

import StatsOverview from "../components/dashboard/StatsOverview";
import TemplateCard from "../components/dashboard/TemplateCard";
import RecentSubmissions from "../components/dashboard/RecentSubmissions";

export default function Dashboard() {
  const [templates, setTemplates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [personalSubmissions, setPersonalSubmissions] = useState([]); // New state for personal submissions
  const [isLoading, setIsLoading] = useState(true);
  const [copiedTemplate, setCopiedTemplate] = useState(null);
  const [user, setUser] = useState(null); // Added user state
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log("=== DASHBOARD MOUNT - STRIPE REDIRECT CHECK ===");
    
    // Check for Stripe redirect query params FIRST
    const urlParams = new URLSearchParams(window.location.search);
    const isStripeSuccess = urlParams.get('stripe_success');
    const isStripeCanceled = urlParams.get('stripe_canceled');
    
    console.log("URL Parameters:", {
      fullURL: window.location.href,
      search: window.location.search,
      stripe_success: isStripeSuccess,
      stripe_canceled: isStripeCanceled,
    });
    
    if (isStripeSuccess) {
      console.log("✅ STRIPE SUCCESS DETECTED - Starting upgrade flow");
      
      // Give webhook a moment to process, then reload data
      toast.success("Payment successful! Loading your upgraded account...", {
        duration: 3000,
      });
      
      console.log("⏳ Waiting 2 seconds for webhook to process...");
      
      // Wait for webhook to process (2 seconds should be enough)
      const checkUpgradeStatus = async (attemptNumber = 1) => {
        console.log(`⏰ Attempt ${attemptNumber}: Loading user data after payment...`);
        
        try {
          await loadData();
          console.log("✅ Data loaded successfully after payment");
          
          // Get fresh user data by calling User.me() again
          const freshUser = await User.me();
          console.log("Fresh user data after reload:", {
            email: freshUser.email,
            tier: freshUser.subscription_tier,
            status: freshUser.subscription_status,
          });
          
          // Check if upgrade was successful
          if (freshUser?.subscription_tier === 'premium') {
            console.log("🎉 User successfully upgraded to premium!");
            
            // Dispatch event to refresh Layout/navbar
            console.log("📡 Dispatching userUpdated event to refresh navbar...");
            window.dispatchEvent(new CustomEvent('userUpdated'));
            
            toast.success("Welcome to LushQuote Premium! 🎉", {
              duration: 5000,
            });
          } else {
            console.warn(`⚠️ Attempt ${attemptNumber}: User tier is still: ${freshUser?.subscription_tier}`);
            
            if (attemptNumber < 3) {
              // Try again (max 3 attempts)
              toast.info("Processing your upgrade... Please wait.", {
                duration: 3000,
              });
              console.log(`⏳ Will retry in 2 seconds (attempt ${attemptNumber + 1}/3)...`);
              setTimeout(() => checkUpgradeStatus(attemptNumber + 1), 2000);
            } else {
              console.error("❌ Failed to detect upgrade after 3 attempts");
              
              // Still dispatch event to refresh navbar (might have updated by now)
              console.log("📡 Dispatching userUpdated event (final attempt)...");
              window.dispatchEvent(new CustomEvent('userUpdated'));
              
              toast.warning("Payment processed! If you don't see Premium status, please refresh the page.", {
                duration: 8000,
              });
            }
          }
        } catch (error) {
          console.error(`❌ ERROR loading data (attempt ${attemptNumber}):`, error);
          toast.error("There was an error loading your account. Please refresh the page.", {
            duration: 6000,
          });
        }
      };
      
      // Start checking after 2 seconds
      setTimeout(() => checkUpgradeStatus(1), 2000);
      
      // Clean up URL
      console.log("🧹 Cleaning up URL parameters");
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } else if (isStripeCanceled) {
      console.log("❌ STRIPE CANCELED DETECTED");
      toast.error("Your upgrade was canceled. You are still on the free plan.");
      loadData();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } else {
      // Normal load
      console.log("📋 Normal dashboard load (no Stripe redirect)");
      loadData();
    }
  }, []);

  const loadData = async () => {
    console.log("🔄 loadData() called at:", new Date().toISOString());
    setIsLoading(true);
    
    try {
      console.log("📡 Fetching current user data from User.me()...");
      const currentUser = await User.me();

      // **ADD COMPREHENSIVE DASHBOARD LOADING LOG**
      console.log("=== DASHBOARD LOAD DEBUG LOG ===");
      console.log("CURRENT USER:");
      console.log("  - Email:", currentUser.email);
      console.log("  - Role:", currentUser.role);
      console.log("  - Subscription Tier:", currentUser.subscription_tier);
      console.log("  - Subscription Status:", currentUser.subscription_status);
      console.log("  - Stripe Customer ID:", currentUser.stripe_customer_id);
      console.log("  - Stripe Subscription ID:", currentUser.stripe_subscription_id);
      console.log("  - Monthly Submission Count:", currentUser.monthly_submission_count);
      console.log("  - Full User Object:", currentUser);

      // Monthly counter is automatically reset by database triggers
      // No manual reset needed

      setUser(currentUser);
      
      console.log("✅ User state updated in Dashboard:", {
        email: currentUser.email,
        tier: currentUser.subscription_tier,
      });

      const [userTemplates, submissionsData] = await Promise.all([
        QuoteTemplate.filter({ user_id: currentUser.id }, "-updated_date"),
        QuoteSubmission.list("-created_date", 1000)
      ]);

      console.log("TEMPLATES LOADED:");
      console.log("  - Count:", userTemplates.length);
      userTemplates.forEach((template, index) => {
        console.log(`  - Template ${index + 1}:`, {
          id: template.id,
          business_name: template.business_name,
          created_by: template.created_by,
          owner_email: template.owner_email,
          owner_subscription_tier: template.owner_subscription_tier
        });
      });

      console.log("SUBMISSIONS LOADED:");
      console.log("  - Total Submissions Count:", submissionsData.length);
      submissionsData.forEach((submission, index) => {
        console.log(`  - Submission ${index + 1}:`, {
          id: submission.id,
          template_id: submission.template_id,
          owner_email: submission.owner_email,
          customer_name: submission.customer_name,
          customer_email: submission.customer_email,
          status: submission.status
        });
      });
      
      console.log("VISIBILITY CHECK:");
      console.log("  - Current User Email:", currentUser.email);
      console.log("  - Current User Role:", currentUser.role);
      console.log("  - Submissions Visible to User:");
      submissionsData.forEach((submission, index) => {
        const isVisible = submission.owner_email === currentUser.email || currentUser.role === 'admin';
        console.log(`    - Submission ${index + 1} (${submission.customer_name}): ${isVisible ? '✅ VISIBLE' : '❌ HIDDEN'}`);
        console.log(`      - Owner Email: ${submission.owner_email}`);
        console.log(`      - Match: ${submission.owner_email === currentUser.email}`);
        console.log(`      - Is Admin: ${currentUser.role === 'admin'}`);
      });
      
      console.log("=== END DASHBOARD LOAD LOG ===");

      // Filter for stats (Admins see all)
      const userVisibleSubmissions = submissionsData.filter(submission => 
        submission.owner_email === currentUser.email || currentUser.role === 'admin'
      );

      // NEW: Filter for "Recent Submissions" component (everyone sees only their own)
      const personalSubs = submissionsData.filter(submission => 
        submission.owner_email === currentUser.email
      );

      setTemplates(userTemplates);
      setSubmissions(userVisibleSubmissions); // This is for the main stats
      setPersonalSubmissions(personalSubs); // This is specifically for the "Recent Submissions" list
      
      console.log("=== END DASHBOARD LOAD LOG ===");
      console.log("✅ loadData() completed successfully");

    } catch (error) {
      console.error("❌ ERROR in loadData():", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    setIsLoading(false);
    console.log("🏁 loadData() finished, isLoading set to false");
  };

  const copyTemplateLink = async (template) => {
    try {
      const link = `${window.location.origin}${createPageUrl("QuoteForm")}?template=${template.id}`;
      await navigator.clipboard.writeText(link);
      setCopiedTemplate(template.id);
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      console.warn("Clipboard API not supported, using fallback", error);
      const textArea = document.createElement("textarea");
      const link = `${window.location.origin}${createPageUrl("QuoteForm")}?template=${template.id}`;
      textArea.value = link;
      // Position off-screen
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback copying text command was ' + msg);
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }

      document.body.removeChild(textArea);
      setCopiedTemplate(template.id);
      setTimeout(() => setCopiedTemplate(null), 2000);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete || !deleteConfirmed) return;

    setIsDeleting(true);
    try {
      await QuoteSubmission.delete(submissionToDelete.id);
      setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete.id));
      setPersonalSubmissions(prev => prev.filter(s => s.id !== submissionToDelete.id)); // Also update personal submissions
      console.log(`Submission ${submissionToDelete.id} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting submission:", error);
      alert("Failed to delete submission. Please try again.");
    } finally {
      setIsDeleting(false);
      setSubmissionToDelete(null);
      setDeleteConfirmed(false);
    }
  };

  const handleUpgrade = async () => {
    console.log("💳 handleUpgrade() called - Starting checkout process");
    setIsRedirecting(true);
    
    try {
      console.log("📡 Calling createCheckoutSession()...");
      const response = await createCheckoutSession();
      
      console.log("✅ Checkout session response received:", response);
      
      if (response.data.url) {
        console.log("🔗 Redirecting to Stripe checkout URL:", response.data.url);
        window.location.href = response.data.url;
      } else {
        console.error("❌ No URL in checkout session response:", response);
        toast.error("Could not start upgrade process. Please try again.");
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error("❌ ERROR creating checkout session:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error("An error occurred. Please try again later.");
      setIsRedirecting(false);
    }
  };

  const stats = {
    totalTemplates: templates.length,
    totalSubmissions: submissions.length, // This still uses the 'all visible' submissions for stats
    totalRevenue: submissions.reduce((sum, sub) => sum + (sub.calculated_price || 0), 0),
    averageQuoteValue: submissions.length > 0 ? Math.round(submissions.reduce((sum, sub) => sum + (sub.calculated_price || 0), 0) / submissions.length) : 0,
    userTier: user?.subscription_tier || 'free',
    monthlySubmissionCount: user?.monthly_submission_count || 0
  };

  // Logic for free tier template limit: free users can only create 1 template
  const canCreateTemplate = user?.subscription_tier === 'premium' || templates.length < 1;


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/40 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
              Quote Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-lg">
              Manage your quote templates and track submissions
            </p>
          </div>
          {canCreateTemplate ? (
            <Link to={createPageUrl("TemplateBuilder")} className="w-full lg:w-auto">
              <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <PlusCircle className="w-5 h-5 mr-2" />
                Create New Template
              </Button>
            </Link>
          ) : (
            <Button
              onClick={() => setShowUpgradeDialog(true)}
              className="w-full lg:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create New Template
            </Button>
          )}
        </div>

        {/* Stats Overview */}
        <StatsOverview stats={stats} isLoading={isLoading} />

        {/* Templates and Recent Submissions */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Templates */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Templates</h2>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {templates.length} Active
              </Badge>
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : templates.length > 0 ? (
              <div className="grid gap-6">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    submissions={personalSubmissions.filter(s => s.template_id === template.id)} // This should likely be personal submissions too
                    onCopyLink={copyTemplateLink}
                    copiedTemplate={copiedTemplate}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-green-200 bg-green-50/30">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-green-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
                  <p className="text-gray-600 text-center mb-6 max-w-md">
                    Create your first quote template to start collecting customer information and generating quotes
                  </p>
                  <Link to={createPageUrl("TemplateBuilder")} className="w-full max-w-xs">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create First Template
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Submissions Sidebar */}
          <div className="space-y-6 lg:mt-14 flex flex-col">
            <RecentSubmissions
              submissions={personalSubmissions}
              isLoading={isLoading}
              templates={templates}
              onDelete={setSubmissionToDelete}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!submissionToDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSubmissionToDelete(null);
            setDeleteConfirmed(false);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-red-600 text-lg">Delete Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-gray-700 text-sm leading-relaxed">
              Are you sure you want to delete the submission from{" "}
              <span className="font-bold">{submissionToDelete?.customer_name}</span>?
              This action cannot be undone.
            </p>

            <div className="flex items-center space-x-2 bg-red-50 p-3 rounded-lg border border-red-200">
              <Checkbox
                id="dashboard-delete-confirm"
                checked={deleteConfirmed}
                onCheckedChange={(checked) => setDeleteConfirmed(checked)}
              />
              <Label htmlFor="dashboard-delete-confirm" className="text-xs text-red-800 font-medium cursor-pointer leading-tight">
                I understand this action cannot be undone
              </Label>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button
                variant="destructive"
                onClick={handleDeleteSubmission}
                disabled={!deleteConfirmed || isDeleting}
                className="bg-red-600 hover:bg-red-700 w-full h-11"
              >
                {isDeleting ? "Deleting..." : "Delete Submission"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmissionToDelete(null);
                  setDeleteConfirmed(false);
                }}
                className="w-full h-11"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              You've reached the template limit for the free plan. Upgrade to create unlimited templates!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-green-800">Premium Plan Benefits</h3>
              <ul className="list-disc list-inside mt-2 text-sm text-green-700 space-y-1">
                <li>Create unlimited quote templates</li>
                <li>Receive unlimited monthly submissions</li>
                <li>Remove LushQuote branding from forms</li>
                <li>Export all submission data to CSV</li>
              </ul>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white h-12 text-lg font-semibold"
              onClick={handleUpgrade}
              disabled={isRedirecting}
            >
              {isRedirecting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Star className="w-5 h-5 mr-2" />}
              {isRedirecting ? "Redirecting..." : "Upgrade for $19.99/month"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowUpgradeDialog(false)} disabled={isRedirecting}>
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
