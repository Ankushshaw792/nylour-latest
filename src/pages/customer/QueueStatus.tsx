import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Phone, RefreshCw, CheckCircle2, MessageSquare, Calendar, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCustomer } from "@/contexts/CustomerContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ArrivalCountdownTimer from "@/components/queue/ArrivalCountdownTimer";

const QueueStatus = () => {
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const { avatarUrl } = useCustomer();
  const [queueEntry, setQueueEntry] = useState<any>(null);
  const [queueMembers, setQueueMembers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);

  // Fetch active queue data and setup real-time updates
  useEffect(() => {
    const fetchActiveQueue = async () => {
      if (!user) return;
      
      try {
        // First, get the customer record using user_id
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (customerError || !customer) {
          console.error("Error fetching customer:", customerError);
          setQueueEntry(null);
          setDataLoading(false);
          return;
        }
        
        // Store customer ID for use in UI
        setCurrentCustomerId(customer.id);

        // Get today's date for filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();

        // Find user's active queue entry (today only)
        const { data: queueDataArray, error: queueError } = await supabase
          .from("queue_entries")
          .select("*")
          .eq("customer_id", customer.id)
          .eq("status", "waiting")
          .gte("check_in_time", todayStart)
          .order("check_in_time", { ascending: false })
          .limit(1);

        const activeQueueData = queueDataArray && queueDataArray.length > 0 ? queueDataArray[0] : null;

        if (queueError) {
          console.error("Error fetching active queue:", queueError);
          toast.error("Failed to load queue status");
          return;
        }

        if (!activeQueueData) {
          console.log("No active queue entry found");
          setQueueEntry(null);
          setDataLoading(false);
          return;
        }

        // Fetch the booking details separately
        const { data: bookingDataArray, error: bookingError } = await supabase
          .from("bookings")
          .select(`
            *,
            salons!inner (
              id,
              name,
              address,
              phone,
              avg_service_time
            )
          `)
          .eq("customer_id", customer.id)
          .eq("salon_id", activeQueueData.salon_id)
          .in("status", ["pending", "confirmed", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(1);
        
        // Store customer.id for later use in isCurrentUser check
        const customerId = customer.id;

        const bookingData = bookingDataArray && bookingDataArray.length > 0 ? bookingDataArray[0] : null;

        if (bookingError) {
          console.error("Error fetching booking:", bookingError);
        }

        // Fetch service details from salon_services (actual price) and services (name)
        let serviceName = "Service";
        let servicePrice = bookingData?.total_price || 0;
        let serviceDuration = 30;
        
        if (bookingData?.service_id) {
          // First get the salon_service to get actual price and duration
          const { data: salonServiceData } = await supabase
            .from("salon_services")
            .select("price, duration, service_id")
            .eq("id", bookingData.service_id)
            .maybeSingle();
          
          if (salonServiceData) {
            servicePrice = salonServiceData.price;
            serviceDuration = salonServiceData.duration || 30;
            
            // Get service name from services table
            if (salonServiceData.service_id) {
              const { data: serviceData } = await supabase
                .from("services")
                .select("name")
                .eq("id", salonServiceData.service_id)
                .maybeSingle();
              serviceName = serviceData?.name || "Service";
            }
          }
        }

        // Combine the data with service name, actual price, and arrival_deadline
        const combinedData = {
          ...activeQueueData,
          bookings: bookingData ? {
            ...bookingData,
            service_name: serviceName,
            service_price: servicePrice,
            service_duration: serviceDuration,
            arrival_deadline: bookingData.arrival_deadline
          } : null
        };

        setQueueEntry(combinedData);

        // Fetch all queue members using the RPC function (bypasses customers RLS)
        const todayDate = new Date().toISOString().split('T')[0];
        const { data: queueDisplayData, error: queueDisplayError } = await supabase.rpc('get_queue_display', {
          p_salon_id: activeQueueData.salon_id,
          p_date: todayDate
        });

        if (queueDisplayError) {
          console.error("Error fetching queue display:", queueDisplayError);
          setQueueMembers([]);
        } else {
          // Map RPC results to queue member format and sort by position
          const enrichedMembers = (queueDisplayData || [])
            .sort((a: any, b: any) => a.queue_position - b.queue_position)
            .map((entry: any) => ({
              id: entry.queue_entry_id,
              booking_id: entry.booking_id,
              customer_id: entry.is_walk_in ? null : entry.queue_entry_id,
              position: entry.queue_position,
              display_name: entry.display_name,
              avatar_url: entry.avatar_url,
              service_name: entry.service_summary || "Service",
              // Service duration will be computed later using salon's avg_service_time
              service_duration: null,
              isWalkIn: entry.is_walk_in,
              party_size: entry.party_size || 1,
              // Track if this is the current user by matching booking_id or avatar presence
              isCurrentUser: entry.booking_id === activeQueueData.booking_id
            }));
          setQueueMembers(enrichedMembers);
        }
      } catch (error) {
        console.error("Error fetching queue data:", error);
        toast.error("Failed to load queue status");
      } finally {
        setDataLoading(false);
      }
    };

    fetchActiveQueue();

    // Setup real-time subscription for queue updates
    const subscription = supabase
      .channel('queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries'
        },
        (payload) => {
          console.log('Queue update received:', payload);
          fetchActiveQueue();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Booking update received:', payload);
          fetchActiveQueue();
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

  // No Active Queue State
  if (!queueEntry) {
    return (
      <CustomerLayout
        headerProps={{
          title: "Queue Status",
          showBackButton: false,
          showProfile: true,
          showNotifications: true
        }}
      >
        <div className="p-4 space-y-6">
          {/* No Queue Status */}
          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-muted-foreground">No queue at this time</h2>
                <p className="text-muted-foreground">You don't have any active bookings in queue</p>
              </div>

              {/* Book Now Action */}
              <div className="space-y-4">
                <Button
                  size="xl"
                  className="w-full"
                  onClick={() => navigate("/customer")}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Now
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Find nearby salons and book your appointment
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">How Queue Works</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm">See your live position in queue</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm">Get estimated wait time</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm">Receive notifications</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  // Calculate progress based on current position
  const totalQueueMembers = queueMembers.length;
  const currentPosition = queueEntry.position;
  const progress = totalQueueMembers > 0 ? Math.max(0, ((totalQueueMembers - currentPosition) / totalQueueMembers) * 100) : 0;

  // Calculate estimated wait time based on actual people ahead in queue
  const avgServiceTime = queueEntry.bookings?.salons?.avg_service_time || 30;
  const peopleAhead = queueMembers.filter(m => m.position < currentPosition).length;
  const estimatedWaitMinutes = peopleAhead * avgServiceTime;

  // Extract booking and salon data with null checks
  const booking = queueEntry.bookings;
  if (!booking || !booking.salons) {
    // If booking or salon data is missing, show error state
    return (
      <CustomerLayout
        headerProps={{
          title: "Queue Status",
          showBackButton: false,
          showProfile: true,
          showNotifications: true
        }}
      >
        <div className="p-4 space-y-6">
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-bold text-destructive mb-2">Booking Data Error</h2>
                <p className="text-muted-foreground mb-4">Unable to load booking information</p>
                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }
  
  const salon = booking.salons;
  const service = booking.service_name;

  return (
    <CustomerLayout
      headerProps={{
        title: "Queue Status",
        showBackButton: false,
        showProfile: true,
        showNotifications: true
      }}
    >
      <div className="p-4 space-y-6">
        {/* Arrival Countdown Timer - ONLY show when at position 1 */}
        {booking.arrival_deadline && 
         booking.status === 'confirmed' && 
         currentPosition === 1 && (
          <ArrivalCountdownTimer 
            arrivalDeadline={booking.arrival_deadline}
            onExpired={() => {
              toast.warning("Time's up! Please reach the salon immediately.");
            }}
          />
        )}

        {/* Live Queue Status */}
        <Card className="bg-gradient-card">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Position #{currentPosition}</h2>
              <p className="text-muted-foreground">in the queue</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Queue Progress</span>
                <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Estimated Time */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Estimated wait time</p>
              <p className="text-3xl font-bold text-primary">{estimatedWaitMinutes} min</p>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Your Booking</h3>
              <Badge variant="secondary">ID: {booking.id.substring(0, 8)}</Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salon</span>
                <span className="font-medium">{salon.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Price</span>
                <span className="font-medium">₹{booking.service_price}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Queue Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Live Queue</h3>
            <div className="space-y-3">
              {queueMembers.map((member) => {
                // Use the pre-computed isCurrentUser flag from RPC mapping
                const isCurrentUser = member.isCurrentUser === true;
                const isActive = member.position === 1;
                
                // Use display_name from RPC, override with "You" for current user
                const displayName = isCurrentUser ? "You" : (member.display_name || "Customer");
                
                // For walk-ins, don't show avatar; for current user show their avatar
                const showAvatar = !member.isWalkIn && (isCurrentUser || member.avatar_url);
                
                // Calculate estimated time using salon's avg service time
                const memberDuration = avgServiceTime;
                
                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isCurrentUser 
                        ? 'bg-primary/10 border border-primary/20' 
                        : isActive 
                          ? 'bg-amber-50 border border-amber-200' 
                          : 'bg-muted/30 border border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className={`w-8 h-8 ${
                        isCurrentUser 
                          ? 'ring-2 ring-primary' 
                          : isActive 
                            ? 'ring-2 ring-amber-500' 
                            : ''
                      }`}>
                        {showAvatar && (
                          <AvatarImage src={isCurrentUser ? (avatarUrl ?? undefined) : (member.avatar_url ?? undefined)} />
                        )}
                        <AvatarFallback className={`text-sm font-bold ${
                          isCurrentUser 
                            ? 'bg-primary text-primary-foreground' 
                            : isActive 
                              ? 'bg-amber-500 text-white' 
                              : 'bg-muted-foreground/20 text-foreground'
                        }`}>
                          {member.position}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                            {displayName}
                          </p>
                          {member.party_size > 1 && (
                            <Badge variant="outline" className="text-xs">
                              +{member.party_size - 1} {member.party_size === 2 ? 'other' : 'others'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.service_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Show time only for people ahead (not for current user or people behind) */}
                      {member.position < currentPosition && !isCurrentUser && (
                        <span className="text-xs text-muted-foreground">
                          ~{memberDuration} min
                        </span>
                      )}
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          isActive 
                            ? 'bg-amber-500' 
                            : isCurrentUser
                              ? 'bg-primary'
                              : 'bg-muted-foreground/40'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* SMS Alert Status */}
        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-700">Notifications Enabled</p>
                <p className="text-sm text-green-600">You'll be notified when your turn is near</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salon Contact */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Need Help?</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{salon.address}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{salon.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
};

export default QueueStatus;