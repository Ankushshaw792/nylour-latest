import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface QueueTimerData {
  estimatedWaitMinutes: number;
  queuePosition: number;
  actualWaitTime: number;
  timeRemaining: number;
}

export const useQueueTimer = (salonId: string | null, customerId: string | null) => {
  const [timerData, setTimerData] = useState<QueueTimerData>({
    estimatedWaitMinutes: 0,
    queuePosition: 0,
    actualWaitTime: 0,
    timeRemaining: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQueueData = async () => {
    if (!salonId || !customerId) return;

    try {
      // Get queue entry
      const { data: queueEntry, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('salon_id', salonId)
        .eq('customer_id', customerId)
        .eq('status', 'waiting')
        .single();

      if (error || !queueEntry) {
        setTimerData({
          estimatedWaitMinutes: 0,
          queuePosition: 0,
          actualWaitTime: 0,
          timeRemaining: 0
        });
        return;
      }

      // Calculate dynamic wait time using database function
      const { data: waitTimeData, error: waitTimeError } = await supabase
        .rpc('calculate_dynamic_wait_time', {
          p_salon_id: salonId,
          p_customer_id: customerId
        });

      // Calculate queue position using database function
      const { data: positionData, error: positionError } = await supabase
        .rpc('calculate_queue_position', {
          p_salon_id: salonId,
          p_customer_id: customerId
        });

      if (waitTimeError || positionError) {
        console.error('Error fetching queue calculations:', waitTimeError || positionError);
        return;
      }

      const estimatedWaitMinutes = waitTimeData || 0;
      const queuePosition = positionData || 0;
      const joinedAt = new Date(queueEntry.joined_at);
      const actualWaitTime = Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60));
      const timeRemaining = Math.max(0, estimatedWaitMinutes - actualWaitTime);

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
  };

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
      .channel('queue-updates')
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
  }, [salonId, customerId]);

  return {
    ...timerData,
    isLoading,
    formatTime,
    getStatusMessage,
    getStatusColor,
    refresh: fetchQueueData
  };
};