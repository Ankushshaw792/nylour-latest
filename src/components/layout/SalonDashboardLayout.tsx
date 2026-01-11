import React, { ReactNode, useEffect, useRef, useState } from "react";
import { User, Volume2, VolumeX, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SalonTutorial } from "@/components/onboarding/SalonTutorial";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { useSalonOpenStatus } from "@/hooks/useSalonOpenStatus";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useBookingAlertSound } from "@/hooks/useBookingAlertSound";
import { unlockAudioContext } from "@/lib/notificationSound";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    bookings,
    updateSalonStatus,
    loading
  } = useSalonRealtimeData();
  const { isWithinBusinessHours, isLoading: hoursLoading, nextOpenInfo } = useSalonOpenStatus(salon?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasAutoOfflined = useRef(false);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  
  // Audio alert state
  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('salon_audio_enabled') === 'true';
  });
  const [isMuted, setIsMuted] = useState(false);
  
  // Count pending bookings that need attention
  const pendingBookingsCount = bookings.filter(
    (b) => b.status === 'pending'
  ).length;
  
  // Use the booking alert sound hook - plays continuously when pending bookings exist
  useBookingAlertSound(pendingBookingsCount, {
    enabled: audioEnabled,
    muted: isMuted
  });
  
  // Enable audio with user interaction
  const handleEnableAudio = () => {
    unlockAudioContext();
    setAudioEnabled(true);
    localStorage.setItem('salon_audio_enabled', 'true');
    toast({
      title: "Sound Alerts Enabled",
      description: "You'll hear alerts when new bookings arrive.",
    });
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

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

    // If trying to go offline during business hours, show warning
    if (salon.is_active && isWithinBusinessHours === true) {
      setShowOfflineWarning(true);
      return;
    }

    await updateSalonStatus({
      is_active: !salon.is_active
    });
  };

  const confirmGoOffline = async () => {
    setShowOfflineWarning(false);
    await updateSalonStatus({ is_active: false });
    toast({
      title: "Shop is now Offline",
      description: "Customers won't be able to book until you go back online.",
    });
  };

  const handleProfileClick = () => {
    navigate("/salon-dashboard/profile");
  };
  return <div className="min-h-screen bg-gray-50">
      {/* Enable Sound Alerts Banner - Shows when audio not enabled and pending bookings exist */}
      {!audioEnabled && pendingBookingsCount > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[70] bg-amber-500 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">
              {pendingBookingsCount} new booking{pendingBookingsCount > 1 ? 's' : ''} waiting!
            </span>
          </div>
          <Button 
            onClick={handleEnableAudio}
            size="sm"
            variant="secondary"
            className="bg-white text-amber-600 hover:bg-amber-50"
          >
            <Volume2 className="h-4 w-4 mr-1" />
            Enable Alerts
          </Button>
        </div>
      )}

      {/* Clean Fixed Header */}
      <div className={`fixed left-0 right-0 z-[60] bg-white border-b border-gray-200 ${!audioEnabled && pendingBookingsCount > 0 ? 'top-10' : 'top-0'}`}>
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
              
              {/* Mute/Unmute Button - Only show when audio is enabled and there are pending bookings */}
              {audioEnabled && pendingBookingsCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className={`h-9 w-9 rounded-full ${isMuted ? 'text-red-500' : 'text-amber-500'}`}
                  title={isMuted ? "Unmute alerts" : "Mute alerts"}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 animate-pulse" />}
                </Button>
              )}
              
              {/* Online/Offline Toggle - Classic Slider Switch */}
              <button 
                onClick={handleToggleOnline} 
                disabled={loading} 
                data-tour="online-toggle"
                className={`relative flex items-center w-20 h-7 rounded-full transition-colors duration-300 disabled:opacity-50 ${salon?.is_active ? "bg-green-500" : "bg-red-500"}`}
              >
                <span className={`absolute text-white text-xs font-semibold transition-all duration-300 ${salon?.is_active ? "left-2" : "right-2"}`}>
                  {salon?.is_active ? "Online" : "Offline"}
                </span>
                <span className={`absolute w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${salon?.is_active ? "right-1" : "left-1"}`} />
              </button>

              {/* Notification Bell */}
              <div data-tour="notification-bell">
                <NotificationBell />
              </div>

              {/* Profile Icon */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleProfileClick} 
                data-tour="profile-button"
                className="h-9 w-9 rounded-full text-gray-700 hover:bg-gray-100"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Salon Tutorial */}
      <SalonTutorial />

      {/* Content with padding to account for fixed header + optional banner */}
      <div className={!audioEnabled && pendingBookingsCount > 0 ? "pt-[6.5rem]" : "pt-20"}>
        {children}
      </div>

      {/* Offline Warning Dialog */}
      <AlertDialog open={showOfflineWarning} onOpenChange={setShowOfflineWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Go Offline?</AlertDialogTitle>
            <AlertDialogDescription>
              You're going offline during your business hours. Customers won't be able to book appointments until you go back online.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGoOffline} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Go Offline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};