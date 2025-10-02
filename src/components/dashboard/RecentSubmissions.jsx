
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Clock, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecentSubmissions({ submissions, isLoading, templates, onDelete }) {
  const getTemplateName = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    return template?.business_name || "Unknown Template";
  };

  const statusColors = {
    new: "bg-yellow-100 text-yellow-800 border-yellow-200",
    viewed: "bg-blue-100 text-blue-800 border-blue-200", 
    contacted: "bg-purple-100 text-purple-800 border-purple-200",
    accepted: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    completed: "bg-gray-100 text-gray-800 border-gray-200"
  };

  const truncateName = (name, maxLength = 20) => { // Changed maxLength from 25 to 20
    if (!name) return '';
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
  };

  return (
    <Card className="shadow-lg border-0 flex-1 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">
            Recent Submissions
          </CardTitle>
          <Link to={createPageUrl("QuoteManagement")}>
            <button className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
              View All
              <ExternalLink className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))
        ) : submissions.length > 0 ? (
          submissions.map((submission) => (
            <div 
              key={submission.id}
              className="group relative p-4 border border-gray-100 rounded-lg hover:bg-gray-50/50 hover:border-green-200 transition-all duration-200"
            >
              <Link 
                to={createPageUrl("QuoteForm") + "?template=" + submission.template_id + "&submission=" + submission.id + "&from=dashboard"}
                className="block cursor-pointer pr-8"
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span 
                    className="font-medium text-gray-900 text-sm truncate"
                    title={submission.customer_name || submission.customer_email} // Added title for full name on hover
                  >
                    {truncateName(submission.customer_name || submission.customer_email)}
                  </span>
                  <Badge className={`${statusColors[submission.status]} text-xs border pointer-events-none flex-shrink-0`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">
                  {getTemplateName(submission.template_id)}
                </p>
                
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1 text-green-600">
                    <span className="font-semibold">
                      ${submission.calculated_price?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-3 h-3" />
                    {(() => {
                      const date = submission.created_date || submission.submitted_at;
                      if (!date) return "No date";
                      try {
                        const dateObj = new Date(date);
                        return isNaN(dateObj.getTime()) ? "Invalid date" : format(dateObj, "MMM d");
                      } catch (error) {
                        return "Invalid date";
                      }
                    })()}
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent link navigation
                  onDelete(submission);
                }}
                className="absolute top-1 right-1 h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-2xl">📋</span>
            </div>
            <p className="text-gray-500 text-sm">No submissions yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Share your templates to start receiving quotes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
