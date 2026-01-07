import { formatDistanceToNow } from "date-fns";
import { X, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications, Notification } from "@/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'booking_confirmation':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'booking_update':
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case 'queue_update':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'service_reminder':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

export const NotificationItem = ({ notification, onClose }: NotificationItemProps) => {
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    // TODO: Add navigation logic based on notification type and related_id
    onClose?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  return (
    <div
      className={cn(
        "p-4 hover:bg-muted/30 cursor-pointer transition-colors relative group",
        !notification.is_read && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className={cn(
              "text-sm font-medium text-foreground",
              !notification.is_read && "font-semibold"
            )}>
              {notification.title}
            </h4>
            
            {/* Delete button */}
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-1 h-6 w-6 p-0"
              onClick={handleDelete}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Unread indicator */}
        {!notification.is_read && (
          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
};