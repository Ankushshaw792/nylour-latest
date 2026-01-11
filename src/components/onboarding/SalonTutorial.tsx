import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useSalonTutorialStatus } from "@/hooks/useTutorialStatus";

const salonSteps: Step[] = [
  {
    target: '[data-tour="online-toggle"]',
    title: "🟢 Go Online/Offline",
    content: "Toggle this to show or hide your salon from customers. When offline, customers won't be able to book.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="notification-bell"]',
    title: "🔔 Notifications",
    content: "Get instant alerts for new bookings, customer arrivals, and queue updates. Stay on top of your business!",
    placement: "bottom",
  },
  {
    target: '[data-tour="queue-section"]',
    title: "👥 Customer Queue",
    content: "See real-time queue of customers waiting for service. Start and complete services with one tap.",
    placement: "top",
  },
  {
    target: '[data-tour="profile-button"]',
    title: "⚙️ Your Profile",
    content: "Manage store info, timings, services, gallery, and all your settings from here.",
    placement: "bottom",
  },
];

export const SalonTutorial = () => {
  const { showTutorial, loading, completeTutorial } = useSalonTutorialStatus();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Small delay to ensure DOM elements are rendered
    if (showTutorial && !loading) {
      const timer = setTimeout(() => setRun(true), 500);
      return () => clearTimeout(timer);
    }
  }, [showTutorial, loading]);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      await completeTutorial();
    }
  };

  if (loading || !showTutorial) {
    return null;
  }

  return (
    <Joyride
      steps={salonSteps}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      disableOverlayClose
      callback={handleJoyrideCallback}
      locale={{
        back: "Back",
        close: "Close",
        last: "Done",
        next: "Next",
        skip: "Skip Tutorial",
      }}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          zIndex: 10000,
          arrowColor: "hsl(var(--card))",
          backgroundColor: "hsl(var(--card))",
          textColor: "hsl(var(--foreground))",
          overlayColor: "rgba(0, 0, 0, 0.6)",
        },
        tooltip: {
          borderRadius: 12,
          padding: 16,
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 8,
        },
        tooltipContent: {
          fontSize: 14,
          lineHeight: 1.5,
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          borderRadius: 8,
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          marginRight: 8,
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 13,
        },
        spotlight: {
          borderRadius: 12,
        },
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
};
