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

        // Combine the data with service name and actual price
        const combinedData = {
          ...activeQueueData,
          bookings: bookingData ? {
            ...bookingData,
            service_name: serviceName,
            service_price: servicePrice,
            service_duration: serviceDuration
          } : null
        };

        setQueueEntry(combinedData);

        // Fetch all queue members for this salon (today only)
        const { data: membersData, error: membersError } = await supabase
          .from("queue_entries")
          .select("*")
          .eq("salon_id", activeQueueData.salon_id)
          .eq("status", "waiting")
          .gte("check_in_time", todayStart)
          .order("position");

        if (membersError) {
          console.error("Error fetching queue members:", membersError);
        } else {
          // Fetch customer names for queue members - use 'id' since customer_id references customers.id
          if (membersData && membersData.length > 0) {
            const customerIds = membersData.map(m => m.customer_id);
            const { data: customersData } = await supabase
              .from("customers")
              .select("id, first_name, last_name")
              .in("id", customerIds);

            // Fetch booking info for each queue member to get service names and durations
            const bookingIds = membersData.map(m => m.booking_id).filter(Boolean);
            let bookingsWithServices: any[] = [];
            if (bookingIds.length > 0) {
              const { data: bookingsData } = await supabase
                .from("bookings")
                .select("id, service_id")
                .in("id", bookingIds);
              
              if (bookingsData && bookingsData.length > 0) {
                const salonServiceIds = bookingsData.map(b => b.service_id).filter(Boolean);
                
                // Get salon_services with their service_id reference
                const { data: salonServicesData } = await supabase
                  .from("salon_services")
                  .select("id, service_id, duration")
                  .in("id", salonServiceIds);
                
                // Get actual service names
                const serviceIds = salonServicesData?.map(ss => ss.service_id).filter(Boolean) || [];
                let servicesData: any[] = [];
                if (serviceIds.length > 0) {
                  const { data: fetchedServices } = await supabase
                    .from("services")
                    .select("id, name")
                    .in("id", serviceIds);
                  servicesData = fetchedServices || [];
                }
                
                bookingsWithServices = bookingsData.map(b => {
                  const salonService = salonServicesData?.find(ss => ss.id === b.service_id);
                  const service = servicesData?.find(s => s.id === salonService?.service_id);
                  return {
                    ...b,
                    service_name: service?.name || "Service",
                    service_duration: salonService?.duration || 30
                  };
                });
              }
            }

            // Combine queue members with customer and service data
            const enrichedMembers = membersData.map(member => {
              const memberBooking = bookingsWithServices.find(b => b.id === member.booking_id);
              return {
                ...member,
                customer: customersData?.find(c => c.id === member.customer_id),
                service_name: memberBooking?.service_name || "Service",
                service_duration: memberBooking?.service_duration || 30
              };
            });

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

  // Calculate estimated wait time based on position and avg service time
  const avgServiceTime = queueEntry.bookings?.salons?.avg_service_time || 30;
  const estimatedWaitMinutes = Math.max(0, (currentPosition - 1) * avgServiceTime);

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
                const isCurrentUser = member.customer_id === currentCustomerId;
                const currentUserPosition = queueEntry.position;
                const isAhead = member.position < currentUserPosition;
                const isBehind = member.position > currentUserPosition;
                const isActive = member.position === 1;
                const displayName = isCurrentUser 
                  ? "You" 
                  : `${member.customer?.first_name || "Customer"} ${member.customer?.last_name || ""}`.trim();
                
                // Calculate estimated time for people ahead (cumulative time from position 1 to their position)
                const memberDuration = member.service_duration || avgServiceTime;
                
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
                        {member.position}
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
                    <div className="flex items-center gap-2">
                      {/* Show time only for people ahead (not for current user or people behind) */}
                      {isAhead && !isCurrentUser && (
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