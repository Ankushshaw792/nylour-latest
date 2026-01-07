import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  customerId: string;
  cancellationCount: number;
  onCancellationComplete: () => void;
}

export const CancellationDialog = ({
  isOpen,
  onClose,
  bookingId,
  customerId,
  cancellationCount,
  onCancellationComplete
}: CancellationDialogProps) => {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelBooking = async () => {
    try {
      setIsCancelling(true);
      
      const { error } = await supabase.rpc('apply_cancellation_fee', {
        p_booking_id: bookingId,
        p_customer_id: customerId,
        p_reason: 'Cancelled by customer'
      });

      if (error) {
        console.error('Error cancelling booking:', error);
        toast.error('Failed to cancel booking');
        return;
      }

      // Also update the cancellation_reason column
      await supabase
        .from('bookings')
        .update({ cancellation_reason: 'Cancelled by customer' })
        .eq('id', bookingId);

      toast.success('Booking cancelled. A cancellation fee of ₹5 has been applied.');
      onCancellationComplete();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to cancel this booking?</p>
            <p className="font-semibold text-destructive">
              A cancellation fee of ₹5 will be charged.
            </p>
            {cancellationCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Total cancellations: {cancellationCount}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>Keep Booking</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancelBooking}
            disabled={isCancelling}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Booking'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
