import { useState, useEffect } from "react";
import { User, MapPin, Phone, Mail, Clock, DollarSign, Save, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SalonProfile {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  image_url: string;
}

interface SalonHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const SalonProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salonProfile, setSalonProfile] = useState<SalonProfile>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    image_url: '',
  });

  const [salonHours, setSalonHours] = useState<SalonHours[]>([]);
  const [notifications, setNotifications] = useState({
    newBookings: true,
    queueUpdates: true,
    dailyReports: false,
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user?.id) return;

      try {
        // Fetch salon profile
        const { data: salon } = await supabase
          .from('salons')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (salon) {
          setSalonProfile({
            name: salon.name || '',
            description: salon.description || '',
            address: salon.address || '',
            phone: salon.phone || '',
            email: salon.email || '',
            image_url: salon.image_url || '',
          });
        }

        // Fetch salon hours
        const { data: hours } = await supabase
          .from('salon_hours')
          .select('*')
          .eq('salon_id', salon?.id)
          .order('day_of_week');

        if (hours && hours.length > 0) {
          setSalonHours(hours);
        } else {
          // Initialize default hours (9 AM to 6 PM, closed on Sunday)
          const defaultHours = Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            open_time: '09:00',
            close_time: '18:00',
            is_closed: i === 0, // Sunday closed by default
          }));
          setSalonHours(defaultHours);
        }
      } catch (error) {
        console.error('Error fetching salon data:', error);
        toast({
          title: "Error",
          description: "Failed to load salon data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSalonData();
  }, [user, toast]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      // Update salon profile
      const { error: salonError } = await supabase
        .from('salons')
        .update(salonProfile)
        .eq('owner_id', user.id);

      if (salonError) throw salonError;

      // Get salon ID for hours update
      const { data: salon } = await supabase
        .from('salons')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (salon) {
        // Delete existing hours and insert new ones
        await supabase
          .from('salon_hours')
          .delete()
          .eq('salon_id', salon.id);

        const hoursToInsert = salonHours.map(hour => ({
          salon_id: salon.id,
          day_of_week: hour.day_of_week,
          open_time: hour.open_time,
          close_time: hour.close_time,
          is_closed: hour.is_closed,
        }));

        const { error: hoursError } = await supabase
          .from('salon_hours')
          .insert(hoursToInsert);

        if (hoursError) throw hoursError;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateHours = (dayIndex: number, field: keyof SalonHours, value: any) => {
    setSalonHours(prev => prev.map((hour, index) => 
      index === dayIndex ? { ...hour, [field]: value } : hour
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Salon Profile & Settings</h1>
          <p className="text-white/90">Manage your salon information and preferences</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="salonName">Salon Name</Label>
              <Input
                id="salonName"
                value={salonProfile.name}
                onChange={(e) => setSalonProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter salon name"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={salonProfile.description}
                onChange={(e) => setSalonProfile(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your salon"
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={salonProfile.address}
                onChange={(e) => setSalonProfile(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full salon address"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={salonProfile.phone}
                onChange={(e) => setSalonProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={salonProfile.email}
                onChange={(e) => setSalonProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="salon@example.com"
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Operating Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {salonHours.map((hour, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-20 font-medium">
                  {daysOfWeek[hour.day_of_week]}
                </div>
                
                <Switch
                  checked={!hour.is_closed}
                  onCheckedChange={(checked) => updateHours(index, 'is_closed', !checked)}
                />
                
                {!hour.is_closed && (
                  <>
                    <Input
                      type="time"
                      value={hour.open_time}
                      onChange={(e) => updateHours(index, 'open_time', e.target.value)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={hour.close_time}
                      onChange={(e) => updateHours(index, 'close_time', e.target.value)}
                      className="w-24"
                    />
                  </>
                )}
                
                {hour.is_closed && (
                  <span className="text-muted-foreground ml-4">Closed</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Bookings</p>
                <p className="text-sm text-muted-foreground">Get notified when customers book appointments</p>
              </div>
              <Switch
                checked={notifications.newBookings}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newBookings: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Queue Updates</p>
                <p className="text-sm text-muted-foreground">Notifications when customers join or leave queue</p>
              </div>
              <Switch
                checked={notifications.queueUpdates}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, queueUpdates: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Reports</p>
                <p className="text-sm text-muted-foreground">Daily summary of appointments and revenue</p>
              </div>
              <Switch
                checked={notifications.dailyReports}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, dailyReports: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          size="lg"
          className="w-full"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default SalonProfilePage;