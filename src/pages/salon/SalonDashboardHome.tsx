import { useEffect, useState } from "react";
import { MapPin, Clock, TrendingUp, Users, Calendar, DollarSign, Star, Settings, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SalonData {
  name: string;
  address: string;
  status: string;
}

interface Analytics {
  todayRevenue: number;
  todayAppointments: number;
  queueCount: number;
  avgWaitTime: number;
  totalCustomers: number;
  monthlyGrowth: number;
}

const SalonDashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics>({
    todayRevenue: 0,
    todayAppointments: 0,
    queueCount: 0,
    avgWaitTime: 0,
    totalCustomers: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user?.id) return;

      try {
        // Fetch salon info
        const { data: salonData } = await supabase
          .from('salons')
          .select('name, address, status')
          .eq('owner_id', user.id)
          .single();

        if (salonData) {
          setSalon(salonData);
        }

        // Fetch analytics data
        const today = new Date().toISOString().split('T')[0];

        // Today's bookings and revenue
        const { data: todayBookings } = await supabase
          .from('bookings')
          .select('total_price, status')
          .gte('booking_date', today)
          .lt('booking_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        // Current queue count
        const { data: queueData } = await supabase
          .from('queue_entries')
          .select('estimated_wait_time')
          .eq('status', 'waiting');

        // Total customers (completed bookings)
        const { data: totalCustomersData } = await supabase
          .from('bookings')
          .select('customer_id')
          .eq('status', 'completed');

        const todayRevenue = todayBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
        const todayAppointments = todayBookings?.length || 0;
        const queueCount = queueData?.length || 0;
        const avgWaitTime = queueData?.length ? queueData.reduce((sum, entry) => sum + (entry.estimated_wait_time || 0), 0) / queueData.length : 0;
        const uniqueCustomers = new Set(totalCustomersData?.map(b => b.customer_id)).size;

        setAnalytics({
          todayRevenue,
          todayAppointments,
          queueCount,
          avgWaitTime: Math.round(avgWaitTime),
          totalCustomers: uniqueCustomers,
          monthlyGrowth: 12.5, // Mock data - would calculate from historical data
        });
      } catch (error) {
        console.error('Error fetching salon data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusColor = salon?.status === 'approved' ? 'success' : salon?.status === 'pending' ? 'warning' : 'destructive';

  return (
    <div className="min-h-screen bg-background">
      {/* Header with salon info */}
      <div className="bg-gradient-hero text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{salon?.name || 'My Salon'}</h1>
            <div className="flex items-center text-white/90 mb-2">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">{salon?.address || 'No address set'}</span>
            </div>
            <Badge variant="secondary" className={`bg-${statusColor} text-${statusColor}-foreground`}>
              {salon?.status === 'approved' ? 'Active' : salon?.status === 'pending' ? 'Pending Approval' : 'Inactive'}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/salon-dashboard/profile')}
            className="text-white hover:bg-white/20"
          >
            <User className="h-6 w-6" />
          </Button>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-white" />
              <p className="text-2xl font-bold text-white">₹{analytics.todayRevenue}</p>
              <p className="text-xs text-white/80">Today's Revenue</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-white" />
              <p className="text-2xl font-bold text-white">{analytics.queueCount}</p>
              <p className="text-xs text-white/80">In Queue</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Today's Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Today's Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{analytics.todayAppointments}</p>
                <p className="text-sm text-muted-foreground">Appointments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold text-secondary">{analytics.avgWaitTime}m</p>
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Monthly Growth</p>
                    <p className="text-sm text-muted-foreground">Customer increase</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success">+{analytics.monthlyGrowth}%</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Total Customers</p>
                    <p className="text-sm text-muted-foreground">All time served</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{analytics.totalCustomers}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => navigate('/salon-dashboard/queue')}
              >
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs">Manage Queue</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => navigate('/salon-dashboard/checkin')}
              >
                <Clock className="h-5 w-5 mb-1" />
                <span className="text-xs">Check-in</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => navigate('/salon-dashboard/bookings')}
              >
                <Calendar className="h-5 w-5 mb-1" />
                <span className="text-xs">Bookings</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => navigate('/salon-dashboard/profile')}
              >
                <Settings className="h-5 w-5 mb-1" />
                <span className="text-xs">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• New booking from John Doe at 2:30 PM</p>
              <p>• Sarah completed her haircut service</p>
              <p>• Walk-in customer added to queue</p>
              <p>• Mike's appointment confirmed for tomorrow</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalonDashboardHome;