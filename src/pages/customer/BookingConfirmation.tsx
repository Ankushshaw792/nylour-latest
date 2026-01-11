import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock, MapPin, Phone, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import QueueTimer from "@/components/queue/QueueTimer";
import { CancellationDialog } from "@/components/bookings/CancellationDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BookingConfirmation = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const [booking, setBooking] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  // Fetch booking data
  useEffect(() => {
    const fetchBooking = async () => {
      if (!user || !bookingId) return;

      try {
        // Fetch customer profile for cancellation count and customer id
        const { data: profileData } = await supabase
          .from("customers")
          .select("id, cancellation_count")
          .eq("user_id", user.id)
          .maybeSingle();
        
        setCustomerProfile(profileData);

        // Fetch booking with basic data - use customer profile id, not auth user id
        const { data: bookingData, error } = await supabase
          .from("bookings")
          .select(`
            *,
            salons!inner (
              name,
              address,
              phone
            )
          `)
          .eq("id", bookingId)
          .eq("customer_id", profileData?.id || user.id)
          .maybeSingle();

        if (error || !bookingData) {
          console.error("Error fetching booking:", error);
          toast.error("Failed to load booking details");
          navigate("/bookings");
          return;
        }

        // Fetch service name
        const { data: serviceData } = await supabase
          .from("services")
          .select("name")
          .eq("id", bookingData.service_id)
          .maybeSingle();

        // Fetch queue entry if exists - use customer profile id and correct column names
        const { data: queueData } = await supabase
          .from("queue_entries")
          .select("position, estimated_wait_time, booking_id")
          .eq("booking_id", bookingId)
          .eq("status", "waiting")
          .maybeSingle();

        // Combine the data
        const combinedData = {
          ...bookingData,
          service_name: serviceData?.name || "Service",
          queue_entry: queueData,
          customer_profile_id: profileData?.id // Pass for QueueTimer
        };

        setBooking(combinedData);
      } catch (error) {
        console.error("Error fetching booking:", error);
        toast.error("Failed to load booking details");
        navigate("/bookings");
      } finally {
        setDataLoading(false);
      }
    };

    fetchBooking();
  }, [user, bookingId, navigate]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground mb-4">Unable to find your booking details.</p>
          <Button onClick={() => navigate("/bookings")}>View Bookings</Button>
        </div>
      </div>
    );
  }

  const salon = booking.salons;
  const service = booking.service_name;
  const queueEntry = booking.queue_entry;

  return (
    <div className="min-h-screen bg-background">
      {/* Success Header */}
      <div className="bg-gradient-primary text-white text-center py-12">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-white/90">Your appointment has been successfully booked</p>
      </div>

      <div className="p-4 space-y-6 -mt-6">
        {/* Booking Details Card */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">{salon.name}</h2>
              <p className="text-muted-foreground">Booking ID: {booking.id.substring(0, 8)}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Service</span>
                <span className="font-semibold">{service}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-semibold">
                  {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Booking Fee</span>
                <span className="font-semibold text-primary">₹10</span>
              </div>
              {booking.payment_method && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{booking.payment_method}</span>
                </div>
              )}
              {booking.payment_reference && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{booking.payment_reference}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant={booking.payment_status === "completed" ? "default" : "secondary"} className="capitalize">
                  {booking.payment_status || "Pending"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Status with Real-Time Timer - use internal customer ID */}
        {queueEntry && booking.customer_profile_id && (
          <QueueTimer 
            salonId={booking.salon_id} 
            customerId={booking.customer_profile_id}
            className="mb-4"
          />
        )}

        {/* Salon Contact */}
        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center mt-1">
                <Phone className="h-4 w-4 text-success" />
              </div>
              <div>
                <h4 className="font-semibold text-success mb-1">SMS Alert Activated</h4>
                <p className="text-sm text-muted-foreground">
                  You'll receive an SMS 15 minutes before your turn. Stay relaxed!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salon Contact */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Salon Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">{salon.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm">{salon.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          <Button
            variant="gradient"
            size="xl"
            className="w-full"
            onClick={() => navigate('/queue-status')}
          >
            <Clock className="h-5 w-5 mr-2" />
            View Live Queue
          </Button>
          
          <Button
            variant="destructive"
            size="xl"
            className="w-full"
            onClick={() => setIsCancelDialogOpen(true)}
          >
            Cancel Booking
          </Button>
        </div>
      </div>

      {/* Cancellation Dialog */}
      {bookingId && user && (
        <CancellationDialog
          isOpen={isCancelDialogOpen}
          onClose={() => setIsCancelDialogOpen(false)}
          bookingId={bookingId}
          customerId={user.id}
          cancellationCount={customerProfile?.cancellation_count || 0}
          onCancellationComplete={() => {
            toast.success('Booking cancelled successfully');
            navigate('/bookings');
          }}
        />
      )}
    </div>
  );
};

export default BookingConfirmation;