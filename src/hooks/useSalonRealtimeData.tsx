import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Use simple string types instead of non-existent enums
type BookingStatus = string;
type QueueStatus = string;

interface Booking {
  id: string;
  customer_id: string | null;
  service_id: string;
  staff_id?: string | null;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  total_price: number;
  queue_position?: number | null;
  notes?: string | null;
  arrival_deadline?: string | null;
  customers?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  salon_services?: {
    price: number;
    duration: number;
    services: {
      name: string;
      default_duration: number;
    } | null;
  } | null;
  salon_staff?: {
    id: string;
    name: string;
    avatar_url: string | null;
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
    avatar_url: string | null;
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
  address?: string;
  city?: string;
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
        .select('id, name, is_active, accepts_walkins, avg_service_time, max_queue_size, address, city')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (salonError) {
        console.error('Salon fetch error:', salonError);
        throw salonError;
      }
      if (!salonData) {
        console.warn('No salon found for owner:', user.id);
        setLoading(false);
        return;
      }
      setSalon(salonData);

      // Fetch bookings for today with joins (prevents N+1 queries and ensures correct customer details)
      // Use local date to avoid timezone issues
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          customer_id,
          salon_id,
          service_id,
          staff_id,
          booking_date,
          booking_time,
          status,
          total_price,
          notes,
          arrival_deadline,
          customers(first_name, last_name, phone, avatar_url),
          salon_services(price, duration, services(name, default_duration)),
          salon_staff(id, name, avatar_url)
        `)
        .eq('salon_id', salonData.id)
        .eq('booking_date', today)
        .in('status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
        .or('payment_status.eq.completed,customer_id.is.null')
        .order('created_at', { ascending: true });

      if (bookingsError) {
        console.error('Bookings fetch error:', JSON.stringify(bookingsError));
        setBookings([]);
      } else {
        // Fetch queue positions and check-in times for each booking
        const bookingIds = (bookingsData || []).map((b: any) => b.id);
        let queuePositionMap: Record<string, { position: number; check_in_time: string }> = {};
        
        if (bookingIds.length > 0) {
          const { data: queueData } = await supabase
            .from('queue_entries')
            .select('booking_id, position, check_in_time')
            .in('booking_id', bookingIds)
            .in('status', ['waiting', 'called', 'in_service']);
          
          if (queueData) {
            queueData.forEach((q: any) => {
              if (q.booking_id) {
                queuePositionMap[q.booking_id] = {
                  position: q.position,
                  check_in_time: q.check_in_time
                };
              }
            });
          }
        }
        
        // Add queue_position and queue_check_in_time to each booking
        const enrichedBookings = (bookingsData || []).map((b: any) => ({
          ...b,
          queue_position: queuePositionMap[b.id]?.position ?? null,
          queue_check_in_time: queuePositionMap[b.id]?.check_in_time ?? null
        }));
        
        setBookings(enrichedBookings as any);
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
          check_in_time,
          customers(first_name, last_name, phone, avatar_url)
        `)
        .eq('salon_id', salonData.id)
        .neq('status', 'completed')
        .gte('check_in_time', todayStart.toISOString())
        .order('check_in_time', { ascending: true });

