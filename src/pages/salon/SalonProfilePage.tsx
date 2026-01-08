import { useState, useEffect } from "react";
import { LogOut, Store, Clock, Users, Calendar, Timer, Bell, BarChart3, History, Star, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { SalonDashboardLayout } from "@/components/layout/SalonDashboardLayout";
interface ProfileMenuItem {
  icon: React.ElementType;
  label: string;
  route?: string;
  comingSoon?: boolean;
}
const SalonProfilePage = () => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<any>(null);
  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user?.id) return;
      try {
        const {
          data: salonData
        } = await supabase.from('salons').select('*').eq('owner_id', user.id).maybeSingle();
        if (salonData) {
          setSalon(salonData);
        }
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
  const manageStoreItems: ProfileMenuItem[] = [{
    icon: Store,
    label: "Info",
    route: "/salon-dashboard/store-info"
  }, {
    icon: Clock,
    label: "Store Timings",
    route: "/salon-dashboard/store-timings"
  }, {
    icon: Users,
    label: "Manage Staff",
    comingSoon: true
  }];
  const settingsItems: ProfileMenuItem[] = [{
    icon: Calendar,
    label: "Schedule Off",
    route: "/salon-dashboard/schedule-off"
  }, {
    icon: Timer,
    label: "Update Wait Time",
    route: "/salon-dashboard/wait-time"
  }, {
    icon: Bell,
    label: "Customer Notification",
    route: "/salon-dashboard/notifications"
  }, {
    icon: BarChart3,
    label: "Analytics",
    comingSoon: true
  }];
  const ordersItems: ProfileMenuItem[] = [{
    icon: History,
    label: "Order History",
    route: "/salon-dashboard/order-history"
  }, {
    icon: Star,
    label: "Reviews",
    comingSoon: true
  }];
  const helpItems: ProfileMenuItem[] = [{
    icon: HelpCircle,
    label: "Help Centre",
    route: "/salon-dashboard/help"
  }];
  const MenuButton = ({
    item
  }: {
    item: ProfileMenuItem;
  }) => <button onClick={() => item.route && !item.comingSoon && navigate(item.route)} disabled={item.comingSoon} className={`flex flex-col items-center justify-center p-3 rounded-xl border bg-muted/50 hover:bg-muted transition-colors min-w-[80px] relative ${item.comingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary/30'}`}>
      {item.comingSoon && <Badge variant="secondary" className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5">
          Soon
        </Badge>}
      <div className="w-11 h-11 rounded-lg bg-background flex items-center justify-center mb-2 shadow-sm">
        <item.icon className="h-5 w-5 text-foreground" />
      </div>
      <span className="text-xs text-foreground text-center font-medium leading-tight">{item.label}</span>
    </button>;
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }
  return <SalonDashboardLayout>
      <div className="p-4 space-y-4 pb-24">
        {/* Salon Info Banner - handled by SalonDashboardLayout header */}

        {/* Manage Store Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Manage Store</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {manageStoreItems.map(item => <MenuButton key={item.label} item={item} />)}
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {settingsItems.map(item => <MenuButton key={item.label} item={item} />)}
            </div>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {ordersItems.map(item => <MenuButton key={item.label} item={item} />)}
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Help</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {helpItems.map(item => <MenuButton key={item.label} item={item} />)}
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button onClick={handleLogout} variant="destructive" size="lg" className="w-full gap-2">
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </SalonDashboardLayout>;
};
export default SalonProfilePage;