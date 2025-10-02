
import React, { useState, useEffect, useCallback, memo } from "react";
import { QuoteTemplate, QuoteSubmission, User } from "@/api/entities";
import { incrementSubmissionCounter, createPublicQuoteSubmission } from "@/api/functions";
import { getTemplatePublicData } from "@/api/functions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2, ArrowLeft, Home, CalendarIcon, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, formatISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select as TimeSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Helper component for rendering service sections
const ServiceSection = ({ title, services, selections, setSelections, isViewingSubmission = false }) => {
  console.log(`[ServiceSection Debug] Rendering ${title} section with ${services.length} services`);

  if (services.length === 0) return null;

  const handleCheckboxChange = (id, checked) => {
    console.log(`[ServiceSection Debug] handleCheckboxChange called - ID: ${id}, Checked: ${checked}`);
    if (isViewingSubmission) return;
    setSelections(prev => ({...prev, [id]: checked ? 1 : 0 })); // 1 for checked, 0 for unchecked
  };

  const handleStepperChange = (id, delta) => {
    console.log(`[ServiceSection Debug] handleStepperChange called - ID: ${id}, Delta: ${delta}`);
    if (isViewingSubmission) return;
    const current = selections[id] || 0; // Default to 0 if not set
    const newValue = Math.max(0, current + delta); // Ensure quantity doesn't go below 0
    setSelections(prev => ({...prev, [id]: newValue }));
  };

  const handleTextInputChange = (id, value) => {
    console.log(`[ServiceSection Debug] handleTextInputChange called - ID: ${id}, Value: ${value}`);
    if (isViewingSubmission) return;
    const quantity = parseInt(value, 10);
    // If input is empty or invalid, treat as 0. Otherwise use parsed quantity.
    setSelections(prev => ({...prev, [id]: isNaN(quantity) || quantity <= 0 ? 0 : quantity }));
  };

  const renderSelectionInput = (service) => {
    const selectionMethod = service.selection_method; // Use service's selection_method directly
    const currentValue = selections[service.id] || 0; // Default to 0 for unselected state

    console.log(`[ServiceSection Debug] Rendering selection input for ${service.name} - Method: ${selectionMethod}, Value: ${currentValue}`);

    if (selectionMethod === "checkbox") {
      return (
        <input
          type="checkbox"
          id={`service-${service.id}`}
          checked={currentValue > 0} // Checked if quantity is > 0
          onChange={(e) => handleCheckboxChange(service.id, e.target.checked)}
          disabled={isViewingSubmission}
          className="w-6 h-6 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
        />
      );
    } else if (selectionMethod === "text_input") {
      return (
        <Input
          type="number"
          min="0" // Allow 0 to indicate not selected or cleared
          value={currentValue > 0 ? currentValue : ''} // Display empty if 0, otherwise the number
          onChange={(e) => handleTextInputChange(service.id, e.target.value)}
          placeholder="Qty"
          disabled={isViewingSubmission}
          className={`w-24 h-10 text-center ${isViewingSubmission ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />
      );
    } else { // This covers the "numeric" method (stepper) or any other undefined/unspecified method
      return (
        <div className={`flex items-center border border-gray-300 rounded-lg overflow-hidden ${isViewingSubmission ? 'bg-gray-50' : ''}`}>
          <button
            type="button"
            onClick={() => handleStepperChange(service.id, -1)}
            disabled={currentValue <= 0 || isViewingSubmission}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 font-medium"
          >
            −
          </button>
          <div className={`px-4 py-2 w-16 text-center font-medium ${isViewingSubmission ? 'bg-gray-50 text-gray-700' : 'bg-white'}`}>
            {currentValue}
          </div>
          <button
            type="button"
            onClick={() => handleStepperChange(service.id, 1)}
            disabled={isViewingSubmission}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium"
          >
            +
          </button>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 text-center sm:text-left">{title}</h3>
      {services.map((s, index) => {
        console.log(`[ServiceSection Debug] Rendering service ${s.id} (${s.name}) - Index: ${index}, Selection Method: ${s.selection_method || 'numeric (default)'}, Current Value: ${selections[s.id] || 0}`);
        return (
          <div key={s.id} className="p-4 border rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <Label htmlFor={`service-${s.id}`} className="font-medium text-base">{s.name}</Label>
                {s.description && <p className="text-sm font-normal text-gray-500 mt-1">{s.description}</p>}
                <div className="font-semibold text-gray-800 mt-2">
                  ${s.price.toFixed(2)}
                  {s.unit_label && ` / ${s.unit_label}`}
                  {s.frequency && ` / ${s.frequency}`}
                </div>
              </div>

              <div className="flex-shrink-0 self-center sm:self-auto">
                {renderSelectionInput(s)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Function to generate time slots for the time picker
const generateTimeSlots = () => {
  const slots = [];
  for (let i = 8; i <= 17; i++) { // 8 AM to 5 PM
    slots.push(`${String(i).padStart(2, '0')}:00`);
    if (i < 17) {
      slots.push(`${String(i).padStart(2, '0')}:30`);
    }
  }
  return slots;
};

export default function QuoteForm() {
  console.log(`[QuoteForm Debug] Component rendering/re-rendering`);

  const [template, setTemplate] = useState(null);
  const [selections, setSelections] = useState({});
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', notes: '' });
  const [requestedDate, setRequestedDate] = useState(null);
  const [requestedTime, setRequestedTime] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [isViewingSubmission, setIsViewingSubmission] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isOverLimit, setIsOverLimit] = useState(false); // Add over limit state

  console.log(`[QuoteForm Debug] Current selections state:`, selections);

  useEffect(() => {
    console.log(`[QuoteForm Debug] selections state changed:`, selections);
  }, [selections]);

  useEffect(() => {
    console.log(`[QuoteForm Debug] template state changed:`, template?.business_name);
  }, [template]);

  useEffect(() => {
    console.log("=== QUOTE FORM DEBUG LOG START ===");
    console.log("--- FETCHING TEMPLATE DATA ---");
    setIsLoading(true);
    setError(null);

    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    const submissionId = urlParams.get('submission');

    console.log(`[QuoteForm Debug] Template ID: ${templateId}, Submission ID: ${submissionId}`);

    if (!templateId) {
      console.error("[QuoteForm Debug] No template ID found in URL.");
      setError("missing_template_id");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log("[QuoteForm Debug] Fetching public template data...");
        console.log("[QuoteForm Debug] Template ID:", templateId);
        const response = await getTemplatePublicData(templateId);
        console.log("[QuoteForm Debug] Full response:", response);
        
        if (!response.data) {
          console.error("[QuoteForm Debug] No data in response:", response);
          throw new Error("No template data returned");
        }
        
        const { template: templateData, owner } = response.data;

        console.log("[QuoteForm Debug] Template loaded:", templateData.business_name);
        console.log("[QuoteForm Debug] Owner data:", owner);
        console.log("[QuoteForm Debug] Owner subscription tier:", owner.subscription_tier);
        console.log("[QuoteForm Debug] Owner monthly submission count:", owner.monthly_submission_count);

        // Check for submission limit BEFORE setting state
        const ownerTier = owner.subscription_tier || 'free'; // Fix: treat undefined as free
        console.log("[QuoteForm Debug] Evaluated owner tier:", ownerTier);

        if (ownerTier === 'free' && owner.monthly_submission_count >= 25) {
          console.log("%c[QuoteForm Debug] SUBMISSION LIMIT REACHED!", "color: red; font-weight: bold;");
          console.log("[QuoteForm Debug] Owner tier:", ownerTier);
          console.log("[QuoteForm Debug] Current count:", owner.monthly_submission_count);
          console.log("[QuoteForm Debug] Setting isOverLimit to true");
          setIsOverLimit(true);
          setIsLoading(false);
          return; // Stop processing
        } else {
          console.log("[QuoteForm Debug] Submission limit check passed:");
          console.log("[QuoteForm Debug] - Owner tier:", ownerTier);
          console.log("[QuoteForm Debug] - Current count:", owner.monthly_submission_count);
          console.log("[QuoteForm Debug] - Is free?", ownerTier === 'free');
          console.log("[QuoteForm Debug] - Count >= 25?", owner.monthly_submission_count >= 25);
        }

        if (!templateData || !templateData.is_active) {
          console.log("[QuoteForm Debug] Template is not active or not found");
          setError("This quote form is currently unavailable.");
          setIsLoading(false);
          return;
        }

        let finalTemplate = { ...templateData };

        // **FIX**: Read subscription tier directly from owner data
        const ownerSubscriptionTier = ownerTier; // Use the same evaluated tier
        console.log("[QuoteForm Debug] Owner subscription tier from template:", ownerSubscriptionTier);

        if (ownerSubscriptionTier === 'free') {
          // Enforce branding for free users
          console.log("[QuoteForm Debug] Enforcing free tier branding");
          finalTemplate.footer_enabled = true;
          finalTemplate.footer_text = "This quote form was made on LushQuote. Create your own quotes instantly and streamline your business today!";
        }

        setTemplate(finalTemplate);

        // If we have a submission ID, we're in viewing mode
        if (submissionId) {
          console.log("[QuoteForm Debug] Fetching submission data...");
          setIsViewingSubmission(true); // Enable viewing mode

          try {
            const submissionData = await QuoteSubmission.get(submissionId);
            console.log("[QuoteForm Debug] Submission loaded:", submissionData);
            setSubmission(submissionData); // Store the submission data

            // **NEW: Auto-update status from 'new' to 'viewed' when opening for first time**
            if (submissionData.status === 'new') {
              console.log("[QuoteForm Debug] Auto-updating submission status from 'new' to 'viewed'");
              try {
                await QuoteSubmission.update(submissionId, { status: 'viewed' });
                // Update the local submission data to reflect the change
                setSubmission(prev => ({...prev, status: 'viewed' }));
              } catch (error) {
                console.error("[QuoteForm Debug] Error auto-updating submission status:", error);
                // Continue loading even if status update fails
              }
            }

            // Pre-populate customer info from submission
            setCustomerInfo({
              name: submissionData.customer_name || '',
              email: submissionData.customer_email || '',
              phone: submissionData.customer_phone || '',
              notes: submissionData.notes || ''
            });

            // Pre-populate selections from submission
            const submissionSelections = {};
            if (submissionData.selections) {
              submissionData.selections.forEach(selection => {
                submissionSelections[selection.service_id] = selection.quantity || 0;
              });
            }
            setSelections(submissionSelections);
            setCalculatedPrice(submissionData.estimated_total || 0); // Set calculated price from submission

            // Handle new and old date/time fields for viewing
            if (submissionData.requested_date) {
              setRequestedDate(new Date(submissionData.requested_date));
            }
            if (submissionData.requested_time) {
              setRequestedTime(submissionData.requested_time);
            }
            // For backward compatibility with old submissions
            if (submissionData.requested_datetime && !submissionData.requested_date) { // Only use if new fields are not present
              const fullDate = new Date(submissionData.requested_datetime);
              setRequestedDate(fullDate);
              const hours = fullDate.getHours().toString().padStart(2, '0');
              const minutes = fullDate.getMinutes().toString().padStart(2, '0');
              setRequestedTime(`${hours}:${minutes}`);
            }

          } catch (err) {
            console.error("[QuoteForm Debug] Error loading submission:", err);
            setError("Could not load submission details.");
            setIsLoading(false);
            return;
          }
        } else {
          // Initialize selections for a new form with default quantity of 0
          const initialSelections = {};
          (finalTemplate.services || []).forEach(service => { // Fix: ensure services is an array
            initialSelections[service.id] = 0; // Default to 0, user will select/increment
          });
          setSelections(initialSelections);
          // Calculated price will default to 0 and be updated by the price calculation useEffect
        }

      } catch (err) {
        console.error("[QuoteForm Debug] Error loading template:", err);
        setError("Could not load the quote form. It may have been removed.");
      } finally {
        console.log("[QuoteForm Debug] Fetch complete");
        console.log("[QuoteForm Debug] Final isOverLimit state:", isOverLimit);
        setIsLoading(false);
      }
    };

    fetchData();
    console.log("=== QUOTE FORM DEBUG LOG END ===");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log("[QuoteForm Debug] isOverLimit state changed to:", isOverLimit);
  }, [isOverLimit]);

  useEffect(() => {
    if (!template || isViewingSubmission) return;

    console.log(`[QuoteForm Debug] Price calculation useEffect triggered`);
    let total = 0;

    template.services.forEach(service => {
      const quantity = selections[service.id] || 0; // Use 0 as default if not selected
      console.log(`[QuoteForm Debug] Price calc - Service: ${service.name}, Quantity: ${quantity}, Price: ${service.price}`);
      if (quantity > 0) {
        total += service.price * quantity;
      }
    });

    console.log(`[QuoteForm Debug] Calculated price: ${total}`);
    setCalculatedPrice(total);
  }, [selections, template, isViewingSubmission]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("=== QUOTE SUBMISSION PROCESS STARTED ===");

    if (isViewingSubmission) {
      console.log("Attempted to submit while in viewing mode. Action prevented.");
      return;
    }

    // ADD DETAILED TEMPLATE DEBUG LOG
    console.log("=== TEMPLATE DEBUG LOG ===");
    console.log("Template ID:", template?.id);
    console.log("Template Business Name:", template?.business_name);
    console.log("Template Created By:", template?.created_by);
    console.log("Template Owner Email:", template?.owner_email);
    console.log("Template Owner Subscription Tier:", template?.owner_subscription_tier);
    console.log("Template Object:", template);
    console.log("=== END TEMPLATE DEBUG LOG ===");

    // NOTE: Removed submission limit check from frontend to prevent auth errors.

    // Reset previous submission errors
    setSubmissionError(null);

    // Step 1: Log initial state
    console.log("1. INITIAL STATE:");
    console.log("   - Customer Info:", customerInfo);
    console.log("   - Selections:", selections);
    console.log("   - Requested Date:", requestedDate);
    console.log("   - Requested Time:", requestedTime);
    console.log("   - Calculated Price:", calculatedPrice);
    console.log("   - Template ID:", template?.id);

    // Step 2: Validation
    console.log("2. VALIDATION CHECK:");
    if (!customerInfo.email || !customerInfo.name) {
      console.error("   - VALIDATION FAILED: Missing required fields");
      console.error("   - Name:", customerInfo.name ? "✓ Present" : "✗ Missing");
      console.error("   - Email:", customerInfo.email ? "✓ Present" : "✗ Missing");
      setSubmissionError("Please provide your name and email address.");
      return;
    }

    // Updated validation for optional date/time
    if (template.request_date_enabled && !template.request_date_optional && !requestedDate) {
      setSubmissionError("Please select a preferred date.");
      return;
    }
    if (template.request_time_enabled && !template.request_time_optional && !requestedTime) {
      setSubmissionError("Please select a preferred time.");
      return;
    }

    console.log("   - VALIDATION PASSED: All required fields present");

    setIsSubmitting(true);

    try {
      // Step 3: Process selections
      console.log("3. PROCESSING SELECTIONS:");
      const submissionSelections = [];
      template.services.forEach(s => {
        const quantity = selections[s.id] || 0; // Selections will now always have a quantity if service is visible, but handling 0 for safety.
        console.log(`   - Service "${s.name}": quantity=${quantity}, price=${s.price}`);

        if (quantity > 0) {
          const lineItem = {
            service_id: s.id,
            service_name: s.name,
            quantity: quantity,
            price_per_unit: s.price,
            line_total: s.price * quantity,
          };
          submissionSelections.push(lineItem);
          console.log(`   - Added line item:`, lineItem);
        }
      });

      console.log("4. FINAL SUBMISSION DATA:");
      const submissionData = {
        template_id: template.id,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_notes: customerInfo.notes,
        selected_services: submissionSelections,
        estimated_total: calculatedPrice,
        requested_date: requestedDate ? formatISO(requestedDate, { representation: 'date' }) : null,
        requested_time: requestedTime || null,
        status: 'new', // Set initial status to 'new'
      };

      // ADD COMPREHENSIVE SUBMISSION LOGGING
      console.log("=== COMPREHENSIVE SUBMISSION DEBUG LOG ===");
      console.log("VISITOR DETAILS:");
      console.log("  - Name:", customerInfo.name);
      console.log("  - Email:", customerInfo.email);
      console.log("  - Phone:", customerInfo.phone);
      console.log("  - Notes:", customerInfo.notes);
      console.log("TEMPLATE OWNERSHIP:");
      console.log("  - Template ID:", template.id);
      console.log("  - Owner Email (being saved):", template.owner_email);
      console.log("  - Owner Subscription Tier:", template.owner_subscription_tier);
      console.log("SUBMISSION DATA:");
      console.log("  - Full Submission Object:", submissionData);
      console.log("=== END COMPREHENSIVE SUBMISSION LOG ===");

      // Step 4: API Call
      console.log("5. MAKING API CALL TO CREATE QUOTE SUBMISSION...");
      console.log("   - Using createPublicQuoteSubmission() for anonymous access");
      console.log("   - Payload size:", JSON.stringify(submissionData).length, "characters");

      const { data: result, error: submissionError } = await createPublicQuoteSubmission(submissionData);
      
      if (submissionError) {
        throw submissionError;
      }

      console.log("6. SUBMISSION CREATION SUCCESS:");
      console.log("   - Created Submission ID:", result.id);
      console.log("   - Created Submission Data:", result);
      console.log("   - Customer Email in Created Record:", result.customer_email);
      console.log("   - Template ID in Created Record:", result.template_id);

      // Increment the counter AFTER successful submission
      if (template.owner_subscription_tier === 'free') {
          console.log("7. Incrementing submission counter for free user...");
          await incrementSubmissionCounter({
              owner_email: template.owner_email,
              owner_subscription_tier: template.owner_subscription_tier
          });
          console.log("8. Counter incremented successfully.");
      }

      console.log("7. SUCCESS: Quote submission completed successfully!");

      setIsSubmitted(true);

    } catch (err) {
      console.error("=== SUBMISSION ERROR ===");
      console.error("Error Type:", err.constructor.name);
      console.error("Error Message:", err.message);
      console.error("Full Error Object:", err);

      if (err.response) {
        console.error("HTTP Response Data:", err.response.data);
        console.error("HTTP Status Code:", err.response.status);
        console.error("HTTP Headers:", err.response.headers);
      }

      if (err.request) {
        console.error("Request Data:", err.request);
      }

      setSubmissionError("Error submitting quote request. Please try again.");
      console.error("=== END SUBMISSION ERROR ===");
    } finally {
      setIsSubmitting(false);
      console.log("8. SUBMISSION PROCESS COMPLETED (success or failure)");
      console.log("=== END QUOTE SUBMISSION PROCESS ===");
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  );

  // Handle missing template ID error with user-friendly message
  if (error === "missing_template_id") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md shadow-2xl border-0 text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Form Not Found</h2>
            <p className="text-gray-600 mb-6">
              This quote form link appears to be incomplete or invalid. Please use the correct link provided by the business.
            </p>
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md shadow-2xl border-0 text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Form</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show limit reached dialog for free users
  if (isOverLimit) {
    console.log("[QuoteForm Debug] Rendering limit reached dialog");
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const resetDate = nextMonth.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <style>{`
          .hide-dialog-close-button > button {
            display: none !important;
          }
        `}</style>
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent
            className="w-[95vw] max-w-md mx-auto hide-dialog-close-button"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 text-center">
                <span className="text-amber-600 text-lg">🔒</span>
                Submissions Temporarily Closed
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4 text-center">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 font-medium mb-2">
                  Monthly Submission Limit Reached
                </p>
                <p className="text-amber-700 text-sm">
                  This business has reached their monthly limit of 25 submissions for free accounts.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium mb-2">
                  When will submissions reopen?
                </p>
                <p className="text-green-700 text-sm">
                  Submissions will automatically reset on <strong>{resetDate}</strong> at the start of the new month.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium mb-2">
                  For the Business Owner
                </p>
                <p className="text-blue-700 text-sm">
                  Upgrade to Premium to receive unlimited monthly submissions and never miss a potential customer again.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md shadow-2xl border-0 text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Submitted!</h2>
            <p className="text-gray-600 mb-4">Thank you. The business has received your request and will be in touch shortly.</p>
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">Estimated Total: ${calculatedPrice.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!template) {
    // This case should ideally not be reached if isLoading and error are handled first,
    // but acts as a fallback if template is null after loading.
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  const branding = template.branding || {};
  const primaryColor = branding.primary_color || '#87A96B';

  const timeSlots = generateTimeSlots();

  // Check where the user came from to determine back button destination
  const urlParams = new URLSearchParams(window.location.search);
  const fromPage = urlParams.get('from');
  const backUrl = fromPage === 'dashboard' ? createPageUrl("Dashboard") : createPageUrl("QuoteManagement");

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      {console.log(`[QuoteForm Debug] Rendering main component JSX`)}
      <div className="max-w-3xl mx-auto">
        {isViewingSubmission && (
          <div className="mb-6">
            <Link to={backUrl}>
              <Button variant="outline" size="sm" className="hover:bg-green-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {fromPage === 'dashboard' ? 'Back to Dashboard' : 'Back to Submissions'}
              </Button>
            </Link>
          </div>
        )}

        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="p-8 text-white text-center" style={{ backgroundColor: primaryColor }}>
            <div className="flex items-center justify-between">
              <div className="w-full">
                <h1 className="text-3xl font-bold mb-2">{template.business_name}</h1>
                <p className="opacity-85 text-lg">{template.description}</p>
                {isViewingSubmission && ( // Display submission specific information
                  <div className="mt-4 bg-white/20 rounded-lg px-4 py-2 mx-auto max-w-sm">
                    <p className="text-sm font-medium">Viewing Submitted Quote</p>
                    {submission?.created_date && (
                      <p className="text-sm opacity-75">
                        Submitted on {new Date(submission.created_date).toLocaleDateString()}
                      </p>
                    )}
                    {(requestedDate || requestedTime) && (
                      <p className="text-sm opacity-75 mt-1">
                        Requested: {requestedDate && format(requestedDate, 'PPP')} {requestedTime}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {console.log(`[QuoteForm Debug] Rendering service sections with template services:`, template?.services?.length)}

              {/* Service Sections */}
              <ServiceSection
                title="Fixed Price Services"
                services={template?.services?.filter(s => s.type === 'fixed') || []}
                selections={selections}
                setSelections={setSelections}
                isViewingSubmission={isViewingSubmission}
              />
              <ServiceSection
                title="Per Unit Services"
                services={template?.services?.filter(s => s.type === 'per_unit') || []}
                selections={selections}
                setSelections={setSelections}
                isViewingSubmission={isViewingSubmission}
              />
              <ServiceSection
                title="Recurring Services"
                services={template?.services?.filter(s => s.type === 'recurring') || []}
                selections={selections}
                setSelections={setSelections}
                isViewingSubmission={isViewingSubmission}
              />

              <Separator />

              {/* Date/Time Request Section */}
              {(template.request_date_enabled || template.request_time_enabled) && (
                <div className="space-y-6">
                  {template.request_date_enabled && (
                    <div className="space-y-2">
                      <Label className="text-xl font-bold text-gray-900 flex items-center justify-center sm:justify-start">
                        Requested Date
                        {template.request_date_optional && <span className="text-sm font-normal text-gray-500 ml-2">(optional)</span>}
                      </Label>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-center sm:justify-start text-center sm:text-left font-normal h-12 ${!requestedDate && "text-muted-foreground"}`}
                            disabled={isViewingSubmission}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {requestedDate ? format(requestedDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={requestedDate}
                            onSelect={(date) => {
                              setRequestedDate(date);
                              setDatePickerOpen(false); // Close popover after selection
                            }}
                            initialFocus
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1)) || isViewingSubmission}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {template.request_time_enabled && (
                     <div className="space-y-2">
                      <Label className="text-xl font-bold text-gray-900 flex items-center justify-center sm:justify-start">
                        Requested Time
                        {template.request_time_optional && <span className="text-sm font-normal text-gray-500 ml-2">(optional)</span>}
                      </Label>
                      <TimeSelect value={requestedTime} onValueChange={setRequestedTime} disabled={isViewingSubmission}>
                        <SelectTrigger className="h-12 flex justify-center sm:justify-start items-center">
                          <SelectValue placeholder="Pick a time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map(time => {
                            const [hours, minutes] = time.split(':').map(Number);
                            const ampm = hours >= 12 ? 'PM' : 'AM';
                            const displayHours = hours % 12 || 12;
                            const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                            return <SelectItem key={time} value={time}>{displayTime}</SelectItem>;
                          })}
                        </SelectContent>
                      </TimeSelect>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Info - Disable inputs when viewing submission */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 text-center sm:text-left">Customer Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="customerName">Full Name*</Label>
                    <Input
                      id="customerName"
                      value={customerInfo.name}
                      onChange={e => setCustomerInfo(p => ({...p, name: e.target.value}))}
                      required
                      disabled={isViewingSubmission}
                      className={isViewingSubmission ? 'bg-gray-50' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email Address*</Label>
                    <Input
                      type="email"
                      id="customerEmail"
                      value={customerInfo.email}
                      onChange={e => setCustomerInfo(p => ({...p, email: e.target.value}))}
                      required
                      disabled={isViewingSubmission}
                      className={isViewingSubmission ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    type="tel"
                    id="customerPhone"
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo(p => ({...p, phone: e.target.value}))}
                    disabled={isViewingSubmission}
                    className={isViewingSubmission ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="customerNotes">Message/Notes</Label>
                  <Textarea
                    id="customerNotes"
                    value={customerInfo.notes}
                    onChange={e => setCustomerInfo(p => ({...p, notes: e.target.value}))}
                    disabled={isViewingSubmission}
                    className={isViewingSubmission ? 'bg-gray-50' : ''}
                    placeholder="Any additional details or questions?"
                    rows={3}
                  />
                </div>
              </div>

              {/* Validation Error Display */}
              {submissionError && (
                <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg relative flex items-center" role="alert">
                  <span className="block sm:inline flex-grow">{submissionError}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSubmissionError(null)}
                    className="h-8 w-8 text-red-600 hover:bg-red-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Total & Submit */}
              <div className="bg-gradient-to-r from-gray-50 to-green-50/30 rounded-xl p-6">
                <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                  <span className="text-xl font-medium text-gray-900">
                    {isViewingSubmission ? 'Submitted Total:' : 'Estimated Total:'}
                  </span>
                  <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                    ${calculatedPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {!isViewingSubmission && ( // Only show submit button if not in viewing mode
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white font-semibold py-3 h-auto text-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit Quote Request'}
                </Button>
              )}
            </form>

            {/* Footer Text */}
            {template.footer_enabled && template.footer_text && (
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  {template.footer_text.includes("LushQuote") ? (
                    <>
                      This quote form was made on <a href="https://www.lushquote.com" target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium underline">LushQuote</a>.
                      <br/>
                      Create your own quotes instantly and streamline your business today!
                    </>
                  ) : (
                    template.footer_text
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
