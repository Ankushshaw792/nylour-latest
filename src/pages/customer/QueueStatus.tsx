import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, MapPin, Phone, RefreshCw, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const QueueStatus = () => {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const { user, loading } = useRequireAuth();
  const [queueEntry, setQueueEntry] = useState<any>(null);
  const [queueMembers, setQueueMembers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch queue data and setup real-time updates
  useEffect(() => {
    const fetchQueueData = async () => {
      if (!user || !bookingId) return;
      
      try {
        // Fetch user's queue entry with booking details
        const { data: queueData, error: queueError } = await supabase
          .from("queue_entries")
          .select(`
            *,
            bookings!inner (
              id,
              total_price,
              salons!inner (
                id,
                name,
                address,
                phone
              ),
              salon_services!inner (
                services!inner (
                  name
                )
              )
            )
          `)
          .eq("customer_id", user.id)
          .eq("bookings.id", bookingId)
          .eq("status", "waiting")
          .single();

        if (queueError) {
          console.error("Error fetching queue data:", queueError);
          toast.error("Failed to load queue status");
          return;
        }

        setQueueEntry(queueData);

        // Fetch all queue members for this salon
        const { data: membersData, error: membersError } = await supabase
          .from("queue_entries")
          .select(`
            *,
            profiles!inner (
              first_name,
              last_name
            ),
            salon_services!inner (
              services!inner (
                name
              )
            )
          `)
          .eq("salon_id", queueData.salon_id)
          .eq("status", "waiting")
          .order("queue_number");

        if (membersError) {
          console.error("Error fetching queue members:", membersError);
        } else {
          setQueueMembers(membersData || []);
        }
      } catch (error) {
        console.error("Error fetching queue data:", error);
        toast.error("Failed to load queue status");
      } finally {
        setDataLoading(false);
      }
    };

    fetchQueueData();

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
          fetchQueueData();
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
          fetchQueueData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, bookingId]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!queueEntry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Queue Entry Not Found</h2>
          <p className="text-muted-foreground mb-4">Unable to find your queue status.</p>
          <Button onClick={() => navigate("/bookings")}>View Bookings</Button>
        </div>
      </div>
    );
  }

  // Calculate progress based on current position
  const totalQueueMembers = queueMembers.length;
  const currentPosition = queueEntry.queue_number;
  const progress = totalQueueMembers > 0 ? Math.max(0, ((totalQueueMembers - currentPosition) / totalQueueMembers) * 100) : 0;

  // Extract booking and salon data
  const booking = queueEntry.bookings;
  const salon = booking.salons;
  const service = booking.salon_services?.services?.name || "Service";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Queue Status</h1>
          <p className="text-white/90">Live updates for your booking</p>
        </div>
      </div>

      <div className="p-4 space-y-6 -mt-2">
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
              <p className="text-3xl font-bold text-primary">{queueEntry.estimated_wait_time || 0} min</p>
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
                  : `${member.profiles?.first_name || "Customer"} ${member.profiles?.last_name || ""}`.trim();
                
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
                          {member.salon_services?.services?.name || "Service"}
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
    </div>
  );
};

export default QueueStatus;