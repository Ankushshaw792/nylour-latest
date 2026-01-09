import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useActiveBooking = (userId: string | null) => {
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // First, fetch the customer ID from the user ID
  useEffect(() => {
    const fetchCustomerId = async () => {
      if (!userId) {
        setCustomerId(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching customer ID:', error);
          setCustomerId(null);
        } else {
          setCustomerId(data?.id || null);
        }
      } catch (error) {
        console.error('Error fetching customer ID:', error);
        setCustomerId(null);
      }
    };

    fetchCustomerId();
  }, [userId]);

  const checkActiveBooking = useCallback(async () => {
    if (!customerId) {
      setHasActiveBooking(false);
      setActiveBooking(null);
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
        } else {
          setActiveBooking(null);
        }
      }
    } catch (error) {
      console.error('Error checking active booking:', error);
      setHasActiveBooking(false);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  // Check active booking when customerId changes
  useEffect(() => {
    if (customerId) {
      checkActiveBooking();
    }
  }, [customerId, checkActiveBooking]);

  // Set up real-time subscription for bookings changes
  useEffect(() => {
    if (!customerId) return;

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
  }, [customerId, checkActiveBooking]);

  return { hasActiveBooking, activeBooking, isLoading, refresh: checkActiveBooking };
};
