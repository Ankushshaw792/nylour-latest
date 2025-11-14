import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SalonStatusBadgeProps {
  salonId: string;
  className?: string;
}

interface SalonHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export const SalonStatusBadge = ({ salonId, className }: SalonStatusBadgeProps) => {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [nextOpenTime, setNextOpenTime] = useState<string | null>(null);

  useEffect(() => {
    const checkSalonStatus = async () => {
      try {
        const { data: hours, error } = await supabase
          .from('salon_hours')
          .select('*')
          .eq('salon_id', salonId);

        if (error || !hours || hours.length === 0) {
          setIsOpen(null);
          return;
        }

        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

        // Find today's hours
        const todayHours = hours.find((h: SalonHours) => h.day_of_week === currentDay);

        if (!todayHours || todayHours.is_closed) {
          setIsOpen(false);
          
          // Find next opening day
          const nextOpenDay = findNextOpenDay(hours, currentDay);
          setNextOpenTime(nextOpenDay);
        } else {
          // Parse open and close times
          const [openHour, openMin] = todayHours.open_time.split(':').map(Number);
          const [closeHour, closeMin] = todayHours.close_time.split(':').map(Number);
          const openTime = openHour * 60 + openMin;
          const closeTime = closeHour * 60 + closeMin;

          const open = currentTime >= openTime && currentTime < closeTime;
          setIsOpen(open);

          if (!open && currentTime < openTime) {
            setNextOpenTime(`Opens at ${formatTime(todayHours.open_time)}`);
          } else if (!open) {
            const nextOpenDay = findNextOpenDay(hours, currentDay);
            setNextOpenTime(nextOpenDay);
          }
        }
      } catch (error) {
        console.error('Error checking salon status:', error);
        setIsOpen(null);
      }
    };

    checkSalonStatus();
    // Refresh every minute
    const interval = setInterval(checkSalonStatus, 60000);
    return () => clearInterval(interval);
  }, [salonId]);

  const findNextOpenDay = (hours: SalonHours[], currentDay: number): string => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      const nextDayHours = hours.find(h => h.day_of_week === nextDay && !h.is_closed);
      
      if (nextDayHours) {
        const dayName = i === 1 ? 'Tomorrow' : dayNames[nextDay];
        return `Opens ${dayName} at ${formatTime(nextDayHours.open_time)}`;
      }
    }
    
    return 'Currently closed';
  };

  const formatTime = (time: string): string => {
    const [hour, min] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
  };

  if (isOpen === null) return null;

  return (
    <div className={className}>
      <Badge variant={isOpen ? "default" : "destructive"} className="font-medium">
        {isOpen ? "Open" : "Closed"}
      </Badge>
      {!isOpen && nextOpenTime && (
        <p className="text-xs text-muted-foreground mt-1">{nextOpenTime}</p>
      )}
    </div>
  );
};
