import { User, MapPin, Phone, Mail, Settings, Heart, CreditCard, Bell, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const ProfilePage = () => {
  const profileMenuItems = [
    {
      icon: Settings,
      label: "Account Settings",
      description: "Update your personal information",
      action: () => console.log("Account settings")
    },
    {
      icon: CreditCard,
      label: "Payment Methods",
      description: "Manage your payment options",
      action: () => console.log("Payment methods")
    },
    {
      icon: Bell,
      label: "Notifications",
      description: "Customize your notification preferences",
      action: () => console.log("Notifications")
    },
    {
      icon: Heart,
      label: "Favorite Salons",
      description: "View your saved salons",
      action: () => console.log("Favorites")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-20">
        {/* Profile Header */}
        <Card className="glass mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/placeholder.svg" alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  SA
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">Sarah Anderson</h2>
                <p className="text-muted-foreground">Member since Jan 2024</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>New York, NY</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-sm text-muted-foreground">Bookings</div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">8</div>
              <div className="text-sm text-muted-foreground">Favorites</div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">4.9</div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-foreground">sarah.anderson@email.com</p>
                <p className="text-sm text-muted-foreground">Primary email address</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-foreground">+1 (555) 123-4567</p>
                <p className="text-sm text-muted-foreground">Mobile number</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Menu */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileMenuItems.map((item, index) => (
              <div key={index}>
                <div 
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={item.action}
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-muted-foreground">›</div>
                </div>
                {index < profileMenuItems.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified about bookings</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">SMS Alerts</p>
                <p className="text-sm text-muted-foreground">Receive SMS reminders</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Email Marketing</p>
                <p className="text-sm text-muted-foreground">Special offers and updates</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;