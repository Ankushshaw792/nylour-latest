import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Phone, RefreshCw, CheckCircle2, MessageSquare, Calendar, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const QueueStatus = () => {
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const [queueEntry, setQueueEntry] = useState<any>(null);
  const [queueMembers, setQueueMembers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Fetch active queue data and setup real-time updates
  useEffect(() => {
    const fetchActiveQueue = async () => {
      if (!user) return;
      
      try {
        // Call the expire function first to clean up old entries
        await supabase.rpc('expire_old_queue_entries');

        // Find user's active queue entry (not expired)
        const { data: queueDataArray, error: queueError } = await supabase
          .from("queue_entries")
          .select("*")
          .eq("customer_id", user.id)
          .eq("status", "waiting")
          .gt("expires_at", new Date().toISOString())
          .order("joined_at", { ascending: false })
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
              phone
            )
          `)
          .eq("customer_id", user.id)
          .eq("salon_id", activeQueueData.salon_id)
          .order("created_at", { ascending: false })
          .limit(1);

        const bookingData = bookingDataArray && bookingDataArray.length > 0 ? bookingDataArray[0] : null;

        if (bookingError) {
          console.error("Error fetching booking:", bookingError);
          // Continue without booking data
        }
        
        console.log("Booking data:", bookingData);

        // Fetch the service name
        const { data: serviceData } = await supabase
          .from("services")
          .select("name")
          .eq("id", activeQueueData.service_id)
          .maybeSingle();

        // Combine the data with service name
        const combinedData = {
          ...activeQueueData,
          bookings: bookingData ? {
            ...bookingData,
            service_name: serviceData?.name || "Service"
          } : null
        };

        // Calculate actual queue position
        const { count: positionCount } = await supabase
          .from("queue_entries")
          .select("*", { count: "exact", head: true })
          .eq("salon_id", activeQueueData.salon_id)
          .eq("status", "waiting")
          .lt("position", activeQueueData.position);

        const actualPosition = (positionCount || 0) + 1;

        // Store actual position in combined data
        const dataWithPosition = {
          ...combinedData,
          actualPosition,
          dynamicWaitTime: activeQueueData.estimated_wait_time || actualPosition * 15
        };

        setQueueEntry(dataWithPosition);

        // Calculate time remaining until expiration
        const expiresAt = new Date(activeQueueData.expires_at).getTime();
        const now = Date.now();
        const remaining = Math.max(0, expiresAt - now);
        setTimeRemaining(remaining);

        // Fetch all queue members for this salon
        const { data: membersData, error: membersError } = await supabase
          .from("queue_entries")
          .select("*")
          .eq("salon_id", activeQueueData.salon_id)
          .eq("status", "waiting")
          .order("position");

        if (membersError) {
          console.error("Error fetching queue members:", membersError);
        } else {
          // Fetch customer names for queue members
          if (membersData && membersData.length > 0) {
            const customerIds = membersData.map(m => m.customer_id);
            const { data: customersData } = await supabase
              .from("customers")
              .select("user_id, first_name, last_name")
              .in("user_id", customerIds);

            // Fetch service names for queue members
            const serviceIds = membersData.map(m => m.service_id).filter(Boolean);
            const { data: servicesData } = await supabase
              .from("services")
              .select("id, name")
              .in("id", serviceIds);

            // Combine queue members with customer and service data
            const enrichedMembers = membersData.map(member => ({
              ...member,
              customer: customersData?.find(c => c.user_id === member.customer_id),
              service_name: servicesData?.find(s => s.id === member.service_id)?.name || "Service"
            }));

            setQueueMembers(enrichedMembers);
          } else {
            setQueueMembers([]);
          }
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

  // Countdown timer effect
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (!prev || prev <= 1000) {
          // Queue expired - refresh the page
          window.location.reload();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

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
                  <span className="text-sm">Receive SMS notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Queue expires after 1 hour</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  // Calculate progress based on actual position
  const totalQueueMembers = queueMembers.length;
  const currentPosition = queueEntry.actualPosition || 1;
  const progress = totalQueueMembers > 0 ? Math.max(0, ((totalQueueMembers - currentPosition) / totalQueueMembers) * 100) : 0;

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

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if queue is about to expire (less than 10 minutes)
  const isAboutToExpire = timeRemaining && timeRemaining < 10 * 60 * 1000;

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

            {/* Expiration Warning */}
            {timeRemaining && (
              <div className={`mb-4 p-3 rounded-lg border ${
                isAboutToExpire 
                  ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <div className="text-sm">
                    <span className="font-medium">Queue expires in: </span>
                    <span className="font-bold">{formatTimeRemaining(timeRemaining)}</span>
                  </div>
                </div>
                {isAboutToExpire && (
                  <p className="text-xs mt-1">Please head to the salon soon!</p>
                )}
              </div>
            )}

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
              <p className="text-3xl font-bold text-primary">{queueEntry.dynamicWaitTime || 0} min</p>
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
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">₹{booking.total_price}</span>
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
                const isCurrentUser = member.customer_id === user?.id;
                const isActive = member.queue_number === 1;
                const displayName = isCurrentUser 
                  ? "You" 
                  : `${member.customer?.first_name || "Customer"} ${member.customer?.last_name || ""}`.trim();
                
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
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isCurrentUser 
                            ? 'bg-primary text-primary-foreground' 
                            : isActive 
                              ? 'bg-amber-500 text-white' 
                              : 'bg-muted-foreground/20 text-foreground'
                        }`}
                      >
                        {member.queue_number}
                      </div>
                      <div>
                        <p className={`font-medium ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                          {displayName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.service_name}
                        </p>
                      </div>
                    </div>
                    <div 
                      className={`w-3 h-3 rounded-full ${
                        isActive 
                          ? 'bg-amber-500' 
                          : 'bg-muted-foreground/40'
                      }`}
                    />
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
              <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-success" />
              </div>
              <div>
                <h4 className="font-semibold text-success mb-1">SMS Alerts Active</h4>
                <p className="text-sm text-muted-foreground">
                  You'll get notified 15 minutes before your turn
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salon Contact */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Salon Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">{salon.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm">{salon.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="pb-6">
          <Button
            variant="mobile-outline"
            size="xl"
            className="w-full mb-3"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh Status
          </Button>

          {currentPosition === 1 && (
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="font-semibold text-primary">You're Next!</h4>
                    <p className="text-sm text-muted-foreground">
                      Please head to the salon now
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
           )}
        </div>
      </div>
      </CustomerLayout>
    );
  };

  export default QueueStatus;