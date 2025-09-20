import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Star, Phone, X, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BookingsPage = () => {
  const { user, loading } = useRequireAuth();
  const navigate = useNavigate();
  const [currentBookings, setCurrentBookings] = useState<any[]>([]);
  const [pastBookings, setPastBookings] = useState<any[]>([]);
  const [activeRating, setActiveRating] = useState<{[key: string]: number}>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<{[key: string]: number}>({});

  // Fetch user's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        // Fetch current bookings with basic data (within 1 hour)
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        
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
          .in("status", ["pending", "confirmed"])
          .gte("created_at", oneHourAgo.toISOString())
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

          // Calculate time remaining for each booking
          const timeRemainingMap: {[key: string]: number} = {};
          enrichedCurrent.forEach(booking => {
            const createdAt = new Date(booking.created_at);
            const expiryTime = new Date(createdAt.getTime() + 60 * 60 * 1000); // 1 hour from creation
            const now = new Date();
            const remaining = Math.max(0, Math.floor((expiryTime.getTime() - now.getTime()) / 1000));
            timeRemainingMap[booking.id] = remaining;
          });
          
          setCurrentBookings(enrichedCurrent);
          setTimeRemaining(timeRemainingMap);
        } else {
          setCurrentBookings([]);
        }

        // Fetch past bookings with basic data (including expired ones)
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
          .in("status", ["completed", "cancelled"])
          .order("booking_date", { ascending: false });

        // Also fetch expired bookings (older than 1 hour)
        const { data: expiredData } = await supabase
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
          .in("status", ["pending", "confirmed"])
          .lt("created_at", oneHourAgo.toISOString())
          .order("booking_date", { ascending: false });

        const allPastData = [...(pastData || []), ...(expiredData || [])];

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

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const updated = { ...prev };
        let hasExpired = false;
        
        Object.keys(updated).forEach(bookingId => {
          if (updated[bookingId] > 0) {
            updated[bookingId] -= 1;
          } else if (updated[bookingId] === 0) {
            hasExpired = true;
          }
        });
        
        // Refresh bookings if any expired
        if (hasExpired && user) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
        
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

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
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <Calendar className="h-4 w-4 mr-2" />
            Book Now
          </Button>
        </div>

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
                <Card key={booking.id} className="border border-border bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{salon.name}</h3>
                        <p className="text-sm text-muted-foreground">{service}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                          {booking.status === "confirmed" ? "Confirmed" : "Pending"}
                        </Badge>
                        {timeRemaining[booking.id] > 0 && (
                          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            timeRemaining[booking.id] < 600 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            <Timer className="h-3 w-3" />
                            <span>{formatTimeRemaining(timeRemaining[booking.id])}</span>
                          </div>
                        )}
                      </div>
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

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
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
                <Card key={booking.id} className="border border-border bg-white">
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
    </div>
  );
};

export default BookingsPage;