let notificationAudio: HTMLAudioElement | null = null;
let bookingAlertAudio: HTMLAudioElement | null = null;
let isAlertLooping = false;

export const playNotificationSound = () => {
  try {
    if (!notificationAudio) {
      notificationAudio = new Audio('/sounds/notification.mp3');
      notificationAudio.volume = 0.5;
    }
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch((error) => {
      // Autoplay may be blocked by browser policy - this is expected
      console.warn('Could not play notification sound (autoplay policy):', error);
    });
  } catch (error) {
    console.error('Failed to initialize notification sound:', error);
  }
};

// Persistent booking alert functions for salon owners
export const startBookingAlertLoop = () => {
  if (isAlertLooping) return;
  
  try {
    if (!bookingAlertAudio) {
      bookingAlertAudio = new Audio('/sounds/notification.mp3');
      bookingAlertAudio.volume = 0.7;
      bookingAlertAudio.loop = true; // Enable native looping
    }
    
    bookingAlertAudio.currentTime = 0;
    bookingAlertAudio.play()
      .then(() => {
        isAlertLooping = true;
      })
      .catch((error) => {
        console.warn('Could not start booking alert (autoplay policy):', error);
        isAlertLooping = false;
      });
  } catch (error) {
    console.error('Failed to initialize booking alert sound:', error);
    isAlertLooping = false;
  }
};

export const stopBookingAlertLoop = () => {
  if (bookingAlertAudio) {
    bookingAlertAudio.pause();
    bookingAlertAudio.currentTime = 0;
    isAlertLooping = false;
  }
};

export const isBookingAlertPlaying = () => isAlertLooping;

// Unlock audio context with user interaction (for browsers that block autoplay)
export const unlockAudioContext = () => {
  try {
    // Create and play a silent audio to unlock the context
    const silentAudio = new Audio('/sounds/notification.mp3');
    silentAudio.volume = 0.01;
    silentAudio.play().then(() => {
      silentAudio.pause();
      silentAudio.currentTime = 0;
    }).catch(() => {
      // Ignore errors - this is just to unlock
    });
  } catch {
    // Ignore errors
  }
};
