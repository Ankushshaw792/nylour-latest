import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, MapPin, Clock, Calendar, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import QueueTimer from '@/components/queue/QueueTimer';
import { CancellationDialog } from '@/components/bookings/CancellationDialog';

interface BookingService {
  id: string;
  quantity: number;
  unit_price: number;
  unit_duration: number;
  service_name: string;
}

interface BookingSummaryDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingSummaryDialog = ({ booking, isOpen, onClose }: BookingSummaryDialogProps) => {
  const navigate = useNavigate();
  const [queueEntry, setQueueEntry] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bookingServices, setBookingServices] = useState<BookingService[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationCount, setCancellationCount] = useState(0);

  // Fetch service names and queue data
  useEffect(() => {
    const fetchData = async () => {
      if (!booking || !isOpen) return;
      setLoading(true);

      try {
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
          if (booking.service_id) {
            const { data: salonServiceData } = await supabase
              .from("salon_services")
              .select("id, price, duration, services(name)")
              .eq("id", booking.service_id)
              .maybeSingle();

            if (salonServiceData) {
              setBookingServices([{
                id: salonServiceData.id,
                quantity: 1,
                unit_price: salonServiceData.price || booking.total_price || 0,
                unit_duration: salonServiceData.duration || booking.duration || 30,
                service_name: (salonServiceData.services as any)?.name || "Service"
              }]);
            }
          }
        }

        // Fetch customer cancellation count
        if (booking.customer_id) {
          const { data: customerData } = await supabase
            .from("customers")
            .select("cancellation_count")
            .eq("id", booking.customer_id)
            .maybeSingle();

          if (customerData) {
            setCancellationCount(customerData.cancellation_count || 0);
          }
        }

        // Fetch queue data by booking_id for accuracy
        const { data: queueData } = await supabase
          .from("queue_entries")
          .select("*")
          .eq("booking_id", booking.id)
          .eq("status", "waiting")
          .maybeSingle();

        setQueueEntry(queueData || null);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription for queue updates
    const channel = supabase
      .channel(`queue-updates-${booking?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
          filter: `booking_id=eq.${booking?.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking, isOpen]);

  const handleCall = () => {
    if (booking?.salons?.phone) {
      window.open(`tel:${booking.salons.phone}`, '_self');
    } else {
      toast.error("Phone number not available");
    }
  };

  const handleOpenCancelDialog = () => {
    setCancelDialogOpen(true);
  };

  const handleCancellationComplete = () => {
    setCancelDialogOpen(false);
    onClose();
    window.location.reload();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  if (!booking) return null;

  const salon = booking.salons;
  const isCancelled = booking.status === "cancelled";
  const isActive = ["pending", "confirmed", "in_progress"].includes(booking.status);
  
  // Calculate totals from booking services
  const totalPrice = bookingServices.reduce((sum, s) => sum + (s.unit_price * s.quantity), 0);
  const totalDuration = bookingServices.reduce((sum, s) => sum + (s.unit_duration * s.quantity), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Booking Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Salon Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-foreground">{salon.name}</h3>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{salon.address}</span>
            </div>
            {salon.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{salon.phone}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Services List */}
          <div className="space-y-3">
            <h4 className="font-medium">Services</h4>
            
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {bookingServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{service.service_name}</span>
                        {service.quantity > 1 && (
                          <Badge variant="secondary" className="text-xs">x{service.quantity}</Badge>
                        )}
                      </div>
                      <span className="font-medium">₹{service.unit_price * service.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold text-primary">₹{totalPrice || booking.total_price}</span>
                </div>
              </>
            )}

            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Date</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(booking.booking_date)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Time</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{booking.booking_time}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Duration</span>
              <span>{totalDuration || booking.duration} minutes</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Status</span>
              <Badge variant={
                booking.status === "confirmed" ? "default" : 
                booking.status === "cancelled" ? "destructive" : 
                booking.status === "completed" ? "secondary" : "secondary"
              }>
                {booking.status === "confirmed" ? "Confirmed" : 
                 booking.status === "cancelled" ? "Cancelled" :
                 booking.status === "completed" ? "Completed" : "Pending"}
              </Badge>
            </div>

            {/* Cancellation Reason for cancelled bookings */}
            {isCancelled && booking.cancellation_reason && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Cancellation Reason</p>
                    <p className="text-sm text-muted-foreground">{booking.cancellation_reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Queue Information */}
          {queueEntry && queueEntry.status === "waiting" && (
            <>
              <Separator />
              <QueueTimer 
                salonId={booking.salon_id} 
                customerId={booking.customer_id}
                className="bg-primary/10 border-primary/20"
              />
            </>
          )}

          <Separator />

          {/* Action Buttons - Only show for active bookings */}
          {isActive && (
            <div className="space-y-2">
              <Button onClick={handleCall} className="w-full gap-2" size="lg">
                <Phone className="h-4 w-4" />
                Call Salon
              </Button>
              
              <div className="flex gap-2">
                {queueEntry && (
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => {
                      onClose();
                      navigate("/queue-status");
                    }}
                  >
                    View Queue
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={handleOpenCancelDialog}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* For past bookings, just show close button */}
          {!isActive && (
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Cancellation Confirmation Dialog */}
      {booking.customer_id && (
        <CancellationDialog
          isOpen={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          bookingId={booking.id}
          customerId={booking.customer_id}
          cancellationCount={cancellationCount}
          onCancellationComplete={handleCancellationComplete}
        />
      )}
    </Dialog>
  );
};