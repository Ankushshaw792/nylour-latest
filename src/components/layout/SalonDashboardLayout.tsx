import React, { ReactNode } from "react";
import { ChevronDown, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { useNavigate } from "react-router-dom";
interface SalonDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}
export const SalonDashboardLayout = ({
  children,
  title,
  description
}: SalonDashboardLayoutProps) => {
  const {
    salon,
    updateSalonStatus,
    loading
  } = useSalonRealtimeData();
  const navigate = useNavigate();
  const handleToggleOnline = async () => {
    if (!salon) return;
    await updateSalonStatus({
      is_active: !salon.is_active
    });
  };
  const handleProfileClick = () => {
    navigate("/salon-dashboard/profile");
  };
  return <div className="min-h-screen bg-gray-50">
      {/* Clean Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Section - Salon Name & Location */}
            <div className="flex flex-col min-w-0">
              <h1 className="font-semibold text-gray-900 truncate text-sm">
                {salon?.name || "Loading..."}
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-success" />
                <p className="text-gray-500 truncate text-xs">
                  {salon?.city || salon?.address || "Location"}
                </p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2">
              
              {/* Online/Offline Toggle - Minimal Pill */}
              <button 
                onClick={handleToggleOnline} 
                disabled={loading} 
                className={`relative flex items-center w-20 h-8 rounded-full transition-colors disabled:opacity-50 ${
                  salon?.is_active 
                    ? "bg-success" 
                    : "bg-muted"
                }`}
              >
                <span 
                  className={`absolute w-6 h-6 bg-background rounded-full shadow-md transition-all duration-300 ${
                    salon?.is_active ? "left-12" : "left-1"
                  }`}
                />
                <span className={`absolute text-[10px] font-semibold transition-all duration-300 ${
                  salon?.is_active 
                    ? "left-2 text-success-foreground" 
                    : "right-2 text-muted-foreground"
                }`}>
                  {salon?.is_active ? "Online" : "Offline"}
                </span>
              </button>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Icon */}
              <Button variant="ghost" size="icon" onClick={handleProfileClick} className="h-9 w-9 rounded-full text-gray-700 hover:bg-gray-100">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content with padding to account for fixed header */}
      <div className="pt-20">
        {children}
      </div>
    </div>;
};