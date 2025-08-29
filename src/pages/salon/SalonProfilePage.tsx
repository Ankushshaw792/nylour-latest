import { useState, useEffect } from "react";
import { LogOut, Pause, Clock, Users, TrendingUp, Settings, MessageSquare, BarChart3, Eye, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";

interface QueueStats {
  currentWaitTime: number;
  queueLength: number;
  avgServiceTime: number;
  capacity: number;
}

interface CustomerCheckIn {
  id: string;
  name: string;
  service: string;
  time: string;
  status: 'waiting' | 'ready';
}

const SalonProfilePage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState(true);
  const [waitTime, setWaitTime] = useState(30);
  const [stats, setStats] = useState<QueueStats>({
    currentWaitTime: 25,
    queueLength: 8,
    avgServiceTime: 45,
    capacity: 12
  });
  const [customers, setCustomers] = useState<CustomerCheckIn[]>([]);

  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user?.id) return;

      try {
        // Get salon ID
        const { data: salon } = await supabase
          .from('salons')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (!salon) return;

        // Fetch queue entries for check-in list
        const { data: queueData } = await supabase
          .from('queue_entries')
          .select(`
            *,
            profiles!queue_entries_customer_id_fkey (
              first_name,
              last_name
            ),
            services (
              name
            )
          `)
          .eq('salon_id', salon.id)
          .in('status', ['waiting', 'in_progress'])
          .order('joined_at')
          .limit(5);

        if (queueData) {
          const formattedCustomers = queueData.map((entry: any) => ({
            id: entry.id,
            name: `${entry.profiles?.first_name || 'Unknown'} ${entry.profiles?.last_name || 'Customer'}`,
            service: entry.services?.name || 'Service',
            time: new Date(entry.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: entry.status === 'in_progress' ? 'ready' as const : 'waiting' as const
          }));
          setCustomers(formattedCustomers);
          
          // Update stats
          setStats(prev => ({
            ...prev,
            queueLength: queueData.length,
            currentWaitTime: queueData.length > 0 ? queueData.length * 15 : 0
          }));
        }
      } catch (error) {
        console.error('Error fetching salon data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonData();

    // Set up real-time subscription
    const channel = supabase
      .channel('profile-queue-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => fetchSalonData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleUpdateWaitTime = () => {
    toast({
      title: "Wait time updated",
      description: `Current wait time set to ${waitTime} minutes`,
    });
  };

  const handleQuickTimeUpdate = (minutes: number) => {
    setWaitTime(minutes);
    handleUpdateWaitTime();
  };

  const handleCheckIn = (customerId: string) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { ...customer, status: customer.status === 'waiting' ? 'ready' as const : 'waiting' as const }
        : customer
    ));
    toast({
      title: "Customer status updated",
      description: "Customer check-in status has been updated",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading salon dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SalonDashboardLayout
      title="Salon Management"
      description="Manage your queue, bookings and customer check-ins"
    >
      <div className="p-4 space-y-6">
        {/* Stop Bookings Button */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Booking Control</h3>
                <p className="text-sm text-muted-foreground">
                  {bookingStatus ? "Currently accepting new bookings" : "Bookings are paused"}
                </p>
              </div>
              <Button 
                variant={bookingStatus ? "destructive" : "default"}
                onClick={() => setBookingStatus(!bookingStatus)}
                className="gap-2"
              >
                <Pause className="h-4 w-4" />
                {bookingStatus ? "Stop Bookings" : "Resume Bookings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{stats.currentWaitTime}m</p>
              <p className="text-xs text-muted-foreground">Current Wait Time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{stats.queueLength}</p>
              <p className="text-xs text-muted-foreground">Queue Length</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{stats.avgServiceTime}m</p>
              <p className="text-xs text-muted-foreground">Avg Service Time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Wifi className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{stats.capacity}</p>
              <p className="text-xs text-muted-foreground">Capacity</p>
            </CardContent>
          </Card>
        </div>

        {/* Update Wait Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Update Wait Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="waitTime">Current Wait Time (minutes)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="waitTime"
                  type="number"
                  value={waitTime}
                  onChange={(e) => setWaitTime(Number(e.target.value))}
                  className="flex-1"
                />
                <Button onClick={handleUpdateWaitTime}>Update</Button>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleQuickTimeUpdate(15)}>
                15 min
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickTimeUpdate(30)}>
                30 min
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickTimeUpdate(45)}>
                45 min
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickTimeUpdate(60)}>
                1 hour
              </Button>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Wait Time Guidelines</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Update regularly based on current queue</li>
                <li>• Consider service complexity and staff availability</li>
                <li>• Communicate changes to waiting customers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Booking Status</p>
                <p className="text-sm text-muted-foreground">
                  Allow new customers to book appointments
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={bookingStatus ? "default" : "secondary"}>
                  {bookingStatus ? "Open" : "Closed"}
                </Badge>
                <Switch
                  checked={bookingStatus}
                  onCheckedChange={setBookingStatus}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Check-in */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Check-in</CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length > 0 ? (
              <div className="space-y-3">
                {customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{customer.name}</p>
                        <Badge variant={customer.status === 'ready' ? 'default' : 'secondary'}>
                          {customer.status === 'ready' ? 'Ready' : 'Waiting'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {customer.service} • Arrived at {customer.time}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant={customer.status === 'ready' ? 'outline' : 'default'}
                      onClick={() => handleCheckIn(customer.id)}
                    >
                      {customer.status === 'ready' ? 'Mark Waiting' : 'Check In'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No customers in queue</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex-col gap-2">
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm">Send SMS Updates</span>
              </Button>
              
              <Button variant="outline" className="h-16 flex-col gap-2" onClick={() => navigate('/salon-dashboard')}>
                <Eye className="h-5 w-5" />
                <span className="text-sm">View Queue</span>
              </Button>
              
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Settings className="h-5 w-5" />
                <span className="text-sm">Salon Settings</span>
              </Button>
              
              <Button variant="outline" className="h-16 flex-col gap-2">
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm">Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="lg"
          className="w-full gap-2"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </SalonDashboardLayout>
  );
};

export default SalonProfilePage;