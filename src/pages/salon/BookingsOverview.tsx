import { Calendar, Clock, User, Check, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isFuture } from "date-fns";

const BookingsOverview = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const { bookings, loading, acceptBooking, rejectBooking } = useSalonRealtimeData();

  if (authLoading || loading) {
    return (
      <SalonDashboardLayout title="Online Bookings" description="Manage customer appointments">
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </SalonDashboardLayout>
    );
  }

  const todayBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    return isToday(bookingDate);
  });

  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    return isFuture(bookingDate) && !isToday(bookingDate);
  });

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  return (
    <SalonDashboardLayout
      title="Online Bookings"
      description="Manage customer appointments"
    >
      <div className="p-4">
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today ({todayBookings.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          {/* Today's Bookings */}
          <TabsContent value="today" className="space-y-4">
            {todayBookings.length > 0 ? (
              todayBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onAccept={acceptBooking}
                  onReject={rejectBooking}
                />
              ))
            ) : (
              <EmptyState message="No bookings for today" />
            )}
          </TabsContent>

          {/* Pending Bookings */}
          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length > 0 ? (
              pendingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onAccept={acceptBooking}
                  onReject={rejectBooking}
                />
              ))
            ) : (
              <EmptyState message="No pending bookings" />
            )}
          </TabsContent>

          {/* Upcoming Bookings */}
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onAccept={acceptBooking}
                  onReject={rejectBooking}
                />
              ))
            ) : (
              <EmptyState message="No upcoming bookings" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SalonDashboardLayout>
  );
};

// Booking Card Component
interface BookingCardProps {
  booking: any;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const BookingCard = ({ booking, onAccept, onReject }: BookingCardProps) => {
  const customerName = booking.customers 
    ? `${booking.customers.first_name || ''} ${booking.customers.last_name || ''}`.trim() || 'Walk-in Customer'
    : 'Unknown';
  
  const serviceName = booking.salon_services?.services?.name || 'Service';
  const phone = booking.customers?.phone || 'N/A';
  const bookingDate = format(new Date(booking.booking_date), 'MMM dd, yyyy');
  const bookingTime = booking.booking_time.slice(0, 5);
  
  return (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Customer Avatar */}
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>

          {/* Booking Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{customerName}</h4>
                <p className="text-sm text-muted-foreground">{serviceName}</p>
              </div>
              <Badge 
                variant={
                  booking.status === 'confirmed' ? 'default' : 
                  booking.status === 'pending' ? 'secondary' : 
                  'destructive'
                }
              >
                {booking.status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{bookingTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{bookingDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">₹{booking.total_price}</span>
              
              {booking.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject(booking.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAccept(booking.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Empty State Component
const EmptyState = ({ message }: { message: string }) => (
  <Card>
    <CardContent className="p-8 text-center">
      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold mb-2">{message}</h3>
      <p className="text-muted-foreground">New bookings will appear here</p>
    </CardContent>
  </Card>
);

export default BookingsOverview;