import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, Clock, Settings, Users, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

const customerNavItems = [
  { icon: MapPin, label: "Nearby", path: "/customer" },
  { icon: Calendar, label: "Bookings", path: "/bookings" },
  { icon: Clock, label: "Queue", path: "/queue-status" },
  { icon: User, label: "Profile", path: "/profile" },
];

const salonNavItems = [
  { icon: Users, label: "Queue", path: "/salon-dashboard" },
  { icon: Calendar, label: "Bookings", path: "/salon-dashboard/bookings" },
  { icon: Clock, label: "Check-in", path: "/salon-dashboard/checkin" },
  { icon: Settings, label: "Profile", path: "/salon-dashboard/profile" },
];

export const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine if we're in salon dashboard mode
  const isSalonMode = location.pathname.includes('/salon-dashboard');
  const navItems = isSalonMode ? salonNavItems : customerNavItems;

  return (
    <nav className="mobile-nav">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};