import React, { ReactNode } from "react";
import { User, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { useNavigate } from "react-router-dom";

interface SalonDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export const SalonDashboardLayout = ({ children, title, description }: SalonDashboardLayoutProps) => {
  const { salon, updateSalonStatus, loading } = useSalonRealtimeData();
  const navigate = useNavigate();

  const handleToggleOnline = async () => {
    if (!salon) return;
    await updateSalonStatus({ is_online: !salon.is_online });
  };

  const handleProfileClick = () => {
    navigate("/salon-dashboard/profile");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-hero text-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">{salon?.name || "Loading..."}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleProfileClick}
              className="text-white hover:bg-white/20"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>

          {/* Online/Offline Toggle */}
          <div className="flex items-center justify-between">
            <div>
              {title && <p className="font-semibold">{title}</p>}
              {description && <p className="text-white/90 text-sm">{description}</p>}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                {salon?.is_online ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                <span>{salon?.is_online ? "Online" : "Offline"}</span>
              </div>
              <Switch
                checked={salon?.is_online || false}
                onCheckedChange={handleToggleOnline}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content with padding to account for fixed header */}
      <div className="pt-32">
        {children}
      </div>
    </div>
  );
};