import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, MapPin, Phone, Mail, Settings, Heart, CreditCard, Bell, LogOut, Edit, Calendar, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { FavoritesList } from "@/components/favorites/FavoritesList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, loading } = useRequireAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const quickActions = [
    {
      icon: Calendar,
      label: "Booking History",
      action: () => navigate("/bookings")
    },
    {
      icon: Heart,
      label: "Favorite Salons",
      action: () => navigate("/profile") // Scroll to favorites section
    },
    {
      icon: Bell,
      label: "Notifications", 
      action: () => toast.info("Check the notification bell in the top navigation")
    }
  ];

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

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error refetching profile:", error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error refetching profile:", error);
    }
  };

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

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-20">
        {/* User Info Header */}
        <Card className="border border-border bg-white mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url} alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-foreground">{getDisplayName()}</h2>
                  <Badge variant="secondary" className="text-xs">Premium Member</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border border-border bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{profile?.total_visits || 0}</div>
              <div className="text-xs text-muted-foreground">Total Visits</div>
            </CardContent>
          </Card>
          <Card className="border border-border bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">4.8</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </CardContent>
          </Card>
          <Card className="border border-border bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">₹{profile?.total_spent || 0}</div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information */}
        <Card className="border border-border bg-white mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-foreground">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">{profile?.phone || "Add phone number"}</p>
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                </div>
              </div>
              <Edit className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">{profile?.address || "Add address"}</p>
                  <p className="text-xs text-muted-foreground">Location</p>
                </div>
              </div>
              <Edit className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="border border-border bg-white mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-foreground">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Favorite Services</p>
                <p className="text-xs text-muted-foreground">Hair Cut, Beard Trim</p>
              </div>
              <Edit className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Preferred Time</p>
                <p className="text-xs text-muted-foreground">2:00 PM - 4:00 PM</p>
              </div>
              <Edit className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-border bg-white mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={item.action}
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Favorites Section */}
        <div className="mb-6">
          <FavoritesList />
        </div>

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>

        {/* Profile Edit Dialog */}
        {profile && (
          <ProfileEditDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;