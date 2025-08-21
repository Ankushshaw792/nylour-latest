import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock, MapPin, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const BookingConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Mock booking data
  const booking = {
    bookingId: "NYL001234",
    salonName: "Style Studio",
    service: "Haircut",
    time: "Now",
    queuePosition: 2,
    estimatedTime: "20 mins",
    address: "123 Fashion Street, Downtown",
    phone: "+91 98765 43210",
    totalPaid: "₹309"
  };

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
              <h2 className="text-xl font-bold text-foreground mb-1">{booking.salonName}</h2>
              <p className="text-muted-foreground">Booking ID: {booking.bookingId}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Service</span>
                <span className="font-semibold">{booking.service}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Time</span>
                <span className="font-semibold">{booking.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-primary">{booking.totalPaid}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Status */}
        <Card className="bg-gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Your Position in Queue</h3>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                    #{booking.queuePosition}
                  </Badge>
                  <span className="text-muted-foreground">Est. {booking.estimatedTime}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Alert Info */}
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
                <span className="text-sm">{booking.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm">{booking.phone}</span>
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
            <Calendar className="h-5 w-5 mr-2" />
            Track Your Queue Status
          </Button>
          
          <Button
            variant="mobile-outline"
            size="xl"
            className="w-full"
            onClick={() => navigate('/')}
          >
            Book Another Salon
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;