import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Use simple string types instead of non-existent enums
type BookingStatus = string;
type QueueStatus = string;

interface Booking {
  id: string;
  customer_id: string | null;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  total_price: number;
  queue_position?: number | null;
  notes?: string | null;
  customers?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  salon_services?: {
    price: number;
    duration: number;
    services: {
      name: string;
      default_duration: number;
    } | null;
  } | null;
}

interface QueueEntry {
  id: string;
  customer_id: string;
  booking_id: string | null;
  position: number;
  estimated_wait_time?: number | null;
  status: QueueStatus;
  check_in_time: string;
  customers?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  services?: {
    name: string;
    duration?: number;
  } | null;
}

interface SalonStatus {
  id: string;
  name: string;
  is_active: boolean;
  accepts_walkins: boolean;
  avg_service_time: number;
  max_queue_size: number;
}

export const useSalonRealtimeData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<SalonStatus | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  // Fetch salon data
  const fetchSalonData = useCallback(async () => {
    if (!user) return;

    try {
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('id, name, is_active, accepts_walkins, avg_service_time, max_queue_size')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (salonError) throw salonError;
      if (!salonData) throw new Error('No salon found for this owner');
      setSalon(salonData);

      // Fetch bookings for today - simple fetch without joins
      const today = new Date().toISOString().split('T')[0];
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('salon_id', salonData.id)
        .eq('booking_date', today)
        .order('created_at', { ascending: true });

      if (bookingsError) {
        console.error('Bookings fetch error:', bookingsError);
        setBookings([]);
      } else if (bookingsData) {
        // Enrich bookings with customer and service data
        const enrichedBookings = await Promise.all(
          bookingsData.map(async (booking) => {
            let customerData = null;
            let serviceData = null;

            // Fetch customer data only if customer_id exists (not walk-in)
            if (booking.customer_id) {
              const { data: customer } = await supabase
                .from('customers')
                .select('first_name, last_name, phone, avatar_url')
                .eq('user_id', booking.customer_id)
                .maybeSingle();
              customerData = customer;
            }

            // Fetch service data
            const { data: service } = await supabase
              .from('services')
              .select('name, default_duration')
              .eq('id', booking.service_id)
              .maybeSingle();

            const { data: salonService } = await supabase
              .from('salon_services')
              .select('price, duration')
              .eq('salon_id', salonData.id)
              .eq('service_id', booking.service_id)
              .maybeSingle();

            serviceData = service && salonService ? {
              price: salonService.price,
              duration: salonService.duration,
              services: service
            } : null;

            return {
              ...booking,
              customers: customerData,
              salon_services: serviceData
            };
          })
        );
        setBookings(enrichedBookings as any);
      } else {
        setBookings([]);
      }

      // Fetch queue entries - simplified
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: queueData, error: queueError } = await supabase
        .from('queue_entries')
        .select(`
          id,
          customer_id,
          booking_id,
          position,
          estimated_wait_time,
          status,
          check_in_time
        `)
        .eq('salon_id', salonData.id)
        .neq('status', 'completed')
        .gte('check_in_time', todayStart.toISOString())
        .order('check_in_time', { ascending: true });

      if (queueError) {
        console.error('Queue fetch error:', queueError);
        setQueue([]);
      } else {
        // Map the raw data to include proper types
        const mappedQueue: QueueEntry[] = (queueData || []).map((entry: any) => ({
          id: entry.id,
          customer_id: entry.customer_id,
          booking_id: entry.booking_id,
          position: entry.position,
          estimated_wait_time: entry.estimated_wait_time,
          status: entry.status,
          check_in_time: entry.check_in_time,
          customers: null,
          services: null
        }));
        setQueue(mappedQueue);
      }

    } catch (error) {
      console.error('Error fetching salon data:', error);
      toast({
        title: "Error",
        description: "Failed to load salon data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update salon status
  const updateSalonStatus = useCallback(async (updates: Partial<SalonStatus>) => {
    if (!salon) return;

    try {
      const { error } = await supabase
        .from('salons')
        .update(updates)
        .eq('id', salon.id);

      if (error) throw error;

      setSalon(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Success",
        description: "Salon status updated",
      });
    } catch (error) {
      console.error('Error updating salon status:', error);
      toast({
        title: "Error",
        description: "Failed to update salon status",
        variant: "destructive",
      });
    }
  }, [salon]);

  // Accept booking
  const acceptBooking = useCallback(async (bookingId: string) => {
    try {
      // Get booking details for notification
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('customer_id, salon_id, salons(name)')
        .eq('id', bookingId)
        .single();

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;

      // Send notification to customer
      if (bookingData?.customer_id) {
        const salonName = (bookingData.salons as any)?.name || 'The salon';
        await supabase.from('notifications').insert({
          user_id: bookingData.customer_id,
          title: 'Booking Confirmed! ✓',
          message: `${salonName} has accepted your booking. Get ready for your appointment!`,
          type: 'booking_confirmation',
          related_id: bookingId
        });
      }

      toast({
        title: "Success",
        description: "Booking accepted",
      });
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast({
        title: "Error",
        description: "Failed to accept booking",
        variant: "destructive",
      });
    }
  }, []);

  // Reject booking
  const rejectBooking = useCallback(async (bookingId: string) => {
    try {
      // Get booking details for notification
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('customer_id, salon_id, salons(name)')
        .eq('id', bookingId)
        .single();

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId);

      if (error) throw error;

      // Send notification to customer
      if (bookingData?.customer_id) {
        const salonName = (bookingData.salons as any)?.name || 'The salon';
        await supabase.from('notifications').insert({
          user_id: bookingData.customer_id,
          title: 'Booking Not Available',
          message: `Sorry, ${salonName} couldn't accommodate your booking. Please try another time slot.`,
          type: 'booking_cancelled',
          related_id: bookingId
        });
      }

      toast({
        title: "Success",
        description: "Booking rejected",
      });
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast({
        title: "Error",
        description: "Failed to reject booking",
        variant: "destructive",
      });
    }
  }, []);

  // Start service
  const startService = useCallback(async (bookingId: string) => {
    try {
      // Get booking details for notification
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('customer_id, salon_id, salons(name)')
        .eq('id', bookingId)
        .single();

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'in_progress'
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update queue entry status if exists
      if (bookingData?.customer_id) {
        await supabase
          .from('queue_entries')
          .update({ status: 'in_service' })
          .eq('customer_id', bookingData.customer_id)
          .eq('salon_id', bookingData.salon_id)
          .eq('status', 'waiting');

        // Send notification
        const salonName = (bookingData.salons as any)?.name || 'The salon';
        await supabase.from('notifications').insert({
          user_id: bookingData.customer_id,
          title: 'Service Started! 💇',
          message: `Your service at ${salonName} has begun. Enjoy!`,
          type: 'queue_update',
          related_id: bookingId
        });
      }

      toast({
        title: "Success",
        description: "Service started",
      });
    } catch (error) {
      console.error('Error starting service:', error);
      toast({
        title: "Error",
        description: "Failed to start service",
        variant: "destructive",
      });
    }
  }, []);

  // Complete service
  const completeService = useCallback(async (bookingId: string) => {
    try {
      // Get booking details for notification
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('customer_id, salon_id, salons(name)')
        .eq('id', bookingId)
        .single();

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'completed'
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update queue entry status if exists
      if (bookingData?.customer_id) {
        await supabase
          .from('queue_entries')
          .update({ status: 'completed' })
          .eq('customer_id', bookingData.customer_id)
          .eq('salon_id', bookingData.salon_id)
          .in('status', ['waiting', 'in_service']);

        // Send notification
        const salonName = (bookingData.salons as any)?.name || 'The salon';
        await supabase.from('notifications').insert({
          user_id: bookingData.customer_id,
          title: 'Service Complete! ⭐',
          message: `Thanks for visiting ${salonName}! We hope to see you again soon.`,
          type: 'general',
          related_id: bookingId
        });
      }

      toast({
        title: "Success",
        description: "Service completed",
      });
    } catch (error) {
      console.error('Error completing service:', error);
      toast({
        title: "Error",
        description: "Failed to complete service",
        variant: "destructive",
      });
    }
  }, []);

  // Mark booking as no-show
  const markNoShow = useCallback(async (bookingId: string) => {
    try {
      // Get booking details for notification
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('customer_id, salon_id, salons(name)')
        .eq('id', bookingId)
        .maybeSingle();

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          notes: 'Marked as no-show'
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update queue entry if exists
      if (bookingData?.customer_id) {
        await supabase
          .from('queue_entries')
          .update({ status: 'completed' })
          .eq('customer_id', bookingData.customer_id)
          .eq('salon_id', bookingData.salon_id)
          .in('status', ['waiting', 'in_service']);

        // Send notification
        const salonName = (bookingData.salons as any)?.name || 'The salon';
        await supabase.from('notifications').insert({
          user_id: bookingData.customer_id,
          title: 'Booking Marked as No-Show',
          message: `You were marked as no-show at ${salonName}. Please contact the salon if this was a mistake.`,
          type: 'booking_cancelled',
          related_id: bookingId
        });
      }

      toast({
        title: "No Show",
        description: "Customer marked as no-show",
      });
    } catch (error) {
      console.error('Error marking no-show:', error);
      toast({
        title: "Error",
        description: "Failed to mark as no-show",
        variant: "destructive",
      });
    }
  }, []);

  // Calculate dynamic wait time for queue
  const calculateWaitTime = useCallback(async (salonId: string, queuePosition: number): Promise<number> => {
    try {
      // Get salon's avg_service_time
      const { data: salonData } = await supabase
        .from('salons')
        .select('avg_service_time')
        .eq('id', salonId)
        .single();

      const avgServiceTime = salonData?.avg_service_time || 30;
      return Math.max(0, (queuePosition - 1) * avgServiceTime);
    } catch (error) {
      console.error('Error calculating wait time:', error);
      return (queuePosition - 1) * 30;
    }
  }, []);

  // Send custom reminder message
  const sendCustomReminder = useCallback(async (customerId: string, bookingId: string, message: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: customerId,
          title: 'Message from Salon',
          message: message,
          type: 'queue_update',
          related_id: bookingId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent to customer",
      });
    } catch (error) {
      console.error('Error sending custom reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, []);

  // Add walk-in customer
  const addWalkInCustomer = useCallback(async (customerData: {
    name: string;
    phone: string;
    service_id: string;
  }) => {
    if (!salon) return;

    try {
      // Get service price for the booking
      const { data: serviceData } = await supabase
        .from('salon_services')
        .select('price')
        .eq('salon_id', salon.id)
        .eq('service_id', customerData.service_id)
        .maybeSingle();

      const servicePrice = serviceData?.price || 0;

      // Create booking - ALWAYS null customer_id for walk-ins to keep them salon-only
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: null, // Always null for walk-ins
          salon_id: salon.id,
          service_id: customerData.service_id,
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: new Date().toTimeString().split(' ')[0],
          status: 'confirmed' as BookingStatus,
          total_price: servicePrice,
          is_walk_in: true,
          notes: `Walk-in: ${customerData.name} - ${customerData.phone}`,
          duration: 30
        });

      if (bookingError) throw bookingError;

      toast({
        title: "Success",
        description: "Walk-in customer added to queue",
      });
    } catch (error) {
      console.error('Error adding walk-in customer:', error);
      toast({
        title: "Error",
        description: "Failed to add walk-in customer",
        variant: "destructive",
      });
    }
  }, [salon]);

  // Send reminder to specific customer
  const sendReminder = useCallback(async (customerId: string, bookingId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: customerId,
          title: 'Your turn is coming up!',
          message: 'Please be ready. Your service will begin shortly.',
          type: 'queue_update',
          related_id: bookingId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reminder sent to customer",
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    }
  }, []);

  // Notify next customer
  const notifyNextCustomer = useCallback(async (message?: string) => {
    if (!salon) return;

    try {
      const { error } = await supabase.rpc('notify_next_customer', {
        p_salon_id: salon.id,
        p_message: message || null
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Next customer notified",
      });
    } catch (error) {
      console.error('Error notifying next customer:', error);
      toast({
        title: "Error",
        description: "Failed to notify next customer",
        variant: "destructive",
      });
    }
  }, [salon]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!salon?.id) return;

    const bookingsChannel = supabase
      .channel('salon-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `salon_id=eq.${salon.id}`
        },
        (payload) => {
          console.log('Booking change:', payload);
          fetchSalonData(); // Refetch data on any change
        }
      )
      .subscribe();

    const queueChannel = supabase
      .channel('salon-queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
          filter: `salon_id=eq.${salon.id}`
        },
        (payload) => {
          console.log('Queue change:', payload);
          fetchSalonData(); // Refetch data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(queueChannel);
    };
  }, [salon?.id, fetchSalonData]);

  // Initial data fetch
  useEffect(() => {
    fetchSalonData();
  }, [fetchSalonData]);

  return {
    loading,
    salon,
    bookings,
    queue,
    updateSalonStatus,
    acceptBooking,
    rejectBooking,
    startService,
    completeService,
    markNoShow,
    addWalkInCustomer,
    sendReminder,
    sendCustomReminder,
    notifyNextCustomer,
    calculateWaitTime,
    refetch: fetchSalonData
  };
};