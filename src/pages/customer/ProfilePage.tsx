import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  BarChart3, 
  CreditCard, 
  ClipboardList, 
  Heart, 
  Star, 
  HelpCircle, 
  Info, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LucideIcon } from "lucide-react";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  route?: string;
  comingSoon?: boolean;
}

const ProfilePage = () => {
  const { user, loading } = useRequireAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching profile:", error);
          toast.error("Failed to load profile");
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    return user?.email?.split('@')[0] || "User";
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.first_name) {
      return profile.first_name[0].toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  // Menu Items
  const personalInfoItems: MenuItem[] = [
    { icon: User, label: "Profile", route: "/profile/edit" },
    { icon: BarChart3, label: "Spend Analysis", route: "/profile/spend-analysis" },
    { icon: CreditCard, label: "Payments", comingSoon: true },
  ];

  const ordersItems: MenuItem[] = [
    { icon: ClipboardList, label: "Order History", route: "/profile/order-history" },
    { icon: Heart, label: "Favorites", route: "/profile/favorites" },
    { icon: Star, label: "Reviews", comingSoon: true },
  ];

  const moreSettingsItems: MenuItem[] = [
    { icon: HelpCircle, label: "Help", route: "/profile/help" },
    { icon: Info, label: "About", comingSoon: true },
  ];

  const MenuButton = ({ item }: { item: MenuItem }) => (
    <button
      className={`flex flex-col items-center justify-center p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors min-h-[90px] relative ${
        item.comingSoon ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={() => !item.comingSoon && item.route && navigate(item.route)}
      disabled={item.comingSoon}
    >
      {item.comingSoon && (
        <span className="absolute top-2 right-2 text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
          Soon
        </span>
      )}
      <item.icon className={`h-6 w-6 mb-2 ${item.comingSoon ? "text-muted-foreground" : "text-primary"}`} />
      <span className={`text-xs font-medium text-center ${item.comingSoon ? "text-muted-foreground" : "text-foreground"}`}>
        {item.label}
      </span>
    </button>
  );

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <CustomerLayout
      headerProps={{
        title: "Profile",
        showBackButton: false,
        showProfile: false,
        showNotifications: true
      }}
    >
      <div className="p-4 space-y-4">
        {/* User Info Header */}
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url} alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{getDisplayName()}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile/edit")}
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Personal Info</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3">
              {personalInfoItems.map((item, index) => (
                <MenuButton key={index} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3">
              {ordersItems.map((item, index) => (
                <MenuButton key={index} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* More Settings Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">More Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3">
              {moreSettingsItems.map((item, index) => (
                <MenuButton key={index} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </CustomerLayout>
  );
};

export default ProfilePage;
