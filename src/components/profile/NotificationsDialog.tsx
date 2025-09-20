import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotificationsList } from "@/components/notifications/NotificationsList";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationsDialog = ({
  open,
  onOpenChange,
}: NotificationsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <NotificationsList onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
};