import { useEffect, useRef, useCallback } from 'react';
import { startBookingAlertLoop, stopBookingAlertLoop } from '@/lib/notificationSound';

interface UseBookingAlertSoundOptions {
  enabled?: boolean;
  muted?: boolean;
}

export const useBookingAlertSound = (
  pendingBookingsCount: number,
  options: UseBookingAlertSoundOptions = {}
) => {
  const { enabled = true, muted = false } = options;
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    // Don't do anything if disabled or muted
    if (!enabled || muted) {
      stopBookingAlertLoop();
      wasPlayingRef.current = false;
      return;
    }

    // Start alert if there are pending bookings
    if (pendingBookingsCount > 0) {
      startBookingAlertLoop();
      wasPlayingRef.current = true;
    } else {
      // Stop alert when no pending bookings
      stopBookingAlertLoop();
      wasPlayingRef.current = false;
    }

    // Cleanup on unmount
    return () => {
      stopBookingAlertLoop();
      wasPlayingRef.current = false;
    };
  }, [pendingBookingsCount, enabled, muted]);

  // Provide manual control functions
  const stop = useCallback(() => {
    stopBookingAlertLoop();
    wasPlayingRef.current = false;
  }, []);

  const restart = useCallback(() => {
    if (pendingBookingsCount > 0 && enabled && !muted) {
      startBookingAlertLoop();
      wasPlayingRef.current = true;
    }
  }, [pendingBookingsCount, enabled, muted]);

  return { stop, restart, isPlaying: wasPlayingRef.current };
};
