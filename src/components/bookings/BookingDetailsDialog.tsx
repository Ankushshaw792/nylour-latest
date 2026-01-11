import { useState, useEffect } from "react";
import { Phone, Calendar, Clock, User, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import ArrivalCountdownTimer from "@/components/queue/ArrivalCountdownTimer";

interface BookingDetailsDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  queuePosition?: number | null;
}

export const BookingDetailsDialog = ({
  booking,
  isOpen,
  onClose,
  queuePosition,
}: BookingDetailsDialogProps) => {
  const [companions, setCompanions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to parse walk-in info from notes
  const parseWalkInInfo = (notes: string | null) => {
    if (!notes || !notes.includes("Walk-in:")) return null;
    const walkInPart = notes.split("Walk-in:")[1];
    const parts = walkInPart?.split(" - ");
    return {
      name: parts?.[0]?.trim() || "Walk-in Customer",
      phone: parts?.[1]?.trim() || "N/A",
    };
  };

  const isWalkIn = !booking?.customer_id || booking?.notes?.includes("Walk-in:");
  const walkInInfo = parseWalkInInfo(booking?.notes);

  // Get customer details
  const customerName = booking?.customers
    ? `${booking.customers.first_name || ""} ${booking.customers.last_name || ""}`.trim() || "Profile Incomplete"
    : walkInInfo?.name || "Walk-in Customer";

  const phone = booking?.customers?.phone || walkInInfo?.phone || "N/A";
  const avatarUrl = booking?.customers?.avatar_url;

  // Service info
  const serviceName = booking?.salon_services?.services?.name || "Service";
  const servicePrice = booking?.salon_services?.price || booking?.total_price || 0;

  // Format date and time
  const bookingDate = booking?.booking_date
    ? format(new Date(booking.booking_date), "MMM dd, yyyy")
    : "";
  const bookingTime = booking?.booking_time?.slice(0, 5) || "";

  // Fetch companions for group bookings
  useEffect(() => {
    const fetchCompanions = async () => {
      if (!booking?.id || !isOpen) return;
      setLoading(true);
      try {
        const { data } = await supabase
          .from("booking_companions")
          .select("*")
          .eq("booking_id", booking.id);
        setCompanions(data || []);
      } catch (error) {
        console.error("Error fetching companions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanions();
  }, [booking?.id, isOpen]);

  const handleCall = () => {
    if (phone && phone !== "N/A") {
      window.location.href = `tel:${phone}`;
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Booking Details
          </DialogTitle>
        </DialogHeader>

        {/* Customer Info Section */}
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <Avatar className="w-16 h-16">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className={isWalkIn ? "bg-amber-100" : "bg-primary/20"}>
              <User className={`h-8 w-8 ${isWalkIn ? "text-amber-600" : "text-primary"}`} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{customerName}</h3>
              {isWalkIn ? (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                  Walk-in
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                  Online
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{phone}</span>
            </div>
          </div>
        </div>

        {/* Arrival Countdown - Only show for position 1 */}
        {booking.arrival_deadline &&
          booking.status === "confirmed" &&
          !isWalkIn &&
          queuePosition === 1 && (
            <ArrivalCountdownTimer arrivalDeadline={booking.arrival_deadline} />
          )}

        {/* Queue Position */}
        {queuePosition && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">Queue Position</span>
            <Badge variant="default" className="text-lg px-3 py-1">
              #{queuePosition}
            </Badge>
          </div>
        )}

        <Separator />

        {/* Service Details */}
        <div className="space-y-3">
          <h4 className="font-medium">Service Booked</h4>
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span>{serviceName}</span>
            <span className="font-semibold text-primary">₹{servicePrice}</span>
          </div>
          
          {/* Companions */}
          {companions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  +{companions.length} companion{companions.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2 pl-6">
                {companions.map((companion) => (
                  <div key={companion.id} className="flex justify-between items-center text-sm">
                    <span>{companion.name}</span>
                    <span className="text-muted-foreground">{companion.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-medium">Total</span>
            <span className="font-bold text-lg text-primary">₹{servicePrice}</span>
          </div>
        </div>

        <Separator />

        {/* Booking Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{bookingDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-medium">{bookingTime}</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge
            variant={
              booking.status === "confirmed"
                ? "default"
                : booking.status === "pending"
                ? "secondary"
                : booking.status === "completed"
                ? "default"
                : "destructive"
            }
            className={
              booking.status === "completed"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : booking.status === "cancelled" || booking.status === "rejected"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : ""
            }
          >
            {booking.status}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCall}
            disabled={phone === "N/A"}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
