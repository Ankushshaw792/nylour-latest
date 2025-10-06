import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Check, X, Phone, Bell, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isFuture } from "date-fns";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BookingsOverview = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const { bookings, loading, acceptBooking, rejectBooking, completeService, sendReminder, addWalkInCustomer, salon } = useSalonRealtimeData();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInService, setWalkInService] = useState("");
  const [availableServices, setAvailableServices] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch available services for manual booking - MUST be before any returns
  useEffect(() => {
    if (!salon?.id) return;
    
    const fetchServices = async () => {
      const { data } = await supabase
        .from('salon_services')
        .select('service_id, services(name)')
        .eq('salon_id', salon.id)
        .eq('is_active', true);
      
      if (data) {
        setAvailableServices(data.map(s => ({
          id: s.service_id,
          name: s.services?.name || 'Service'
        })));
      }
    };
    fetchServices();
  }, [salon?.id]);

  // Early return AFTER all hooks
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

  const handleAddWalkIn = async () => {
    if (!walkInName || !walkInPhone || !walkInService) return;
    
    await addWalkInCustomer({
      name: walkInName,
      phone: walkInPhone,
      service_id: walkInService
    });
    
    setIsAddDialogOpen(false);
    setWalkInName("");
    setWalkInPhone("");
    setWalkInService("");
  };

  // Filter bookings by new tab structure
  const todayBookings = bookings.filter(b => b.status === 'pending');
  const queueBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress');
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'rejected');

  return (
    <SalonDashboardLayout
      title="Online Bookings"
      description="Manage customer appointments"
    >
      <div className="p-4">
        {/* Add Walk-in Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mb-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Walk-in Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Walk-in Customer</DialogTitle>
              <DialogDescription>
                Add a customer who walked in without prior booking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select value={walkInService} onValueChange={setWalkInService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddWalkIn} className="w-full">
                Add to Queue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today ({todayBookings.length})</TabsTrigger>
            <TabsTrigger value="queue">Queue ({queueBookings.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
          </TabsList>

          {/* Today's Bookings (Pending) */}
          <TabsContent value="today" className="space-y-4">
            {todayBookings.length > 0 ? (
              todayBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onAccept={acceptBooking}
                  onReject={rejectBooking}
                  showActions="accept-reject"
                />
              ))
            ) : (
              <EmptyState message="No new bookings" />
            )}
          </TabsContent>

          {/* Queue Bookings (Confirmed/In Progress) */}
          <TabsContent value="queue" className="space-y-4">
            {queueBookings.length > 0 ? (
              queueBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onComplete={completeService}
                  onSendReminder={sendReminder}
                  showActions="queue"
                />
              ))
            ) : (
              <EmptyState message="No bookings in queue" />
            )}
          </TabsContent>

          {/* Completed Bookings */}
          <TabsContent value="completed" className="space-y-4">
            {completedBookings.length > 0 ? (
              completedBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  showActions="none"
                />
              ))
            ) : (
              <EmptyState message="No completed bookings today" />
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
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
  onSendReminder?: (customerId: string, bookingId: string) => void;
  showActions: 'accept-reject' | 'queue' | 'none';
}

const BookingCard = ({ booking, onAccept, onReject, onComplete, onSendReminder, showActions }: BookingCardProps) => {
  // Extract customer name from different possible sources
  const customerName = booking.customers 
    ? `${booking.customers.first_name || ''} ${booking.customers.last_name || ''}`.trim()
    : booking.customer_notes?.includes('Walk-in:')
    ? booking.customer_notes.split('Walk-in:')[1]?.split(' - ')[0]?.trim() || 'Walk-in Customer'
    : 'Walk-in Customer';
  
  const serviceName = booking.salon_services?.services?.name || 'Service';
  const phone = booking.customers?.phone || 
    (booking.customer_notes?.includes('Walk-in:') 
      ? booking.customer_notes.split(' - ')[1]?.trim() 
      : 'N/A');
  const bookingDate = format(new Date(booking.booking_date), 'MMM dd, yyyy');
  const bookingTime = booking.booking_time.slice(0, 5);
  
  const handleCall = () => {
    if (phone && phone !== 'N/A') {
      window.location.href = `tel:${phone}`;
    }
  };
  
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
              
              {showActions === 'accept-reject' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject?.(booking.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAccept?.(booking.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </div>
              )}
              
              {showActions === 'queue' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCall}
                    disabled={phone === 'N/A'}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => booking.customer_id && onSendReminder?.(booking.customer_id, booking.id)}
                    disabled={!booking.customer_id}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onComplete?.(booking.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
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