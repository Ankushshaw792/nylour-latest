import { useState, useEffect } from "react";
import { LogOut, Pause, Clock, Settings, BarChart3, Eye, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";
import NotificationControls from "@/components/salon/NotificationControls";

const SalonProfilePage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState(true);
  const [waitTime, setWaitTime] = useState(30);
  const [salon, setSalon] = useState<any>(null);

  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user?.id) return;

      try {
        const { data: salonData } = await supabase
          .from('salons')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!salonData) return;
        setSalon(salonData);
      } catch (error) {
        console.error('Error fetching salon data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonData();
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
    <SalonDashboardLayout>
      <div className="p-4 space-y-4">
        {/* Booking Control Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Booking Control</h3>
                <p className="text-sm text-gray-500">
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

        {/* Update Wait Time */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5" />
              Update Wait Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="waitTime" className="text-gray-700">Current Wait Time (minutes)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="waitTime"
                  type="number"
                  value={waitTime}
                  onChange={(e) => setWaitTime(Number(e.target.value))}
                  className="flex-1 border-gray-200"
                />
                <Button onClick={handleUpdateWaitTime}>Update</Button>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="border-gray-200" onClick={() => handleQuickTimeUpdate(15)}>
                15 min
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200" onClick={() => handleQuickTimeUpdate(30)}>
                30 min
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200" onClick={() => handleQuickTimeUpdate(45)}>
                45 min
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200" onClick={() => handleQuickTimeUpdate(60)}>
                1 hour
              </Button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-1">Wait Time Guidelines</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Update regularly based on current queue</li>
                <li>• Consider service complexity and staff availability</li>
                <li>• Communicate changes to waiting customers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Notification Controls */}
        {salon && (
          <NotificationControls salonId={salon.id} />
        )}

        {/* Quick Actions */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 flex-col gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => navigate('/salon-dashboard')}>
                <Eye className="h-5 w-5" />
                <span className="text-xs">View Queue</span>
              </Button>
              
              <Button variant="outline" className="h-14 flex-col gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50">
                <Settings className="h-5 w-5" />
                <span className="text-xs">Salon Settings</span>
              </Button>
              
              <Button variant="outline" className="h-14 flex-col gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">Analytics</span>
              </Button>
              
              <Button variant="outline" className="h-14 flex-col gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50">
                <Users className="h-5 w-5" />
                <span className="text-xs">Customers</span>
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
