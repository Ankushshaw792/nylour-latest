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

interface BookingSummaryDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingSummaryDialog = ({ booking, isOpen, onClose }: BookingSummaryDialogProps) => {
  const navigate = useNavigate();
  const [queueEntry, setQueueEntry] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [serviceName, setServiceName] = useState<string>("Service");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationCount, setCancellationCount] = useState(0);

  // Fetch service name and queue data
  useEffect(() => {
    const fetchData = async () => {
      if (!booking || !isOpen) return;

      try {
        // Fetch service name via salon_services
        if (booking.service_id) {
          const { data: salonServiceData } = await supabase
            .from("salon_services")
            .select("id, services(name)")
            .eq("id", booking.service_id)
            .maybeSingle();

          if (salonServiceData?.services) {
            setServiceName((salonServiceData.services as any)?.name || "Service");
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

        // Fetch queue data
        const { data: queueData } = await supabase
          .from("queue_entries")
          .select("*")
          .eq("customer_id", booking.customer_id)
          .eq("salon_id", booking.salon_id)
          .eq("status", "waiting")
          .order("created_at", { ascending: false })
          .limit(1);

        if (queueData && queueData.length > 0) {
          setQueueEntry(queueData[0]);
        } else {
          setQueueEntry(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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
          filter: `salon_id=eq.${booking?.salon_id}`
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
  const displayServiceName = booking.service_name || serviceName;
  const isCancelled = booking.status === "cancelled";
  const isActive = ["pending", "confirmed", "in_progress"].includes(booking.status);
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

          {/* Service & Booking Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Service</span>
              <span className="text-foreground">{displayServiceName}</span>
            </div>
            
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
              <span>{booking.duration} minutes</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Price</span>
              <span className="font-semibold text-primary">₹{booking.total_price}</span>
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