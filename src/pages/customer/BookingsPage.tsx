import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Star, Phone, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookingSummaryDialog } from "@/components/bookings/BookingSummaryDialog";

const BookingsPage = () => {
  const { user, loading } = useRequireAuth();
  const navigate = useNavigate();
  const [currentBookings, setCurrentBookings] = useState<any[]>([]);
  const [pastBookings, setPastBookings] = useState<any[]>([]);
  const [activeRating, setActiveRating] = useState<{[key: string]: number}>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);

  // Fetch user's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch CURRENT bookings - based on status and booking_date
        const { data: currentData, error: currentError } = await supabase
          .from("bookings")
          .select(`
            *,
            salons!inner (
              name,
              address,
              phone
            )
          `)
          .eq("customer_id", user.id)
          .in("status", ["pending", "confirmed", "in_progress"])
          .gte("booking_date", today)
          .order("booking_date", { ascending: true });

        if (currentError) {
          console.error("Error fetching current bookings:", currentError);
          toast.error("Failed to load current bookings");
        }

        // Fetch services for current bookings
        if (currentData && currentData.length > 0) {
          const serviceIds = currentData.map(b => b.service_id).filter(Boolean);
          const { data: servicesData } = await supabase
            .from("services")
            .select("id, name")
            .in("id", serviceIds);

          // Fetch queue entries for current bookings
          const { data: queueData } = await supabase
            .from("queue_entries")
            .select("*")
            .in("customer_id", [user.id])
            .eq("status", "waiting");

          // Merge service and queue data
          const enrichedCurrent = currentData.map(booking => ({
            ...booking,
            service_name: servicesData?.find(s => s.id === booking.service_id)?.name || "Service",
            queue_entry: queueData?.find(q => q.salon_id === booking.salon_id)
          }));
          
          setCurrentBookings(enrichedCurrent);
        } else {
          setCurrentBookings([]);
        }

        // Fetch PAST bookings - completed/cancelled OR old dates
        const { data: pastData, error: pastError } = await supabase
          .from("bookings")
          .select(`
            *,
            salons!inner (
              name,
              address,
              phone
            )
          `)
          .eq("customer_id", user.id)
          .or(`status.in.(completed,cancelled),booking_date.lt.${today}`)
          .order("booking_date", { ascending: false });

        const allPastData = pastData || [];

        if (pastError) {
          console.error("Error fetching past bookings:", pastError);
          toast.error("Failed to load past bookings");
        }

        // Fetch services for past bookings (including expired)
        if (allPastData && allPastData.length > 0) {
          const serviceIds = allPastData.map(b => b.service_id).filter(Boolean);
          const { data: servicesData } = await supabase
            .from("services")
            .select("id, name")
            .in("id", serviceIds);

          // Merge service data
          const enrichedPast = allPastData.map(booking => ({
            ...booking,
            service_name: servicesData?.find(s => s.id === booking.service_id)?.name || "Service"
          }));

          setPastBookings(enrichedPast);
        } else {
          setPastBookings([]);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load bookings");
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }

    // Setup real-time subscription for booking updates
    const subscription = supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Booking update received:', payload);
          fetchBookings(); // Refetch bookings on any change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries'
        },
        (payload) => {
          console.log('Queue update received:', payload);
          fetchBookings(); // Refetch bookings when queue changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleRating = (bookingId: string, rating: number) => {
    setActiveRating(prev => ({ ...prev, [bookingId]: rating }));
  };

  const handleCall = (salonPhone: string) => {
    if (salonPhone) {
      window.open(`tel:${salonPhone}`, '_self');
    } else {
      toast.error("Phone number not available");
    }
  };

  const handleCardClick = (booking: any) => {
    setSelectedBooking(booking);
    setSummaryDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSummaryDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) {
        console.error("Error cancelling booking:", error);
        toast.error("Failed to cancel booking");
      } else {
        toast.success("Booking cancelled successfully");
        // Refresh bookings
        window.location.reload();
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
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

  return (
    <CustomerLayout
      headerProps={{
        title: "My Bookings",
        showBackButton: false,
        showProfile: true,
        showNotifications: true,
        rightContent: (
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <Calendar className="h-4 w-4 mr-2" />
            Book Now
          </Button>
        )
      }}
    >
      <div className="p-4">

        {/* Tabs */}
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          {/* Current Bookings */}
          <TabsContent value="current" className="space-y-4">
            {currentBookings.map((booking) => {
              const salon = booking.salons;
              const service = booking.service_name;
              const queueEntry = booking.queue_entry;
              
              return (
                <Card 
                  key={booking.id} 
                  className="border border-border bg-white cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCardClick(booking)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{salon.name}</h3>
                        <p className="text-sm text-muted-foreground">{service}</p>
                      </div>
                      <Badge variant={booking.status === "confirmed" ? "default" : booking.status === "in_progress" ? "default" : "secondary"}>
                        {booking.status === "confirmed" ? "Confirmed" : booking.status === "in_progress" ? "In Progress" : "Pending"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.booking_time}</span>
                      </div>
                    </div>

                    {queueEntry && queueEntry.status === "waiting" && (
                      <div className="bg-primary/10 p-3 rounded-lg mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Queue Position</p>
                            <p className="text-xs text-muted-foreground">Estimated wait time</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">#{queueEntry.queue_number}</p>
                            <p className="text-sm text-primary">{queueEntry.estimated_wait_time || 0} min</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{salon.address}</span>
                      </div>
                      <span className="font-semibold text-primary">₹{booking.total_price}</span>
                    </div>

                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => handleCall(salon.phone)}
                      >
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                      {queueEntry && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 gap-2"
                          onClick={() => navigate("/queue-status")}
                        >
                          View Queue
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {currentBookings.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-primary/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No active bookings</h3>
                <p className="text-muted-foreground mb-6">You don't have any active bookings right now.<br />Ready to book your next salon visit?</p>
                <Button size="lg" onClick={() => navigate("/")}>
                  Book Now
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Past Bookings */}
          <TabsContent value="past" className="space-y-4">
            {pastBookings.map((booking) => {
              const salon = booking.salons;
              const service = booking.service_name;
              
              return (
                <Card 
                  key={booking.id} 
                  className="border border-border bg-white cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCardClick(booking)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{salon.name}</h3>
                        <p className="text-sm text-muted-foreground">{service}</p>
                      </div>
                      <Badge variant={booking.status === "completed" ? "secondary" : "destructive"}>
                        {booking.status === "completed" ? "Completed" : "Cancelled"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.booking_time}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{salon.address}</span>
                      </div>
                      <span className="font-semibold text-foreground">₹{booking.total_price}</span>
                    </div>

                    {booking.status === "completed" && (
                      <div className="bg-muted/30 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium text-foreground mb-2">Rate your experience</p>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 cursor-pointer transition-colors ${
                                star <= (activeRating[booking.id] || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                              onClick={() => handleRating(booking.id, star)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate("/")}
                    >
                      {booking.status === "completed" ? "Book Again" : "Rebook"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            
            {pastBookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No past bookings</h3>
                <p className="text-muted-foreground">Your booking history will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BookingSummaryDialog
        booking={selectedBooking}
        isOpen={summaryDialogOpen}
        onClose={handleCloseDialog}
      />
    </CustomerLayout>
  );
};

export default BookingsPage;