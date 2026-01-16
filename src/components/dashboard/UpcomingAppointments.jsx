import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Video, Calendar, Clock, ExternalLink, ArrowRight, User } from "lucide-react";
import { format } from "date-fns";

export default function UpcomingAppointments({ submissions, isLoading, templates }) {
  // Filter for Calendly appointments that are upcoming and not canceled
  const upcomingAppointments = submissions
    .filter((submission) => {
      if (!submission.calendly_event_start_time) return false;
      if (submission.calendly_event_status === 'canceled') return false;

      const startTime = new Date(submission.calendly_event_start_time);
      return startTime > new Date();
    })
    .sort((a, b) => {
      return new Date(a.calendly_event_start_time) - new Date(b.calendly_event_start_time);
    })
    .slice(0, 5); // Show only next 5 appointments

  const getTemplateName = (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    return template?.business_name || "Unknown";
  };

  const formatAppointmentTime = (submission) => {
    const start = new Date(submission.calendly_event_start_time);
    const datePart = format(start, "EEE, MMM d");
    const timePart = format(start, "h:mm a");

    if (submission.calendly_event_end_time) {
      const end = new Date(submission.calendly_event_end_time);
      const endTimePart = format(end, "h:mm a");
      return { date: datePart, time: `${timePart} - ${endTimePart}` };
    }
    return { date: datePart, time: timePart };
  };

  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateString) => {
    const date = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50/50 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (upcomingAppointments.length === 0) {
    return null; // Don't show the section if no upcoming appointments
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50/50 to-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            Upcoming Appointments
          </CardTitle>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            {upcomingAppointments.length} scheduled
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingAppointments.map((appointment) => {
            const { date, time } = formatAppointmentTime(appointment);
            const today = isToday(appointment.calendly_event_start_time);
            const tomorrow = isTomorrow(appointment.calendly_event_start_time);

            return (
              <div
                key={appointment.id}
                className={`p-3 rounded-lg border transition-all hover:shadow-md ${
                  today
                    ? 'bg-green-50 border-green-200'
                    : tomorrow
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900 truncate">
                        {appointment.customer_name}
                      </span>
                      {today && (
                        <Badge className="bg-green-600 text-white text-xs px-1.5 py-0">
                          Today
                        </Badge>
                      )}
                      {tomorrow && (
                        <Badge className="bg-yellow-600 text-white text-xs px-1.5 py-0">
                          Tomorrow
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {getTemplateName(appointment.template_id)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link
                      to={`${createPageUrl("QuoteForm")}?template=${appointment.template_id}&submission=${appointment.id}&from=dashboard`}
                    >
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        View
                      </Button>
                    </Link>
                    {appointment.calendly_invitee_uri && (
                      <a
                        href={appointment.calendly_invitee_uri.replace('api.calendly.com', 'calendly.com').replace('/invitees/', '/events/')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-0.5 justify-center"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {upcomingAppointments.length > 0 && (
          <Link to={createPageUrl("QuoteManagement")} className="block mt-4">
            <Button variant="outline" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50">
              View All Submissions
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
