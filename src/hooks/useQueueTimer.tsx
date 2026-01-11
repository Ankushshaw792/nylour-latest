import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface QueueTimerData {
  estimatedWaitMinutes: number;
  queuePosition: number;
  actualWaitTime: number;
  timeRemaining: number;
}

/**
 * Hook to manage queue timer data
 * @param salonId - The salon ID
 * @param customerId - The INTERNAL customer ID from customers table (NOT auth.uid())
 */
export const useQueueTimer = (salonId: string | null, customerId: string | null) => {
  const [timerData, setTimerData] = useState<QueueTimerData>({
    estimatedWaitMinutes: 0,
    queuePosition: 0,
    actualWaitTime: 0,
    timeRemaining: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQueueData = useCallback(async () => {
    if (!salonId || !customerId) {
      setIsLoading(false);
      return;
    }

    try {
      // Get today's date for filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      // Get queue entry using the internal customer ID
      const { data: queueEntry, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('salon_id', salonId)
        .eq('customer_id', customerId)
        .eq('status', 'waiting')
        .gte('check_in_time', todayStart)
        .maybeSingle();

      if (error || !queueEntry) {
        console.log('No queue entry found for customer:', customerId);
        setTimerData({
          estimatedWaitMinutes: 0,
          queuePosition: 0,
          actualWaitTime: 0,
          timeRemaining: 0
        });
        setIsLoading(false);
        return;
      }

      // Get salon's avg_service_time
      const { data: salonData } = await supabase
        .from('salons')
        .select('avg_service_time')
        .eq('id', salonId)
        .single();

      const avgServiceTime = salonData?.avg_service_time || 30;

      // Calculate queue position: count waiting entries with position less than current
      const { data: positionData } = await supabase
        .from('queue_entries')
        .select('id')
        .eq('salon_id', salonId)
        .eq('status', 'waiting')
        .gte('check_in_time', todayStart)
        .lt('position', queueEntry.position);

      const queuePosition = queueEntry.position;
      const peopleAhead = positionData?.length || 0;

      // Calculate estimated wait time: people ahead * avg service time
      const estimatedWaitMinutes = peopleAhead * avgServiceTime;

      // Calculate actual wait time since check-in
      const checkInTime = new Date(queueEntry.check_in_time);
      const actualWaitTime = Math.floor((Date.now() - checkInTime.getTime()) / (1000 * 60));
      const timeRemaining = Math.max(0, estimatedWaitMinutes);

      setTimerData({
        estimatedWaitMinutes,
        queuePosition,
        actualWaitTime,
        timeRemaining
      });
    } catch (error) {
      console.error('Error fetching queue data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [salonId, customerId]);

  const formatTime = (minutes: number): string => {
    if (minutes < 1) return 'Any moment now';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusMessage = (): string => {
    if (timerData.queuePosition <= 1) return "You're next!";
    if (timerData.timeRemaining <= 5) return "Almost ready!";
    if (timerData.timeRemaining <= 20) return "Get ready soon";
    return "Please wait";
  };

  const getStatusColor = (): string => {
    if (timerData.queuePosition <= 1) return "text-green-600";
    if (timerData.timeRemaining <= 5) return "text-yellow-600"; 
    if (timerData.timeRemaining <= 20) return "text-orange-600";
    return "text-blue-600";
  };

  useEffect(() => {
    if (!salonId || !customerId) return;

    // Initial fetch
    fetchQueueData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`queue-timer-${salonId}-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
          filter: `salon_id=eq.${salonId}`
        },
        () => fetchQueueData()
      )
      .subscribe();

    // Set up periodic updates every 30 seconds
    intervalRef.current = setInterval(fetchQueueData, 30000);

    return () => {
      supabase.removeChannel(channel);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [salonId, customerId, fetchQueueData]);

  return {
    ...timerData,
    isLoading,
    formatTime,
    getStatusMessage,
    getStatusColor,
    refresh: fetchQueueData
  };
};