      if (queueError) {
        console.error('Queue fetch error:', queueError);
        setQueue([]);
      } else {
        setQueue((queueData || []) as any);
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

  // Helper to get auth user_id from customer_id
  const getAuthUserId = useCallback(async (customerId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('customers')
      .select('user_id')
      .eq('id', customerId)
      .single();
    return data?.user_id || null;
  }, []);

  // Accept booking
  const acceptBooking = useCallback(async (bookingId: string) => {
    try {
      // Get booking details for notification and queue entry
      const { data: bookingData, error: fetchError } = await supabase
        .from('bookings')
        .select('customer_id, salon_id, staff_id')
        .eq('id', bookingId)
        .single();

      if (fetchError) {
        console.error('Error fetching booking:', fetchError);
      }

      // Explicitly handle queue entry creation to ensure reliability
      if (bookingData) {
        const { data: existingQueue } = await supabase
          .from('queue_entries')
          .select('id')
          .eq('booking_id', bookingId)
          .maybeSingle();

        if (!existingQueue) {
          let assignedStaffId = bookingData.staff_id;

          // Auto-assign staff if 'Any Stylist' was selected
          if (!assignedStaffId) {
            const { data: staffCounts } = await supabase
              .from('salon_staff')
              .select(`
                id,
                queue_entries (id)
              `)
              .eq('salon_id', bookingData.salon_id)
              .eq('is_active', true);

            if (staffCounts && staffCounts.length > 0) {
              // Find the staff with the minimum active queue entries
              const staffWithQueueLengths = staffCounts.map(s => ({
                id: s.id,
                count: (s.queue_entries as any[])?.length || 0
              }));
              staffWithQueueLengths.sort((a, b) => a.count - b.count);
              assignedStaffId = staffWithQueueLengths[0].id;

              // Update booking with the assigned staff
              await supabase
                .from('bookings')
                .update({ staff_id: assignedStaffId })
                .eq('id', bookingId);
            }
          }

          // Calculate next position for the assigned staff
          let nextPosition = 1;
          if (assignedStaffId) {
            const { data: maxPosData } = await supabase
              .from('queue_entries')
              .select('position')
              .eq('salon_id', bookingData.salon_id)
              .eq('staff_id', assignedStaffId)
              .in('status', ['waiting', 'called', 'in_service'])
              .order('position', { ascending: false })
              .limit(1)
              .maybeSingle();
              
            if (maxPosData && maxPosData.position) {
              nextPosition = maxPosData.position + 1;
            }

            // Insert the queue entry directly
            await supabase.from('queue_entries').insert({
              booking_id: bookingId,
              salon_id: bookingData.salon_id,
              customer_id: bookingData.customer_id,
              staff_id: assignedStaffId,
              position: nextPosition,
              status: 'waiting',
              check_in_time: new Date().toISOString(),
              estimated_wait_time: 0
            });
          }
        }
      }

      // Set booking status to confirmed
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;

      // Send notification to customer using auth user_id - include 10-minute arrival info
      if (bookingData?.customer_id) {
        const authUserId = await getAuthUserId(bookingData.customer_id);
        if (authUserId) {
          const salonName = salon?.name || 'The salon';
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: authUserId,
            title: 'Booking Confirmed! ⏱️',
            message: `${salonName} has accepted your booking. You have 10 minutes to arrive at the salon!`,
            type: 'booking',
            related_id: bookingId
          });
          if (notifError) {
            console.error('Error inserting notification:', notifError);
          }
        }
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
  }, [getAuthUserId, salon]);

  // Reject booking with reason
  // NOTE: The database enforces allowed booking statuses via a check constraint.
  // We represent "rejected" as status="cancelled" with a cancellation_reason.
  const rejectBooking = useCallback(async (bookingId: string, reason?: string) => {
    try {
      // Get booking details for notification
      const { data: bookingData, error: fetchError } = await supabase
        .from('bookings')
        .select('customer_id, salon_id')
        .eq('id', bookingId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching booking:', fetchError);
      }

      const cancellationReason = reason || 'Booking rejected by salon';

      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: cancellationReason,
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Send notification to customer using auth user_id
      if (bookingData?.customer_id) {
        const authUserId = await getAuthUserId(bookingData.customer_id);
        if (authUserId) {
          const salonName = salon?.name || 'The salon';
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: authUserId,
            title: 'Booking Rejected',
            message: `Sorry, ${salonName} couldn't accommodate your booking. Reason: ${cancellationReason}`,
            type: 'booking',
            related_id: bookingId,
          });
          if (notifError) {
            console.error('Error inserting notification:', notifError);
          }
        }
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
  }, [getAuthUserId, salon]);

  // Start service - update queue by booking_id (works for walk-ins too)
  const startService = useCallback(async (bookingId: string) => {
    try {
      // Get booking details for notification
      const { data: bookingData, error: fetchError } = await supabase
        .from('bookings')
        .select('customer_id, salon_id')
        .eq('id', bookingId)
        .single();

      if (fetchError) {
        console.error('Error fetching booking:', fetchError);
      }

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'in_progress'
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update queue entry by booking_id (works for both online and walk-ins)
      // The backend trigger also does this, but we do it here for immediate UI feedback
      await supabase
        .from('queue_entries')
        .update({ 
          status: 'in_service',
          service_start_time: new Date().toISOString()
        })
        .eq('booking_id', bookingId)
        .eq('status', 'waiting');

      // Send notification using auth user_id (only for online bookings with customer_id)
      if (bookingData?.customer_id) {
        const authUserId = await getAuthUserId(bookingData.customer_id);
        if (authUserId) {
          const salonName = salon?.name || 'The salon';
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: authUserId,
            title: 'Service Started! 💇',
            message: `Your service at ${salonName} has begun. Enjoy!`,
            type: 'queue',
            related_id: bookingId
          });
          if (notifError) {
            console.error('Error inserting notification:', notifError);
          }
        }
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
  }, [getAuthUserId, salon]);

  // Complete service - update queue by booking_id (works for walk-ins too)
  const completeService = useCallback(async (bookingId: string) => {
    try {
      // Get booking details for notification
      const { data: bookingData, error: fetchError } = await supabase
        .from('bookings')
        .select('customer_id, salon_id')
        .eq('id', bookingId)
        .single();

      if (fetchError) {
        console.error('Error fetching booking:', fetchError);
      }

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'completed'
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update queue entry by booking_id (works for both online and walk-ins)
      // The backend trigger also does this, but we do it here for immediate UI feedback
      await supabase
        .from('queue_entries')
        .update({ 
          status: 'completed',
          service_end_time: new Date().toISOString()
        })
        .eq('booking_id', bookingId)
        .in('status', ['waiting', 'in_service']);

      // Send notification using auth user_id (only for online bookings with customer_id)
      if (bookingData?.customer_id) {
        const authUserId = await getAuthUserId(bookingData.customer_id);
        if (authUserId) {
          const salonName = salon?.name || 'The salon';
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: authUserId,
            title: 'Service Complete! ⭐',
            message: `Thanks for visiting ${salonName}! We hope to see you again soon.`,
            type: 'booking',
            related_id: bookingId
          });
          if (notifError) {
            console.error('Error inserting notification:', notifError);
          }
        }
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
  }, [getAuthUserId, salon]);

  // Mark booking as no-show with reason - update queue by booking_id (works for walk-ins too)
  const markNoShow = useCallback(async (bookingId: string, reason?: string) => {
    try {
      // Get booking details for notification
      const { data: bookingData, error: fetchError } = await supabase
        .from('bookings')
        .select('customer_id, salon_id')
        .eq('id', bookingId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching booking:', fetchError);
      }

      const cancellationReason = reason || 'Customer did not arrive';

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          notes: 'Marked as no-show',
          cancellation_reason: cancellationReason
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update queue entry by booking_id (works for both online and walk-ins)
      // The backend trigger also does this, but we do it here for immediate UI feedback
      await supabase
        .from('queue_entries')
        .update({ status: 'completed' })
        .eq('booking_id', bookingId)
        .in('status', ['waiting', 'in_service']);

      // Send notification using auth user_id (only for online bookings with customer_id)
      if (bookingData?.customer_id) {
        const authUserId = await getAuthUserId(bookingData.customer_id);
        if (authUserId) {
          const salonName = salon?.name || 'The salon';
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: authUserId,
            title: 'Booking Marked as No-Show',
            message: `You were marked as no-show at ${salonName}. Reason: ${cancellationReason}`,
            type: 'booking',
            related_id: bookingId
          });
          if (notifError) {
            console.error('Error inserting notification:', notifError);
          }
        }
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
  }, [getAuthUserId, salon]);

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
      // Get auth user_id from customer_id
      const authUserId = await getAuthUserId(customerId);
      if (!authUserId) {
        throw new Error('Could not find user for this customer');
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: authUserId,
          title: 'Message from Salon',
          message: message,
          type: 'reminder',
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
  }, [getAuthUserId]);

