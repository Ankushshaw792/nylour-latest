import { useState } from "react";
import { Calendar, Clock, User, Check, X, Phone, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";

// Mock data for bookings
const initialBookings = [
  {
    id: 1,
    customerName: "Rahul Kumar",
    phone: "+91 98765 43210",
    service: "Haircut",
    time: "10:30 AM",
    date: "Today",
    status: "pending",
    amount: "₹309"
  },
  {
    id: 2,
    customerName: "Priya Singh",
    phone: "+91 98765 43211",
    service: "Beard Trim", 
    time: "11:00 AM",
    date: "Today",
    status: "confirmed",
    amount: "₹159"
  },
  {
    id: 3,
    customerName: "Amit Sharma",
    phone: "+91 98765 43212",
    service: "Hair Wash",
    time: "2:30 PM",
    date: "Today",
    status: "pending",
    amount: "₹109"
  },
  {
    id: 4,
    customerName: "Sneha Patel",
    phone: "+91 98765 43213",
    service: "Haircut",
    time: "10:00 AM",
    date: "Tomorrow",
    status: "confirmed",
    amount: "₹309"
  }
];

const BookingsOverview = () => {
  const [bookings, setBookings] = useState(initialBookings);
  
  const handleAcceptBooking = (bookingId: number) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'confirmed' }
          : booking
      )
    );
  };

  const handleRejectBooking = (bookingId: number) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'rejected' }
          : booking
      )
    );
  };

  const todayBookings = bookings.filter(b => b.date === 'Today');
  const upcomingBookings = bookings.filter(b => b.date !== 'Today');
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
                  onAccept={handleAcceptBooking}
                  onReject={handleRejectBooking}
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
                  onAccept={handleAcceptBooking}
                  onReject={handleRejectBooking}
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
                  onAccept={handleAcceptBooking}
                  onReject={handleRejectBooking}
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
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}

const BookingCard = ({ booking, onAccept, onReject }: BookingCardProps) => {
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
                <h4 className="font-semibold">{booking.customerName}</h4>
                <p className="text-sm text-muted-foreground">{booking.service}</p>
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
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>{booking.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">{booking.amount}</span>
              
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
                    variant="success"
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