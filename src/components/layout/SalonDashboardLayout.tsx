import React, { ReactNode } from "react";
import { ChevronDown, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                  salon?.is_active 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <span className={`text-sm font-medium ${salon?.is_active ? "text-white" : "text-gray-600"}`}>
                  {salon?.is_active ? "Online" : "Offline"}
                </span>
                <Switch 
                  checked={salon?.is_active || false}
                  onCheckedChange={handleToggleOnline}
                  className="data-[state=checked]:bg-white data-[state=unchecked]:bg-gray-400 h-5 w-9 [&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:bg-green-500 [&>span]:data-[state=unchecked]:bg-white"
                />
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