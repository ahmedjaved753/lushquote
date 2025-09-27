
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CurrencyIcon = ({ className }) => <span className={`${className} flex items-center justify-center text-3xl font-bold leading-none`}>¤</span>;

export default function StatsOverview({ stats, isLoading }) {
  const isFreeTier = stats.userTier === 'free';

  const statCards = [
    {
      title: "Templates Created",
      value: stats.totalTemplates,
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: isFreeTier ? "Monthly Submissions" : "Total Submissions", 
      value: isFreeTier ? `${stats.monthlySubmissionCount} / 25` : stats.totalSubmissions,
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      title: "Total Quote Value",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: CurrencyIcon,
      color: "from-emerald-500 to-emerald-600", 
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700"
    },
    {
      title: "Average Quote Value",
      value: `$${stats.averageQuoteValue.toLocaleString()}`,
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50", 
      textColor: "text-purple-700"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full transform translate-x-8 -translate-y-8`} />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <div className="text-right">
                <CardTitle className="text-sm font-medium text-gray-500 mb-1">
                  {stat.title}
                </CardTitle>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
