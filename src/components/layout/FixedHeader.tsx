import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";

interface FixedHeaderProps {
  title?: string;
  leftContent?: ReactNode;
  showBackButton?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  onProfileClick?: () => void;
  rightContent?: ReactNode;
  className?: string;
}

export const FixedHeader = ({
  title,
  leftContent,
  showBackButton = false,
  showProfile = true,
  showNotifications = true,
  onProfileClick,
  rightContent,
  className = ""
}: FixedHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Auto-generate title based on current route if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    if (path === '/') return 'Find Salons';
    if (path === '/bookings') return 'My Bookings';
    if (path === '/queue') return 'Queue Status';
    if (path === '/profile') return 'Profile';
    if (path.includes('/salon/')) return 'Salon Details';
    if (path.includes('/book/')) return 'Book Service';
    if (path.includes('/payment/')) return 'Payment';
    return 'Nylour';
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 glass border-b border-border ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 h-14">
        {/* Left Section */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBackButton && (
            <Button
              variant="ghost"
              size="mobile-icon"
              onClick={handleBackClick}
              className="text-foreground hover:bg-muted flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {leftContent ? (
            <div className="flex-1 min-w-0">{leftContent}</div>
          ) : (
            <h1 className="text-lg font-semibold text-foreground truncate">
              {getPageTitle()}
            </h1>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {rightContent || (
            <>
              {showNotifications && user && (
                <NotificationBell />
              )}
              {showProfile && (
                <Avatar 
                  className="h-8 w-8 cursor-pointer ring-2 ring-border hover:ring-primary transition-all"
                  onClick={handleProfileClick}
                >
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm">
                    {user ? 
                      `${user.user_metadata?.first_name?.[0] || ''}${user.user_metadata?.last_name?.[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
                      : 'U'
                    }
                  </AvatarFallback>
                </Avatar>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};