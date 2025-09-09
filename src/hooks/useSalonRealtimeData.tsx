import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type BookingStatus = Database['public']['Enums']['booking_status'];
type QueueStatus = Database['public']['Enums']['queue_status'];

interface Booking {
  id: string;
  customer_id: string | null;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  total_price: number;
  queue_position?: number | null;
  customer_notes?: string | null;
  is_walk_in: boolean | null;
  customers?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  services?: {
    name: string;
  } | null;
}

interface QueueEntry {
  id: string;
  customer_id: string;
  service_id: string;
  queue_number: number;
  estimated_wait_time?: number | null;
  status: QueueStatus;
  joined_at: string;
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
  is_online: boolean;
  accepts_bookings: boolean;
  current_wait_time: number;
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
        .select('id, name, is_online, accepts_bookings, current_wait_time, max_queue_size')
        .eq('owner_id', user.id)
        .single();

      if (salonError) throw salonError;
      setSalon(salonData);

      // Fetch bookings for today
      const today = new Date().toISOString().split('T')[0];
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          customer_id,
          service_id,
          booking_date,
          booking_time,
          status,
          total_price,
          queue_position,
          customer_notes,
          is_walk_in
        `)
        .eq('salon_id', salonData.id)
        .eq('booking_date', today)
        .order('created_at', { ascending: true });

      if (bookingsError) {
        console.error('Bookings fetch error:', bookingsError);
        setBookings([]);
      } else {
        // Map the raw data to include proper types
        const mappedBookings: Booking[] = (bookingsData || []).map(booking => ({
          ...booking,
          customers: null, // Will fetch separately if needed
          services: null  // Will fetch separately if needed
        }));
        setBookings(mappedBookings);
      }

      // Fetch queue entries - simplified
      const { data: queueData, error: queueError } = await supabase
        .from('queue_entries')
        .select(`
          id,
          customer_id,
          service_id,
          queue_number,
          estimated_wait_time,
          status,
          joined_at
        `)
        .eq('salon_id', salonData.id)
        .neq('status', 'completed')
        .order('joined_at', { ascending: true });

      if (queueError) {
        console.error('Queue fetch error:', queueError);
        setQueue([]);
      } else {
        // Map the raw data to include proper types
        const mappedQueue: QueueEntry[] = (queueData || []).map(entry => ({
          ...entry,
          customers: null, // Will fetch separately if needed
          services: null  // Will fetch separately if needed
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
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;

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
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId);

      if (error) throw error;

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
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'in_progress',
          actual_start_time: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

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
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'completed',
          actual_end_time: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

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

  // Add walk-in customer
  const addWalkInCustomer = useCallback(async (customerData: {
    name: string;
    phone: string;
    service_id: string;
  }) => {
    if (!salon) return;

    try {
      // Try to find existing customer by phone
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('user_id')
        .eq('phone', customerData.phone)
        .maybeSingle();

      let customerId = existingCustomer?.user_id || null;

      // Get service price for the booking
      const { data: serviceData } = await supabase
        .from('salon_services')
        .select('price')
        .eq('salon_id', salon.id)
        .eq('service_id', customerData.service_id)
        .single();

      const servicePrice = serviceData?.price || 0;

      // Create booking - with or without customer_id for walk-ins
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: customerId,
          salon_id: salon.id,
          service_id: customerData.service_id,
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: new Date().toTimeString().split(' ')[0],
          status: 'confirmed' as BookingStatus,
          total_price: servicePrice,
          is_walk_in: true,
          customer_notes: customerId ? null : `Walk-in: ${customerData.name} - ${customerData.phone}`,
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
    addWalkInCustomer,
    notifyNextCustomer,
    refetch: fetchSalonData
  };
};