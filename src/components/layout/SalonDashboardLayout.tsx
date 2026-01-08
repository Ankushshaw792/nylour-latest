import React, { ReactNode, useEffect, useRef } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { useSalonOpenStatus } from "@/hooks/useSalonOpenStatus";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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
  const { isOpen: isWithinBusinessHours, isLoading: hoursLoading, nextOpenInfo } = useSalonOpenStatus(salon?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasAutoOfflined = useRef(false);

  // Auto-offline when outside business hours
  useEffect(() => {
    if (!loading && !hoursLoading && salon?.is_active && isWithinBusinessHours === false && !hasAutoOfflined.current) {
      hasAutoOfflined.current = true;
      updateSalonStatus({ is_active: false });
      toast({
        title: "Shop is now Offline",
        description: "Your business hours have ended. Update your timings to go online.",
      });
    }
    // Reset the flag when salon becomes inactive or back within hours
    if (!salon?.is_active || isWithinBusinessHours === true) {
      hasAutoOfflined.current = false;
    }
  }, [salon?.is_active, isWithinBusinessHours, loading, hoursLoading, updateSalonStatus, toast]);

  const handleToggleOnline = async () => {
    if (!salon) return;

    // If trying to go online, check business hours first
    if (!salon.is_active && isWithinBusinessHours === false) {
      toast({
        title: "Cannot go Online",
        description: nextOpenInfo || "You are outside your configured business hours. Please update your store timings or wait for the next business day.",
        variant: "destructive",
      });
      return;
    }

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
            <div className="flex items-center gap-[5px]">
              
              {/* Online/Offline Toggle - Classic Slider Switch */}
              <button onClick={handleToggleOnline} disabled={loading} className={`relative flex items-center w-20 h-7 rounded-full transition-colors duration-300 disabled:opacity-50 ${salon?.is_active ? "bg-green-500" : "bg-red-500"}`}>
                <span className={`absolute text-white text-xs font-semibold transition-all duration-300 ${salon?.is_active ? "left-2" : "right-2"}`}>
                  {salon?.is_active ? "Online" : "Offline"}
                </span>
                <span className={`absolute w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${salon?.is_active ? "right-1" : "left-1"}`} />
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