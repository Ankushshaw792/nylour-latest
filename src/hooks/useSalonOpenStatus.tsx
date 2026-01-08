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
  isWithinBusinessHours: boolean | null;
  isLoading: boolean;
  nextOpenInfo: string | null;
  closingTime: string | null;
}

export const useSalonOpenStatus = (salonId: string | undefined): SalonOpenStatus => {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [isWithinBusinessHours, setIsWithinBusinessHours] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nextOpenInfo, setNextOpenInfo] = useState<string | null>(null);
  const [closingTime, setClosingTime] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);

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
      
      // Fetch both salon hours and salon is_active status
      const [hoursResult, salonResult] = await Promise.all([
        supabase.from('salon_hours').select('*').eq('salon_id', salonId),
        supabase.from('salons').select('is_active').eq('id', salonId).single()
      ]);

      const hours = hoursResult.data;
      const salonData = salonResult.data;
      const salonIsActive = salonData?.is_active ?? true;
      setIsActive(salonIsActive);

      if (hoursResult.error || !hours || hours.length === 0) {
        // No hours configured - check is_active only
        setIsWithinBusinessHours(true);
        setIsOpen(salonIsActive);
        setNextOpenInfo(salonIsActive ? null : 'Temporarily closed');
        setClosingTime(null);
        return;
      }

      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const todayHours = hours.find((h: SalonHours) => h.day_of_week === currentDay);

      if (!todayHours || todayHours.is_closed) {
        setIsWithinBusinessHours(false);
        setIsOpen(false);
        setClosingTime(null);
        const nextOpenDay = findNextOpenDay(hours, currentDay);
        setNextOpenInfo(nextOpenDay);
      } else {
        const [openHour, openMin] = todayHours.open_time.split(':').map(Number);
        const [closeHour, closeMin] = todayHours.close_time.split(':').map(Number);
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;

        const withinHours = currentTime >= openTime && currentTime < closeTime;
        setIsWithinBusinessHours(withinHours);
        setClosingTime(formatTime(todayHours.close_time));

        // isOpen = within business hours AND is_active
        const actuallyOpen = withinHours && salonIsActive;
        setIsOpen(actuallyOpen);

        if (!withinHours && currentTime < openTime) {
          setNextOpenInfo(`Opens at ${formatTime(todayHours.open_time)}`);
        } else if (!withinHours) {
          const nextOpenDay = findNextOpenDay(hours, currentDay);
          setNextOpenInfo(nextOpenDay);
        } else if (!salonIsActive) {
          setNextOpenInfo('Temporarily closed');
        } else {
          setNextOpenInfo(null);
        }
      }
    } catch (error) {
      console.error('Error checking salon status:', error);
      setIsWithinBusinessHours(true);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [salonId, findNextOpenDay, formatTime]);

  useEffect(() => {
    checkSalonStatus();
    const interval = setInterval(checkSalonStatus, 60000);
    return () => clearInterval(interval);
  }, [checkSalonStatus]);

  // Realtime subscription for is_active changes
  useEffect(() => {
    if (!salonId) return;

    const channel = supabase
      .channel(`salon-status-${salonId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'salons',
          filter: `id=eq.${salonId}`
        },
        (payload) => {
          const newIsActive = payload.new.is_active;
          setIsActive(newIsActive);
          // Recalculate isOpen based on new is_active value
          if (isWithinBusinessHours !== null) {
            setIsOpen(isWithinBusinessHours && newIsActive);
            if (!newIsActive && isWithinBusinessHours) {
              setNextOpenInfo('Temporarily closed');
            } else if (newIsActive && isWithinBusinessHours) {
              setNextOpenInfo(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, isWithinBusinessHours]);

  return { isOpen, isWithinBusinessHours, isLoading, nextOpenInfo, closingTime };
};
