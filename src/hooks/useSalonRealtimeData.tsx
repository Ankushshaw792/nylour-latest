import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_price: number;
  queue_position?: number;
  customer_notes?: string;
  is_walk_in: boolean;
  profiles?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  services?: {
    name: string;
  };
}

interface QueueEntry {
  id: string;
  customer_id: string;
  service_id: string;
  queue_number: number;
  estimated_wait_time?: number;
  status: string;
  joined_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  services?: {
    name: string;
    duration: number;
  };
}

interface SalonStatus {
  id: string;
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
        .select('id, is_online, accepts_bookings, current_wait_time, max_queue_size')
        .eq('owner_id', user.id)
        .single();

      if (salonError) throw salonError;
      setSalon(salonData);

      // Fetch bookings for today
      const today = new Date().toISOString().split('T')[0];
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:customer_id(first_name, last_name, phone),
          services(name)
        `)
        .eq('salon_id', salonData.id)
        .eq('booking_date', today)
        .order('created_at', { ascending: true });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch queue entries
      const { data: queueData, error: queueError } = await supabase
        .from('queue_entries')
        .select(`
          *,
          profiles:customer_id(first_name, last_name, phone),
          services(name, duration)
        `)
        .eq('salon_id', salonData.id)
        .neq('status', 'completed')
        .order('joined_at', { ascending: true });

      if (queueError) throw queueError;
      setQueue(queueData || []);

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
      // Create a temporary customer entry or find existing one by phone
      let customerId = null;
      
      // Try to find existing customer by phone
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone', customerData.phone)
        .single();

      if (existingProfile) {
        customerId = existingProfile.user_id;
      } else {
        // Create booking as walk-in without customer account
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            salon_id: salon.id,
            service_id: customerData.service_id,
            booking_date: new Date().toISOString().split('T')[0],
            booking_time: new Date().toTimeString().split(' ')[0],
            status: 'confirmed',
            total_price: 0, // Will be updated with actual service price
            is_walk_in: true,
            customer_notes: `Walk-in: ${customerData.name} - ${customerData.phone}`
          })
          .select()
          .single();

        if (bookingError) throw bookingError;

        toast({
          title: "Success",
          description: "Walk-in customer added to queue",
        });
        return;
      }

      // Create booking for existing customer
      const { error } = await supabase
        .from('bookings')
        .insert({
          customer_id: customerId,
          salon_id: salon.id,
          service_id: customerData.service_id,
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: new Date().toTimeString().split(' ')[0],
          status: 'confirmed',
          total_price: 0,
          is_walk_in: true
        });

      if (error) throw error;

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