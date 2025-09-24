import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MobileNav } from "./MobileNav";

interface MobileLayoutProps {
  children: ReactNode;
}

export const MobileLayout = ({ children }: MobileLayoutProps) => {
  const location = useLocation();
  
  // Hide nav for customer booking flow and details pages
  const hideNav =
    location.pathname.includes('/salon/') ||
    location.pathname.includes('/book/') ||
    location.pathname.includes('/payment/') ||
    location.pathname.includes('/booking-confirmation');

  return (
    <div className="min-h-screen bg-background">
      <main className={hideNav ? "" : "pb-20"}>
        {children}
      </main>
      {!hideNav && <MobileNav />}
    </div>
  );
};