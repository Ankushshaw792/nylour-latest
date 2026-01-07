let notificationAudio: HTMLAudioElement | null = null;

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
