
import React, { useState, useEffect } from "react";
import { QuoteSubmission, QuoteTemplate, User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Mail,
  Phone,
  Calendar,
  Filter,
  Eye,
  ArrowLeft,
  Trash2,
  MoreHorizontal,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuoteManagement() {
  const [submissions, setSubmissions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState("all");
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const templateIdFromUrl = urlParams.get('template');
      if (templateIdFromUrl) {
        setSelectedTemplate(templateIdFromUrl);
      }
      await loadData();
    };
    fetchUserAndData();
  }, []);

  useEffect(() => {
    const handleFocus = () => { loadData(); };
    const handleVisibilityChange = () => { if (!document.hidden) { loadData(); } };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let filtered = [...submissions];
    if (selectedStatus !== "all") {
      filtered = filtered.filter(sub => sub.status === selectedStatus);
    }
    if (selectedTemplate !== "all") {
      filtered = filtered.filter(sub => sub.template_id === selectedTemplate);
    }
    setFilteredSubmissions(filtered);
  }, [submissions, selectedStatus, selectedTemplate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log("=== QUOTE MANAGEMENT LOAD DEBUG LOG ===");
      
      // First get current user
      const currentUser = await User.me();
      setUser(currentUser); // Also set user state
      console.log("CURRENT USER IN QUOTE MANAGEMENT:");
      console.log("  - Email:", currentUser.email);
      console.log("  - Role:", currentUser.role);
      console.log("  - Subscription Tier:", currentUser.subscription_tier);
      
      const [submissionsData, templatesData] = await Promise.all([
        QuoteSubmission.list("-created_date"),
        QuoteTemplate.filter({ created_by: currentUser.email }, "-created_date")
      ]);
      
      console.log("RAW SUBMISSIONS LOADED:");
      console.log("  - Total Count:", submissionsData.length);
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
      
      console.log("TEMPLATES LOADED:");
      console.log("  - Total Count:", templatesData.length);
      templatesData.forEach((template, index) => {
        console.log(`  - Template ${index + 1}:`, {
          id: template.id,
          business_name: template.business_name,
          created_by: template.created_by,
          owner_email: template.owner_email
        });
      });
      
      console.log("VISIBILITY CHECK FOR SUBMISSIONS:");
      submissionsData.forEach((submission, index) => {
        const isVisible = submission.owner_email === currentUser.email;
        console.log(`  - Submission ${index + 1} (${submission.customer_name}): ${isVisible ? '✅ VISIBLE' : '❌ HIDDEN'}`);
        console.log(`    - Submission Owner Email: "${submission.owner_email}"`);
        console.log(`    - Current User Email: "${currentUser.email}"`);
        console.log(`    - Email Match: ${submission.owner_email === currentUser.email}`);
      });
      
      console.log("=== END QUOTE MANAGEMENT LOAD LOG ===");

      // NEW: Filter submissions on the frontend - everyone sees only their own
      const userVisibleSubmissions = submissionsData.filter(submission => 
        submission.owner_email === currentUser.email
      );
      
      setSubmissions(userVisibleSubmissions);
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const updateSubmissionStatus = async (submissionId, newStatus) => {
    try {
      await QuoteSubmission.update(submissionId, { status: newStatus });
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? { ...sub, status: newStatus } : sub
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async () => {
    if (!submissionToDelete || !deleteConfirmed) return;
    setIsDeleting(true);
    try {
      await QuoteSubmission.delete(submissionToDelete.id);
      setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete.id));
    } catch (error) {
      console.error("Error deleting submission:", error);
    } finally {
      setIsDeleting(false);
      setSubmissionToDelete(null);
      setDeleteConfirmed(false);
    }
  };

  const getTemplateName = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    return template?.business_name || "Unknown Template";
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatRequestDateTime = (submission) => {
    if (submission.requested_date) {
      const datePart = format(parseISO(submission.requested_date), "MMM d, yyyy");
      const timePart = submission.requested_time ? ` at ${formatTime(submission.requested_time)}` : '';
      return datePart + timePart;
    }
    if (submission.requested_time) {
      return `Time: ${formatTime(submission.requested_time)}`;
    }
    if (submission.requested_datetime) {
      return format(new Date(submission.requested_datetime), "MMM d, yyyy 'at' p");
    }
    return null;
  };
  
  const statusColors = {
    new: "bg-yellow-100 text-yellow-800 border-yellow-200",
    viewed: "bg-blue-100 text-blue-800 border-blue-200",
    contacted: "bg-purple-100 text-purple-800 border-purple-200",
    accepted: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    completed: "bg-gray-100 text-gray-800 border-gray-200"
  };

  const totalValue = filteredSubmissions.reduce((sum, sub) => sum + (sub.calculated_price || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/40 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 w-full">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" size="icon" className="hover:bg-green-50 flex-shrink-0">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
                Quote Submissions
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base lg:text-lg">
                Manage and track all your quote requests
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg border-0 w-full">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="font-medium text-gray-700 text-sm sm:text-base">Filters:</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full h-10 sm:h-auto">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="w-full h-10 sm:h-auto">
                      <SelectValue placeholder="Filter by template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Templates</SelectItem>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.business_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-center sm:justify-start">
                  <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md text-center">
                    Showing {filteredSubmissions.length} of {submissions.length} submissions
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 sm:space-y-6">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i} className="shadow-lg border-0">
                <CardContent className="p-3 sm:p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredSubmissions.length > 0 ? (
            filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="shadow-lg border hover:border-green-200 transition-all duration-300">
                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-3 sm:space-y-6">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base sm:text-lg lg:text-xl text-gray-900 break-words" title={submission.customer_name}>
                          {submission.customer_name}
                        </h3>
                        <span className="text-2xl sm:text-3xl font-bold text-green-700">
                          ${submission.calculated_price?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className={`${statusColors[submission.status]} text-sm px-3 py-1 pointer-events-none`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                        <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="break-all leading-tight">{submission.customer_email}</span>
                      </div>
                      {submission.customer_phone && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="break-all">{submission.customer_phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg break-words leading-tight">
                          {getTemplateName(submission.template_id)}
                        </p>
                        <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-500">
                          <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="break-words leading-tight">
                            Submitted {formatDate(submission.created_date)}
                          </span>
                        </div>
                        { (submission.requested_date || submission.requested_time || submission.requested_datetime) && (
                          <div className="flex items-start gap-2 text-xs sm:text-sm text-green-700">
                            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="font-medium break-words leading-tight">
                              Requested: {formatRequestDateTime(submission)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {submission.notes && (
                      <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Customer Notes:</h4>
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                          {submission.notes}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full h-11 sm:h-12 text-sm sm:text-base">
                              <MoreHorizontal className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                              Update Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                            <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => updateSubmissionStatus(submission.id, "contacted")}>Contacted</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => updateSubmissionStatus(submission.id, "accepted")}>Accepted</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => updateSubmissionStatus(submission.id, "rejected")}>Rejected</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => updateSubmissionStatus(submission.id, "completed")}>Completed</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full h-11 sm:h-12 text-sm sm:text-base">
                              <MoreHorizontal className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                              More Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl("QuoteForm") + "?template=" + submission.template_id + "&submission=" + submission.id} className="w-full cursor-pointer text-sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer text-sm" onClick={() => setSubmissionToDelete(submission)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 sm:p-12 text-center">
                <Mail className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No submissions found</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  {selectedStatus !== "all" || selectedTemplate !== "all"
                    ? "Try adjusting your filters to see more submissions."
                    : "Share your quote templates to start receiving submissions."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <Dialog 
        open={!!submissionToDelete} 
        onOpenChange={(isOpen) => { if (!isOpen) { setSubmissionToDelete(null); setDeleteConfirmed(false); } }}
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
              <Checkbox id="delete-confirm" checked={deleteConfirmed} onCheckedChange={(checked) => setDeleteConfirmed(checked)} />
              <Label htmlFor="delete-confirm" className="text-xs text-red-800 font-medium cursor-pointer leading-tight">
                I understand this action cannot be undone
              </Label>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="destructive" onClick={handleDelete} disabled={!deleteConfirmed || isDeleting} className="bg-red-600 hover:bg-red-700 w-full h-11">
                {isDeleting ? "Deleting..." : "Delete Submission"}
              </Button>
              <Button variant="outline" onClick={() => { setSubmissionToDelete(null); setDeleteConfirmed(false); }} className="w-full h-11" disabled={isDeleting}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
