
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

// Mock User service for demonstration purposes.
// In a real application, this would be an actual API call, context, or auth service.
const User = {
  me: async () => {
    return new Promise(resolve => {
      // Simulate an API call delay
      setTimeout(() => {
        // This is a placeholder user object.
        // In a real app, this would come from your backend/auth system.
        // Change 'free' to 'premium' to test the premium tier scenario.
        resolve({
          id: 'mock-user-123',
          name: 'Mock User',
          email: 'mock@example.com',
          subscription_tier: 'free' // Can be 'free' or 'premium'
        });
      }, 500);
    });
  }
};

// Helper component for rendering service sections - moved outside to prevent re-creation
const ServiceSection = ({ title, services, selections, setSelections, isViewingSubmission = false }) => {
  console.log(`[TemplatePreview ServiceSection Debug] Rendering ${title} section with ${services.length} services`);
  
  if (!services || services.length === 0) return null;

  const handleCheckboxChange = (id, checked) => {
    console.log(`[TemplatePreview ServiceSection Debug] handleCheckboxChange called - ID: ${id}, Checked: ${checked}`);
    if (isViewingSubmission) return;
    setSelections(prev => {
      const newSelections = {...prev, [id]: checked ? 1 : 0 };
      console.log(`[TemplatePreview ServiceSection Debug] Checkbox - New selections:`, newSelections);
      return newSelections;
    });
  };

  const handleStepperChange = (id, delta) => {
    console.log(`[TemplatePreview ServiceSection Debug] handleStepperChange called - ID: ${id}, Delta: ${delta}`);
    if (isViewingSubmission) return;
    const current = selections[id] || 0;
    const newValue = Math.max(0, current + delta);
    console.log(`[TemplatePreview ServiceSection Debug] Stepper - Current: ${current}, New: ${newValue}`);
    setSelections(prev => {
      const newSelections = {...prev, [id]: newValue };
      console.log(`[TemplatePreview ServiceSection Debug] Stepper - New selections:`, newSelections);
      return newSelections;
    });
  };

  const handleTextInputChange = (id, value) => {
    console.log(`[TemplatePreview ServiceSection Debug] handleTextInputChange called - ID: ${id}, Value: ${value}`);
    if (isViewingSubmission) return;
    const quantity = parseInt(value, 10);
    const finalQuantity = isNaN(quantity) || quantity <= 0 ? 0 : quantity;
    console.log(`[TemplatePreview ServiceSection Debug] Text Input - Parsed quantity: ${finalQuantity}`);
    setSelections(prev => {
      const newSelections = {...prev, [id]: finalQuantity };
      console.log(`[TemplatePreview ServiceSection Debug] Text Input - New selections:`, newSelections);
      return newSelections;
    });
  };

  const handleInputFocus = (id) => {
    console.log(`[TemplatePreview ServiceSection Debug] Input focused for service ${id}`);
  };

  const handleInputBlur = (id) => {
    console.log(`[TemplatePreview ServiceSection Debug] Input blurred for service ${id}`);
  };

  const renderSelectionInput = (service) => {
    const selectionMethod = service.selection_method || "checkbox";
    const currentValue = selections[service.id] || 0;

    console.log(`[TemplatePreview ServiceSection Debug] Rendering selection input for ${service.name} - Method: ${selectionMethod}, Current Value: ${currentValue}`);

    if (selectionMethod === "checkbox") {
      return (
        <input
          type="checkbox"
          id={`preview-service-${service.id}`}
          checked={currentValue > 0}
          onChange={(e) => {
            console.log(`[TemplatePreview ServiceSection Debug] Checkbox onChange triggered - Service: ${service.id}, Checked: ${e.target.checked}`);
            handleCheckboxChange(service.id, e.target.checked);
          }}
          onFocus={() => handleInputFocus(service.id)}
          onBlur={() => handleInputBlur(service.id)}
          className="w-6 h-6 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
        />
      );
    } else if (selectionMethod === "text_input") {
      return (
        <Input
          key={`preview-input-${service.id}`}
          id={`preview-service-${service.id}`}
          type="number"
          min="0"
          value={currentValue > 0 ? currentValue : ''}
          onChange={(e) => {
            console.log(`[TemplatePreview ServiceSection Debug] Text Input onChange triggered - Service: ${service.id}, New Value: ${e.target.value}`);
            handleTextInputChange(service.id, e.target.value);
          }}
          onFocus={() => handleInputFocus(service.id)}
          onBlur={() => handleInputBlur(service.id)}
          placeholder="Qty" 
          className="w-24 h-10 text-center"
        />
      );
    } else { // This covers the "numeric" method (stepper)
      return (
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => {
              console.log(`[TemplatePreview ServiceSection Debug] Stepper minus clicked for service ${service.id}`);
              handleStepperChange(service.id, -1);
            }}
            disabled={currentValue <= 0 || isViewingSubmission}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 font-medium"
          >
            −
          </button>
          <div className="px-4 py-2 w-16 text-center font-medium bg-white">
            {currentValue}
          </div>
          <button
            type="button"
            onClick={() => {
              console.log(`[TemplatePreview ServiceSection Debug] Stepper plus clicked for service ${service.id}`);
              handleStepperChange(service.id, 1);
            }}
            disabled={isViewingSubmission}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
      {services.map((service, index) => {
        console.log(`[TemplatePreview ServiceSection Debug] Rendering service ${service.id} (${service.name}) - Index: ${index}, Selection Method: ${service.selection_method || 'checkbox (default)'}, Current Value: ${selections[service.id] || 0}`);
        return (
          <div key={service.id} className="p-4 border rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <Label className="font-medium text-base">{service.name}</Label>
                {service.description && (
                  <p className="text-sm font-normal text-gray-500 mt-1">{service.description}</p>
                )}
                <div className="font-semibold text-gray-800 mt-2">
                  ${service.price.toFixed(2)}
                  {service.unit_label && ` / ${service.unit_label}`}
                  {service.frequency && ` / ${service.frequency}`}
                </div>
              </div>
              
              <div className="flex-shrink-0 self-center sm:self-auto">
                {renderSelectionInput(service)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Function to generate time slots
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

export default function TemplatePreview({ template }) {
  console.log(`[TemplatePreview Debug] Component rendering/re-rendering`);
  
  const [selections, setSelections] = useState({});
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [requestedDate, setRequestedDate] = useState(null);
  const [requestedTime, setRequestedTime] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [templateOwner, setTemplateOwner] = useState(null); // Add template owner state

  console.log(`[TemplatePreview Debug] Current selections state:`, selections);
  
  React.useEffect(() => {
    console.log(`[TemplatePreview Debug] selections state changed:`, selections);
  }, [selections]);

  React.useEffect(() => {
    console.log(`[TemplatePreview Debug] template changed:`, template?.business_name);
  }, [template]);

  // Initialize selections for all services
  React.useEffect(() => {
    if (template.services) {
      console.log(`[TemplatePreview Debug] Initializing selections for ${template.services.length} services`);
      const initialSelections = {};
      template.services.forEach(service => {
        initialSelections[service.id] = 0;
        console.log(`[TemplatePreview Debug] Initialized service ${service.id} with quantity 0`);
      });
      setSelections(initialSelections);
    }

    // Fetch template owner for branding
    const fetchTemplateOwner = async () => {
      try {
        // Assuming template.created_by exists and is used to identify the owner
        // For this mock, we'll just fetch a generic user from the mock User service.
        // In a real application, you might fetch user by template.created_by ID.
        const currentUser = await User.me();
        setTemplateOwner(currentUser);
      } catch (error) {
        console.error("Could not fetch current user for template owner check:", error);
        // Optionally set a default or handle the error gracefully
        setTemplateOwner(null);
      }
    };

    // The original logic (if/else both calling fetchTemplateOwner) implicitly meant
    // to always fetch a mock user for templateOwner when the effect runs.
    // This simplification preserves that original behavior.
    fetchTemplateOwner();
  }, [template.services, template.created_by, template]);

  // Calculate total price
  const calculatedPrice = React.useMemo(() => {
    if (!template.services) return 0;
    
    console.log(`[TemplatePreview Debug] Calculating price for selections:`, selections);
    let total = 0;
    template.services.forEach(service => {
      const quantity = selections[service.id] || 0;
      if (quantity > 0) {
        console.log(`[TemplatePreview Debug] Price calc - Service: ${service.name}, Quantity: ${quantity}, Price: ${service.price}, Line Total: ${service.price * quantity}`);
        total += service.price * quantity;
      }
    });
    console.log(`[TemplatePreview Debug] Total calculated price: ${total}`);
    return total;
  }, [selections, template.services]);

  const branding = template.branding || {};
  const primaryColor = branding.primary_color || "#87A96B";
  const timeSlots = generateTimeSlots();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-2xl border-0 overflow-hidden">
        {/* Header with Branding */}
        <div 
          className="px-8 py-6 text-white text-center"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center justify-between">
            <div className="w-full">
              <h1 className="text-3xl font-bold mb-2">{template.business_name}</h1>
              {template.description && (
                <p className="opacity-85 text-lg">{template.description}</p>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-8 space-y-8">
          {/* Service Sections */}
          <ServiceSection 
            title="Fixed Price Services" 
            services={template.services?.filter(s => s.type === 'fixed')} 
            selections={selections}
            setSelections={setSelections}
            isViewingSubmission={false}
          />
          <ServiceSection 
            title="Per Unit Services" 
            services={template.services?.filter(s => s.type === 'per_unit')} 
            selections={selections}
            setSelections={setSelections}
            isViewingSubmission={false}
          />
          <ServiceSection 
            title="Recurring Services" 
            services={template.services?.filter(s => s.type === 'recurring')} 
            selections={selections}
            setSelections={setSelections}
            isViewingSubmission={false}
          />

          {(!template.services || template.services.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>No services configured yet.</p>
              <p className="text-sm">Add services in the builder to see them here.</p>
            </div>
          )}

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
                      <Button variant="outline" className={`w-full justify-center sm:justify-start text-center sm:text-left font-normal h-12 ${!requestedDate ? "text-muted-foreground" : ""}`}>
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
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} 
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
                  <Select value={requestedTime} onValueChange={setRequestedTime}>
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
                  </Select>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Customer Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 text-center sm:text-left">Your Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="customerName">Full Name*</Label>
                <Input 
                  id="customerName" 
                  value={customerInfo.name} 
                  onChange={e => setCustomerInfo(p => ({...p, name: e.target.value}))} 
                  required
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
              />
            </div>
            <div>
              <Label htmlFor="customerNotes">Message/Notes</Label>
              <Textarea 
                id="customerNotes" 
                value={customerInfo.notes} 
                onChange={e => setCustomerInfo(p => ({...p, notes: e.target.value}))}
                placeholder="Any additional details or questions?" 
                rows={3} 
              />
            </div>
          </div>

          {/* Total & Submit - Fixed for mobile */}
          <div className="bg-gradient-to-r from-gray-50 to-green-50/30 rounded-xl p-6">
            <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <span className="text-xl font-medium text-gray-900">Estimated Total:</span>
              <span 
                className="text-3xl font-bold" 
                style={{ color: primaryColor }}
              >
                ${calculatedPrice.toFixed(2)}
              </span>
            </div>
          </div>
          
          <Button 
            className="w-full text-white font-semibold py-3 h-auto text-lg" 
            style={{ backgroundColor: primaryColor }}
          >
            Submit Quote Request
          </Button>
          
          {/* Footer Text */}
          {template.footer_enabled && template.footer_text && (
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                {template.footer_text.includes("LushQuote") ? (
                  <>
                    This quote template was made on <a href="https://www.lushquote.com" target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium underline">LushQuote</a>.
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
  );
}
