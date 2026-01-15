import { useEffect, useRef, useCallback } from 'react';
import { startBookingAlertLoop, stopBookingAlertLoop } from '@/lib/notificationSound';

interface UseBookingAlertSoundOptions {
  muted?: boolean;
}

export const useBookingAlertSound = (
  pendingBookingsCount: number,
  options: UseBookingAlertSoundOptions = {}
) => {
  const { muted = false } = options;
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    // Don't play if muted
    if (muted) {
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
  }, [pendingBookingsCount, muted]);

  // Provide manual control functions
  const stop = useCallback(() => {
    stopBookingAlertLoop();
    wasPlayingRef.current = false;
  }, []);

  const restart = useCallback(() => {
    if (pendingBookingsCount > 0 && !muted) {
      startBookingAlertLoop();
      wasPlayingRef.current = true;
    }
  }, [pendingBookingsCount, muted]);

  return { stop, restart, isPlaying: wasPlayingRef.current };
};
