
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Edit, 
  Copy, 
  CheckCircle, 
  Users, 
  Box,
  Eye
} from "lucide-react";

export default function TemplateCard({ 
  template, 
  submissions, 
  onCopyLink, 
  copiedTemplate 
}) {
  const totalValue = submissions.reduce((sum, sub) => sum + (sub.calculated_price || 0), 0);
  
  return (
    <Card className="group hover:bg-gray-50/50 hover:border-green-200 transition-all duration-200 border shadow-md bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="pb-4">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
              {template.business_name}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mt-1">
              {template.description}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Link to={createPageUrl("TemplateBuilder") + "?edit=" + template.id}>
              <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm" 
              onClick={() => onCopyLink(template)}
              className="hover:bg-green-50 hover:text-green-600"
            >
              {copiedTemplate === template.id ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2 p-3 sm:gap-4 sm:p-4 bg-gradient-to-r from-gray-50 to-green-50/30 rounded-lg">
          <div className="text-center">
            <Users className="w-5 h-5 text-gray-500 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-gray-900">{submissions.length}</div>
            <div className="text-[10px] sm:text-xs text-gray-500">Submissions</div>
          </div>
          <div className="text-center">
            <div className="w-5 h-5 text-green-600 mx-auto mb-1 flex items-center justify-center text-xl sm:text-3xl font-bold leading-none">¤</div>
            <div className="flex justify-center text-lg sm:text-2xl font-bold text-green-700">
              ${totalValue.toLocaleString()}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">Total Value</div>
          </div>
          <div className="text-center">
            <Box className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-gray-900">
              {template.services?.length || 0}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">Services</div>
          </div>
        </div>
        
        <div className="mt-4 flex gap-3">
          <Link 
            to={createPageUrl("QuoteManagement") + "?template=" + template.id}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Submissions
            </Button>
          </Link>
          <Link 
            to={createPageUrl("QuoteForm") + "?template=" + template.id}
            target="_blank"
            className="flex-1"
          >
            <Button variant="secondary" size="sm" className="w-full">
              Preview Form
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
