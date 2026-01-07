import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Check, X, Phone, Bell, CheckCircle, Plus, UserX, MessageSquare } from "lucide-react";
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
import { SalonCancellationDialog } from "@/components/salon/SalonCancellationDialog";

const BookingsOverview = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const { bookings, loading, acceptBooking, rejectBooking, startService, completeService, markNoShow, sendReminder, sendCustomReminder, addWalkInCustomer, salon } = useSalonRealtimeData();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedBookingForMessage, setSelectedBookingForMessage] = useState<{ customerId: string; bookingId: string } | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInService, setWalkInService] = useState("");
  const [availableServices, setAvailableServices] = useState<Array<{ id: string; salonServiceId: string; name: string; price: number }>>([]);
  
  // Cancellation dialog state
  const [cancellationDialog, setCancellationDialog] = useState<{
    isOpen: boolean;
    bookingId: string;
    type: "reject" | "noshow";
  }>({ isOpen: false, bookingId: "", type: "reject" });

  // Fetch available services for manual booking - MUST be before any returns
  useEffect(() => {
    if (!salon?.id) return;
    
    const fetchServices = async () => {
      // Fetch salon_services with service names and prices
      const { data: salonServices } = await supabase
        .from('salon_services')
        .select('id, service_id, price, services(id, name)')
        .eq('salon_id', salon.id)
        .eq('is_active', true);
      
      if (salonServices && salonServices.length > 0) {
        setAvailableServices(salonServices.map(s => ({
          id: s.service_id,  // services.id for dropdown value
          salonServiceId: s.id,  // salon_services.id for booking
          name: s.services?.name || 'Unknown Service',
          price: s.price
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

  const handleSendCustomMessage = async () => {
    if (!selectedBookingForMessage || !customMessage.trim()) return;
    await sendCustomReminder(selectedBookingForMessage.customerId, selectedBookingForMessage.bookingId, customMessage);
    setIsMessageDialogOpen(false);
    setCustomMessage("");
    setSelectedBookingForMessage(null);
  };

  const openMessageDialog = (customerId: string, bookingId: string) => {
    setSelectedBookingForMessage({ customerId, bookingId });
    setIsMessageDialogOpen(true);
  };

  const openRejectDialog = (bookingId: string) => {
    setCancellationDialog({ isOpen: true, bookingId, type: "reject" });
  };

  const openNoShowDialog = (bookingId: string) => {
    setCancellationDialog({ isOpen: true, bookingId, type: "noshow" });
  };

  const handleCancellationConfirm = async (bookingId: string, reason: string) => {
    if (cancellationDialog.type === "reject") {
      await rejectBooking(bookingId, reason);
    } else {
      await markNoShow(bookingId, reason);
    }
  };

  // Filter bookings by new tab structure
  const todayBookings = bookings.filter(b => b.status === 'pending');
  const queueBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress');
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'rejected' || b.status === 'cancelled');

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
                        {service.name} - ₹{service.price}
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

        {/* Custom Message Dialog */}
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message to Customer</DialogTitle>
              <DialogDescription>
                Send a custom notification to the customer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter your message..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCustomMessage("Your turn is coming up soon! Please be ready.")}>
                  Quick: Turn Soon
                </Button>
                <Button variant="outline" onClick={() => setCustomMessage("We're running a bit behind. Thank you for your patience!")}>
                  Quick: Running Late
                </Button>
              </div>
              <Button onClick={handleSendCustomMessage} className="w-full" disabled={!customMessage.trim()}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
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
                  onReject={openRejectDialog}
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
                  onStart={startService}
                  onComplete={completeService}
                  onNoShow={openNoShowDialog}
                  onSendReminder={sendReminder}
                  onSendMessage={openMessageDialog}
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

        {/* Cancellation/No-Show Reason Dialog */}
        <SalonCancellationDialog
          isOpen={cancellationDialog.isOpen}
          onClose={() => setCancellationDialog({ ...cancellationDialog, isOpen: false })}
          bookingId={cancellationDialog.bookingId}
          type={cancellationDialog.type}
          onConfirm={handleCancellationConfirm}
        />
      </div>
    </SalonDashboardLayout>
  );
};

// Booking Card Component
interface BookingCardProps {
  booking: any;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
  onSendReminder?: (customerId: string, bookingId: string) => void;
  onSendMessage?: (customerId: string, bookingId: string) => void;
  showActions: 'accept-reject' | 'queue' | 'none';
}

const BookingCard = ({ booking, onAccept, onReject, onStart, onComplete, onNoShow, onSendReminder, onSendMessage, showActions }: BookingCardProps) => {
  // Determine if this is a walk-in booking
  const isWalkIn = !booking.customer_id || booking.notes?.includes('Walk-in:');
  
  // Extract customer name from different possible sources
  const customerName = booking.customers 
    ? `${booking.customers.first_name || ''} ${booking.customers.last_name || ''}`.trim()
    : booking.notes?.includes('Walk-in:')
    ? booking.notes.split('Walk-in:')[1]?.split(' - ')[0]?.trim() || 'Walk-in Customer'
    : 'Walk-in Customer';
  
  const serviceName = booking.salon_services?.services?.name || 'Service';
  const servicePrice = booking.total_price || booking.salon_services?.price || 0;
  // For walk-ins, phone is stored as: "Walk-in: CustomerName - PhoneNumber"
  const phone = booking.customers?.phone || 
    (booking.notes?.includes('Walk-in:') 
      ? booking.notes.split('Walk-in:')[1]?.split(' - ')[1]?.trim() || 'N/A'
      : 'N/A');
  const bookingDate = format(new Date(booking.booking_date), 'MMM dd, yyyy');
  const bookingTime = booking.booking_time.slice(0, 5);
  
  const handleCall = () => {
    if (phone && phone !== 'N/A') {
      window.location.href = `tel:${phone}`;
    }
  };
  
  return (
    <Card className={`card-hover ${isWalkIn ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-primary'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Customer Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isWalkIn ? 'bg-amber-100' : 'bg-primary/20'}`}>
            <User className={`h-6 w-6 ${isWalkIn ? 'text-amber-600' : 'text-primary'}`} />
          </div>

          {/* Booking Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{customerName}</h4>
                  {isWalkIn && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                      Walk-in
                    </Badge>
                  )}
                  {!isWalkIn && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                      Online
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground mt-1">{serviceName}</p>
              </div>
              <Badge 
                variant={
                  booking.status === 'confirmed' ? 'default' : 
                  booking.status === 'pending' ? 'secondary' : 
                  booking.status === 'completed' ? 'default' :
                  'destructive'
                }
                className={
                  booking.status === 'completed' ? 'bg-green-500 hover:bg-green-600 text-white' :
                  booking.status === 'cancelled' || booking.status === 'rejected' ? 'bg-red-500 hover:bg-red-600 text-white' :
                  ''
                }
              >
                {booking.status}
              </Badge>
            </div>

            {/* Booking Info Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{bookingTime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{bookingDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <span>₹{servicePrice}</span>
              </div>
            </div>

            <div className="flex items-center justify-end">
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCall}
                    disabled={phone === 'N/A'}
                    title="Call customer"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => booking.customer_id && onSendReminder?.(booking.customer_id, booking.id)}
                    disabled={!booking.customer_id}
                    title="Send quick reminder"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => booking.customer_id && onSendMessage?.(booking.customer_id, booking.id)}
                    disabled={!booking.customer_id}
                    title="Send custom message"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  {booking.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onNoShow?.(booking.id)}
                        title="Mark as no-show"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onStart?.(booking.id)}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    </>
                  )}
                  {booking.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => onComplete?.(booking.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
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