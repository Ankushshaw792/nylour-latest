import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useCustomerTutorialStatus } from "@/hooks/useTutorialStatus";

const customerSteps: Step[] = [
  {
    target: '[data-tour="location-selector"]',
    title: "📍 Set Your Location",
    content: "Enable location or enter your area to find salons near you. This helps us show you the closest options.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="search-bar"]',
    title: "🔍 Search Salons",
    content: "Search for salons by name or find specific services like haircuts, beard trims, and more.",
    placement: "bottom",
  },
  {
    target: '[data-tour="filter-tabs"]',
    title: "⚡ Quick Filters",
    content: "Filter to see only open salons, nearby options, or those with quick service times.",
    placement: "bottom",
  },
  {
    target: '[data-tour="salon-card"]',
    title: "💈 Book a Salon",
    content: "Tap any salon card to see services, real-time wait times, and book your slot instantly.",
    placement: "top",
  },
  {
    target: '[data-tour="profile-button"]',
    title: "👤 Your Profile",
    content: "Access your bookings, favorites, order history, and account settings here.",
    placement: "bottom",
  },
];

export const CustomerTutorial = () => {
  const { showTutorial, loading, completeTutorial } = useCustomerTutorialStatus();
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
      steps={customerSteps}
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
