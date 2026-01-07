import React, { ReactNode } from "react";
import { User, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface SalonDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export const SalonDashboardLayout = ({ children, title, description }: SalonDashboardLayoutProps) => {
  const { salon, updateSalonStatus, loading } = useSalonRealtimeData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleToggleOnline = async () => {
    if (!salon) return;
    await updateSalonStatus({ is_active: !salon.is_active });
  };

  const handleProfileClick = () => {
    navigate("/salon-dashboard/profile");
  };

  const getInitials = (name?: string) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Fixed Header with Brand Gradient */}
      <div className="fixed top-0 left-0 right-0 z-[60] brand-gradient border-b border-white/20 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Left Section - Branding & Page Info */}
            <div className="flex items-center gap-6 flex-1 min-w-0">
              <div className="flex flex-col min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate tracking-tight">
                  {salon?.name || "Loading..."}
                </h1>
                {(title || description) && (
                  <div className="flex items-center gap-2 mt-0.5">
                    {title && (
                      <p className="text-sm font-medium text-white/90">{title}</p>
                    )}
                    {description && (
                      <p className="text-xs text-white/70 hidden sm:block">{description}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Status & User Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Online/Offline Status */}
              <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2.5 border border-white/30 shadow-md">
                <Badge 
                  variant={salon?.is_active ? "default" : "secondary"}
                  className={`gap-1.5 px-3 py-1 ${
                    salon?.is_active 
                      ? "bg-green-500/90 text-white border-0 shadow-sm" 
                      : "bg-gray-400/90 text-white border-0 shadow-sm"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    salon?.is_active ? "bg-white animate-pulse" : "bg-white/70"
                  }`} />
                  <span className="text-xs font-semibold">
                    {salon?.is_active ? "Online" : "Offline"}
                  </span>
                </Badge>
                
                <Switch
                  checked={salon?.is_active || false}
                  onCheckedChange={handleToggleOnline}
                  disabled={loading}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-400/80"
                />
              </div>

              {/* Notifications */}
              <div className="hidden sm:block">
                <NotificationBell />
              </div>

              {/* User Profile Avatar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleProfileClick}
                className="relative h-10 w-10 rounded-full p-0 hover:bg-white/20 hover:ring-2 hover:ring-white/30 transition-all duration-200"
              >
                <Avatar className="h-10 w-10 border-2 border-white/30">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={salon?.name} />
                  <AvatarFallback className="bg-white/20 text-white font-semibold backdrop-blur-sm">
                    {getInitials(salon?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content with padding to account for fixed header */}
      <div className="pt-24">
        {children}
      </div>
    </div>
  );
};