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

interface BookingService {
  id: string;
  quantity: number;
  unit_price: number;
  unit_duration: number;
  service_name: string;
}

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
  const [bookingServices, setBookingServices] = useState<BookingService[]>([]);
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

  // Format date and time
  const bookingDate = booking?.booking_date
    ? format(new Date(booking.booking_date), "MMM dd, yyyy")
    : "";
  const bookingTime = booking?.booking_time?.slice(0, 5) || "";

  // Fetch companions and booking services
  useEffect(() => {
    const fetchData = async () => {
      if (!booking?.id || !isOpen) return;
      setLoading(true);
      try {
        // Fetch companions
        const { data: companionsData } = await supabase
          .from("booking_companions")
          .select("*")
          .eq("booking_id", booking.id);
        setCompanions(companionsData || []);

        // Fetch booking services from booking_services table
        const { data: servicesData } = await supabase
          .from("booking_services")
          .select(`
            id,
            quantity,
            unit_price,
            unit_duration,
            salon_services (
              id,
              services (name)
            )
          `)
          .eq("booking_id", booking.id);

        if (servicesData && servicesData.length > 0) {
          const mappedServices: BookingService[] = servicesData.map((s: any) => ({
            id: s.id,
            quantity: s.quantity,
            unit_price: s.unit_price,
            unit_duration: s.unit_duration,
            service_name: s.salon_services?.services?.name || "Service"
          }));
          setBookingServices(mappedServices);
        } else {
          // Fallback to single service from booking if no booking_services exist
          const serviceName = booking?.salon_services?.services?.name || "Service";
          const servicePrice = booking?.salon_services?.price || booking?.total_price || 0;
          setBookingServices([{
            id: booking.id,
            quantity: 1,
            unit_price: servicePrice,
            unit_duration: booking?.duration || 30,
            service_name: serviceName
          }]);
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [booking?.id, isOpen]);

  const handleCall = () => {
    if (phone && phone !== "N/A") {
      window.location.href = `tel:${phone}`;
    }
  };

  if (!booking) return null;

  // Calculate totals
  const totalPrice = bookingServices.reduce((sum, s) => sum + (s.unit_price * s.quantity), 0);
  const totalDuration = bookingServices.reduce((sum, s) => sum + (s.unit_duration * s.quantity), 0);

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

        {/* Service Details - Now shows ALL services */}
        <div className="space-y-3">
          <h4 className="font-medium">Services Booked</h4>
          
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {bookingServices.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{service.service_name}</span>
                      {service.quantity > 1 && (
                        <Badge variant="secondary" className="text-xs">x{service.quantity}</Badge>
                      )}
                    </div>
                    <span className="font-semibold text-primary">₹{service.unit_price * service.quantity}</span>
                  </div>
                ))}
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
                <div>
                  <span className="font-medium">Total</span>
                  <span className="text-sm text-muted-foreground ml-2">({totalDuration} min)</span>
                </div>
                <span className="font-bold text-lg text-primary">₹{totalPrice}</span>
              </div>
            </>
          )}
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
