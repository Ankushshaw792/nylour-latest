import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SalonHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface SalonOpenStatus {
  isOpen: boolean | null;
  isLoading: boolean;
  nextOpenInfo: string | null;
  closingTime: string | null;
}

export const useSalonOpenStatus = (salonId: string | undefined): SalonOpenStatus => {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nextOpenInfo, setNextOpenInfo] = useState<string | null>(null);
  const [closingTime, setClosingTime] = useState<string | null>(null);

  const formatTime = useCallback((time: string): string => {
    const [hour, min] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
  }, []);

  const findNextOpenDay = useCallback((hours: SalonHours[], currentDay: number): string => {
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
  }, [formatTime]);

  const checkSalonStatus = useCallback(async () => {
    if (!salonId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: hours, error } = await supabase
        .from('salon_hours')
        .select('*')
        .eq('salon_id', salonId);

      if (error || !hours || hours.length === 0) {
        // No hours configured - assume open (default behavior)
        setIsOpen(true);
        setNextOpenInfo(null);
        setClosingTime(null);
        return;
      }

      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

      // Find today's hours
      const todayHours = hours.find((h: SalonHours) => h.day_of_week === currentDay);

      if (!todayHours || todayHours.is_closed) {
        setIsOpen(false);
        setClosingTime(null);
        
        // Find next opening day
        const nextOpenDay = findNextOpenDay(hours, currentDay);
        setNextOpenInfo(nextOpenDay);
      } else {
        // Parse open and close times
        const [openHour, openMin] = todayHours.open_time.split(':').map(Number);
        const [closeHour, closeMin] = todayHours.close_time.split(':').map(Number);
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;

        const open = currentTime >= openTime && currentTime < closeTime;
        setIsOpen(open);
        setClosingTime(formatTime(todayHours.close_time));

        if (!open && currentTime < openTime) {
          setNextOpenInfo(`Opens at ${formatTime(todayHours.open_time)}`);
        } else if (!open) {
          const nextOpenDay = findNextOpenDay(hours, currentDay);
          setNextOpenInfo(nextOpenDay);
        } else {
          setNextOpenInfo(null);
        }
      }
    } catch (error) {
      console.error('Error checking salon status:', error);
      // On error, assume open to not block bookings
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [salonId, findNextOpenDay, formatTime]);

  useEffect(() => {
    checkSalonStatus();
    
    // Refresh every minute
    const interval = setInterval(checkSalonStatus, 60000);
    return () => clearInterval(interval);
  }, [checkSalonStatus]);

  return { isOpen, isLoading, nextOpenInfo, closingTime };
};
