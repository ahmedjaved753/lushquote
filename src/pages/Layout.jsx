

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, QuoteTemplate } from "@/api/entities";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Settings,
  Flower2,
  User as UserIcon,
  LogOut,
  LogIn,
  Loader2, 
  Star, 
  Sparkles
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createCheckoutSession } from "@/api/functions";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Create Template",
    url: createPageUrl("TemplateBuilder"),
    icon: PlusCircle,
  },
  {
    title: "Quote Submissions",
    url: createPageUrl("QuoteManagement"),
    icon: FileText,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

const publicPages = ["QuoteForm"];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, userRole } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpgrade = async () => {
    setIsRedirecting(true);
    try {
      const response = await createCheckoutSession();
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error("Could not start upgrade process. Please try again.");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleNavClick = async (e, item) => {
    const evaluatedTier = user?.user_metadata?.subscription_tier || 'free';
    // Intercept clicks to the template builder for free users
    if (item.title === 'Create Template' && evaluatedTier === 'free') {
      e.preventDefault(); // Always stop the default link behavior first
      
      try {
        const userTemplates = await QuoteTemplate.filter({ created_by: user.email });
        
        if (userTemplates.length >= 1) {
          // If limit is reached, show the upgrade dialog
          setShowUpgradeDialog(true);
        } else {
          // If limit is not reached, proceed with navigation
          navigate(item.url);
        }
      } catch (error) {
        console.error("Error checking template limit during navigation:", error);
        toast.error("Could not verify your template limit. Please try again.");
      }
    }
  };
  
  // If it's a public page, just render the content without any layout wrapper
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  // This component should only be rendered inside protected routes now
  // So we don't need to handle unauthenticated states here

  // Skip loading screen - render layout directly if loading or authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/40">
      <style>
        {`
          :root {
            --lily-sage: #87A96B;
            --lily-lavender: #B8A9D1;
            --lily-gold: #F4D03F;
            --lily-pearl: #F8F9FA;
            --lily-mist: #E8F0E3;
          }
        `}
      </style>
      
      <SidebarProvider>
        <div className="flex w-full min-h-screen">
          <Sidebar className="border-r border-green-100/50 bg-white/80 backdrop-blur-sm">
            <SidebarHeader className="border-b border-green-100/30 p-4">
              <Link to={createPageUrl("Dashboard")} className="block p-2 rounded-lg hover:bg-green-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Flower2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl text-gray-900">LushQuote</h2>
                    <p className="text-xs text-green-600 font-medium">Quote Calculator</p>
                  </div>
                </div>
              </Link>
            </SidebarHeader>
            
            <SidebarContent className="p-4">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
                  Navigation
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`group hover:bg-green-50 hover:text-green-700 transition-all duration-300 rounded-xl mb-2 h-12 ${
                            (location.pathname === item.url || (item.url.includes(currentPageName) && currentPageName !== 'Dashboard')) 
                              ? 'bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 shadow-sm border border-green-100' 
                              : 'text-gray-600'
                          }`}
                        >
                          <Link to={item.url} onClick={(e) => handleNavClick(e, item)} className="flex items-center gap-4 px-4 py-3">
                            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-green-100/30">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-3 hover:bg-green-50">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col items-start text-left min-w-0 flex-1">
                      <span className="font-medium text-gray-900 text-sm truncate w-full">
                        {user?.user_metadata?.preferred_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="text-xs text-gray-500 truncate w-full">
                        {user?.email}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-gray-900 truncate w-full">
                        {user?.user_metadata?.preferred_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate w-full">
                        {user?.email}
                      </p>
                      <p className="text-xs text-green-600 font-medium capitalize">
                        {user?.user_metadata?.subscription_tier || 'free'} Plan
                        {userRole === 'admin' && <span className="ml-2 text-blue-600 font-bold">• Admin</span>}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Settings")} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col">
            {/* Mobile header */}
            <header className="md:hidden bg-white/90 backdrop-blur-sm border-b border-green-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="hover:bg-green-50 p-2 rounded-lg transition-colors" />
                  <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
                    <Flower2 className="w-6 h-6 text-green-600" />
                    <h1 className="text-lg font-bold text-gray-900">LushQuote</h1>
                  </Link>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-green-50">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-gray-900 truncate w-full">
                          {user?.user_metadata?.preferred_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate w-full">
                          {user?.email}
                        </p>
                        <p className="text-xs text-green-600 font-medium capitalize">
                          {user?.user_metadata?.subscription_tier || 'free'} Plan
                          {userRole === 'admin' && <span className="ml-2 text-blue-600 font-bold">• Admin</span>}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                   <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Settings")} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Main content */}
            <div className="flex-1">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>

      {/* Upgrade Dialog for Template Limit */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              You've reached the 1-template limit for the free plan. Upgrade to create unlimited templates!
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

