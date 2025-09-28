import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Phone, MapPin, Clock, Calendar, DollarSign, Users, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import QueueTimer from '@/components/queue/QueueTimer';

interface BookingSummaryDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingSummaryDialog = ({ booking, isOpen, onClose }: BookingSummaryDialogProps) => {
  const navigate = useNavigate();
  const [queueEntry, setQueueEntry] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch real-time queue data
  useEffect(() => {
    const fetchQueueData = async () => {
      if (!booking || !isOpen) return;

      try {
        const { data: queueData } = await supabase
          .from("queue_entries")
          .select("*")
          .eq("customer_id", booking.customer_id)
          .eq("salon_id", booking.salon_id)
          .eq("status", "waiting")
          .order("joined_at", { ascending: false })
          .limit(1);

        if (queueData && queueData.length > 0) {
          setQueueEntry(queueData[0]);
        } else {
          setQueueEntry(null);
        }
      } catch (error) {
        console.error("Error fetching queue data:", error);
      }
    };

    fetchQueueData();

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
          fetchQueueData();
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

  const handleCancelBooking = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id);

      if (error) {
        console.error("Error cancelling booking:", error);
        toast.error("Failed to cancel booking");
      } else {
        toast.success("Booking cancelled successfully");
        onClose();
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setLoading(false);
    }
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
  const service = booking.service_name;

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
              <span className="text-foreground">{service}</span>
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
              <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                {booking.status === "confirmed" ? "Confirmed" : "Pending"}
              </Badge>
            </div>
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

          {/* Action Buttons */}
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
                onClick={handleCancelBooking}
                disabled={loading}
              >
                <X className="h-4 w-4" />
                {loading ? "Cancelling..." : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};