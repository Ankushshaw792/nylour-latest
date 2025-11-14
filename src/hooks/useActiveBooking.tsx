import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useActiveBooking = (customerId: string | null) => {
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkActiveBooking = async () => {
      if (!customerId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('check_active_booking', {
          p_customer_id: customerId
        });

        if (error) {
          console.error('Error checking active booking:', error);
          setHasActiveBooking(false);
        } else {
          setHasActiveBooking(data || false);
          
          // If has active booking, fetch the details
          if (data) {
            const { data: bookingData } = await supabase
              .from('bookings')
              .select(`
                *,
                salons!inner (
                  name
                )
              `)
              .eq('customer_id', customerId)
              .in('status', ['pending', 'confirmed', 'in_progress'])
              .gte('booking_date', new Date().toISOString().split('T')[0])
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            setActiveBooking(bookingData);
          }
        }
      } catch (error) {
        console.error('Error checking active booking:', error);
        setHasActiveBooking(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveBooking();

    // Set up real-time subscription for bookings changes
    const channel = supabase
      .channel('active-booking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${customerId}`
        },
        () => checkActiveBooking()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId]);

  return { hasActiveBooking, activeBooking, isLoading, refresh: () => {} };
};
