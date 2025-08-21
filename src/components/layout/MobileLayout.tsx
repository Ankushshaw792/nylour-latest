import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MobileNav } from "./MobileNav";

interface MobileLayoutProps {
  children: ReactNode;
}

export const MobileLayout = ({ children }: MobileLayoutProps) => {
  const location = useLocation();
  
  // Hide nav on certain pages like booking confirmation
  const hideNav = location.pathname.includes('/booking-confirmation');

  return (
    <div className="min-h-screen bg-background">
      <main className={hideNav ? "" : "pb-20"}>
        {children}
      </main>
      {!hideNav && <MobileNav />}
    </div>
  );
};