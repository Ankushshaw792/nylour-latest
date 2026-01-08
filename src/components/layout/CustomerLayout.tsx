import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { FixedHeader } from "./FixedHeader";
import { MobileNav } from "./MobileNav";
import { FixedBottomButton } from "./FixedBottomButton";

interface CustomerLayoutProps {
  children: ReactNode;
  headerProps?: {
    title?: string;
    leftContent?: ReactNode;
    showBackButton?: boolean;
    showProfile?: boolean;
    showNotifications?: boolean;
    onProfileClick?: () => void;
    rightContent?: ReactNode;
  };
  bottomButtonProps?: {
    text: string;
    onClick: () => void;
    disabled?: boolean;
    price?: number;
    itemCount?: number;
    variant?: "default" | "gradient" | "outline" | "ghost";
  };
}

export const CustomerLayout = ({ 
  children, 
  headerProps,
  bottomButtonProps 
}: CustomerLayoutProps) => {
  const location = useLocation();
  
  // Determine layout mode based on current route
  const isSalonDetailsMode = location.pathname.includes('/salon/');
  const isBookingFlowMode = location.pathname.includes('/book/') || 
                          location.pathname.includes('/payment/') ||
                          location.pathname.includes('/booking-confirmation');
  
  // Hide bottom nav on salon details, booking flow, and specific pages
  const hideBottomNav = isSalonDetailsMode || 
                       isBookingFlowMode || 
                       location.pathname.includes('/booking-confirmation');

  // Determine if we should show back button
  const showBackButton = isSalonDetailsMode || 
                         isBookingFlowMode ||
                         location.pathname === '/profile' ||
                         location.pathname === '/bookings' ||
                         location.pathname === '/queue';

  // Calculate content padding based on layout mode
  const getContentClasses = () => {
    let classes = "pt-14"; // Always account for fixed header
    
    if (bottomButtonProps) {
      // Booking flow mode with fixed bottom button
      classes += " pb-20"; // Space for fixed bottom button
    } else if (!hideBottomNav) {
      // Standard mode with bottom nav
      classes += " pb-20"; // Space for bottom nav
    } else {
      // Salon details mode (no bottom elements)
      classes += " pb-6"; // Just some bottom padding
    }
    
    return classes;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <FixedHeader
        showBackButton={showBackButton}
        {...headerProps}
      />

      {/* Main Content */}
      <main className={getContentClasses()}>
        {children}
      </main>

      {/* Fixed Bottom Button (for booking flow) */}
      {bottomButtonProps && (
        <FixedBottomButton {...bottomButtonProps} />
      )}

      {/* Bottom Navigation (for standard pages) */}
      {!hideBottomNav && <MobileNav />}
    </div>
  );
};