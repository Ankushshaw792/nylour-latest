import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface SalonCancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  type: "reject" | "noshow";
  onConfirm: (bookingId: string, reason: string) => Promise<void>;
}

const REJECTION_REASONS = [
  { value: "fully_booked", label: "Fully booked for this time slot" },
  { value: "staff_unavailable", label: "Staff unavailable" },
  { value: "emergency_closure", label: "Emergency salon closure" },
  { value: "other", label: "Other reason" },
];

const NOSHOW_REASONS = [
  { value: "did_not_arrive", label: "Customer did not arrive" },
  { value: "arrived_late", label: "Arrived too late to serve" },
  { value: "unreachable", label: "Could not contact customer" },
  { value: "other", label: "Other reason" },
];

export const SalonCancellationDialog = ({
  isOpen,
  onClose,
  bookingId,
  type,
  onConfirm,
}: SalonCancellationDialogProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason("");
      setCustomReason("");
    }
  }, [isOpen]);

  const reasons = type === "reject" ? REJECTION_REASONS : NOSHOW_REASONS;
  const title = type === "reject" ? "Reject Booking" : "Mark as No-Show";
  const description = type === "reject" 
    ? "Please select a reason for rejecting this booking. The customer will be notified."
    : "Please select a reason for marking this customer as a no-show.";

  const handleConfirm = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      const reason = selectedReason === "other" 
        ? customReason || (type === "reject" ? "Booking rejected by salon" : "Marked as no-show")
        : reasons.find(r => r.value === selectedReason)?.label || "";
      
      await onConfirm(bookingId, reason);
      onClose();
      setSelectedReason("");
      setCustomReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSelectedReason("");
      setCustomReason("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {reasons.map((reason) => (
              <div key={reason.value} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.value} id={reason.value} />
                <Label htmlFor={reason.value} className="cursor-pointer">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Please specify</Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason..."
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={type === "reject" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === "other" && !customReason.trim()) || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : type === "reject" ? (
              "Reject Booking"
            ) : (
              "Mark No-Show"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