  // Add walk-in customer - use local date to avoid timezone issues
  const addWalkInCustomer = useCallback(async (customerData: {
    name: string;
    phone: string;
    service_id: string;
    staff_id: string | null;
  }) => {
    if (!salon) return;

    try {
      // Get salon_services record to get both price and the salon_services.id
      const { data: salonServiceData } = await supabase
        .from('salon_services')
        .select('id, price, duration')
        .eq('salon_id', salon.id)
        .eq('service_id', customerData.service_id)
        .maybeSingle();

      const servicePrice = salonServiceData?.price || 0;
      const serviceDuration = salonServiceData?.duration || 30;
      // Use salon_services.id for walk-in bookings (same as online bookings)
      const salonServiceId = salonServiceData?.id || customerData.service_id;

      // Create booking - ALWAYS null customer_id for walk-ins to keep them salon-only
      // Use local date to avoid timezone issues (not UTC)
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: null, // Always null for walk-ins
          salon_id: salon.id,
          service_id: salonServiceId, // Use salon_services.id, not services.id
          staff_id: customerData.staff_id,
          booking_date: format(new Date(), 'yyyy-MM-dd'), // Local date, not UTC
          booking_time: new Date().toTimeString().split(' ')[0],
          status: 'confirmed' as BookingStatus,
          total_price: servicePrice,
          notes: `Walk-in: ${customerData.name} - ${customerData.phone}`,
          duration: serviceDuration,
          payment_status: 'completed' // Walk-ins are treated as paid
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
      // Get auth user_id from customer_id
      const authUserId = await getAuthUserId(customerId);
      if (!authUserId) {
        throw new Error('Could not find user for this customer');
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: authUserId,
          title: 'Your turn is coming up!',
          message: 'Please be ready. Your service will begin shortly.',
          type: 'reminder',
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
  }, [getAuthUserId]);

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
      .channel(`salon-bookings-${salon.id}`)
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
      .channel(`salon-queue-${salon.id}`)
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

    const staffChannel = supabase
      .channel(`salon-staff-${salon.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salon_staff',
          filter: `salon_id=eq.${salon.id}`
        },
        () => {
          fetchSalonData();
        }
      )
      .subscribe();

    return () => {
      bookingsChannel.unsubscribe();
      queueChannel.unsubscribe();
      staffChannel.unsubscribe();
    };
  }, [salon?.id, fetchSalonData]);

  // Initial data fetch and robust auto-refresh polling fallback
  useEffect(() => {
    fetchSalonData();

    // Poll database every 5 seconds to ensure dashboard updates even if websockets/realtime fail
    const intervalId = setInterval(() => {
      fetchSalonData();
    }, 5000);

    // Fetch immediately when the user returns or focuses the window/tab
    const handleFocus = () => {
      fetchSalonData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchSalonData]);

  // Add walk-in customer to first position (when online customer is waiting to arrive)
  const addWalkInCustomerFirst = useCallback(async (customerData: {
    name: string;
    phone: string;
    service_id: string;
    staff_id: string | null;
  }) => {
    if (!salon) return;

    try {
      // Get salon_services record to get the salon_services.id
      const { data: salonServiceData } = await supabase
        .from('salon_services')
        .select('id')
        .eq('salon_id', salon.id)
        .eq('service_id', customerData.service_id)
        .maybeSingle();

      const salonServiceId = salonServiceData?.id || customerData.service_id;

      // Call the database function to add walk-in to first position
      const { data, error } = await supabase.rpc('add_walkin_first_position', {
        p_salon_id: salon.id,
        p_service_id: salonServiceId,
        p_customer_name: customerData.name,
        p_phone: customerData.phone,
        p_staff_id: customerData.staff_id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Walk-in customer added to first position",
      });
    } catch (error) {
      console.error('Error adding walk-in to first position:', error);
      toast({
        title: "Error",
        description: "Failed to add walk-in customer",
        variant: "destructive",
      });
    }
  }, [salon]);

  // Reorder queue entry to a new check-in time
  const reorderQueueEntry = useCallback(async (bookingId: string, newTime: string) => {
    try {
      // 1. Fetch the current queue entry for this booking to get its status and ID
      const { data: qeData, error: fetchError } = await supabase
        .from('queue_entries')
        .select('id, status')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!qeData) throw new Error("Queue entry not found");

      // 2. Direct table update, setting status to itself to force trigger recalculation
      const { error } = await supabase
        .from('queue_entries')
        .update({ 
          check_in_time: newTime,
          status: qeData.status
        })
        .eq('id', qeData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Queue reordered",
      });
    } catch (error: any) {
      console.error('Error reordering queue entry:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reorder queue",
        variant: "destructive",
      });
    }
  }, []);

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
    addWalkInCustomerFirst,
    reorderQueueEntry,
    sendReminder,
    sendCustomReminder,
    notifyNextCustomer,
    calculateWaitTime,
    refetch: fetchSalonData
  };
};