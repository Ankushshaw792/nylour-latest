import React, { useState } from "react";
import { 
  Power, 
  PowerOff, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  Play, 
  UserPlus,
  Bell,
  Settings,
  MessageSquare,
  StopCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSalonRealtimeData } from "@/hooks/useSalonRealtimeData";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const ComprehensiveDashboard = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  
  const {
    loading,
    salon,
    bookings,
    queue,
    updateSalonStatus,
    acceptBooking,
    rejectBooking,
    startService,
    completeService,
    addWalkInCustomer,
    notifyNextCustomer,
    refetch
  } = useSalonRealtimeData();

  const [newWaitTime, setNewWaitTime] = useState(30);
  const [walkInData, setWalkInData] = useState({
    name: "",
    phone: "",
    service_id: ""
  });
  const [customMessage, setCustomMessage] = useState("");

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading salon dashboard...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No Salon Found</h3>
            <p className="text-muted-foreground mb-4">
              You need to register your salon first to access the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const inProgressBookings = bookings.filter(b => b.status === 'in_progress');

  const handleToggleOnline = async () => {
    await updateSalonStatus({ is_online: !salon.is_online });
  };

  const handleToggleAcceptingBookings = async () => {
    await updateSalonStatus({ accepts_bookings: !salon.accepts_bookings });
  };

  const handleUpdateWaitTime = async () => {
    await updateSalonStatus({ current_wait_time: newWaitTime });
  };

  const handleAddWalkIn = async () => {
    if (!walkInData.name || !walkInData.phone || !walkInData.service_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all walk-in customer details",
        variant: "destructive",
      });
      return;
    }

    await addWalkInCustomer(walkInData);
    setWalkInData({ name: "", phone: "", service_id: "" });
  };

  const handleNotifyNext = async () => {
    await notifyNextCustomer(customMessage || undefined);
    setCustomMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Status */}
      <div className="bg-gradient-hero text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Salon Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {salon.is_online ? (
                  <Power className="h-5 w-5 text-green-400" />
                ) : (
                  <PowerOff className="h-5 w-5 text-red-400" />
                )}
                <span className="font-medium">
                  {salon.is_online ? "Online" : "Offline"}
                </span>
              </div>
              <Badge variant={salon.accepts_bookings ? "secondary" : "destructive"}>
                {salon.accepts_bookings ? "Accepting Bookings" : "Bookings Closed"}
              </Badge>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-white/80">Current Wait Time</p>
            <p className="text-2xl font-bold">{salon.current_wait_time} min</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="online-toggle">Salon Status</Label>
                <div className="flex items-center gap-2">
                  <span className={salon.is_online ? "text-green-600" : "text-red-600"}>
                    {salon.is_online ? "Online" : "Offline"}
                  </span>
                  <Switch
                    id="online-toggle"
                    checked={salon.is_online}
                    onCheckedChange={handleToggleOnline}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="bookings-toggle">Accept Bookings</Label>
                <Switch
                  id="bookings-toggle"
                  checked={salon.accepts_bookings}
                  onCheckedChange={handleToggleAcceptingBookings}
                />
              </div>
            </div>

            <Separator />

            {/* Wait Time Update */}
            <div className="space-y-3">
              <Label htmlFor="wait-time">Update Wait Time (minutes)</Label>
              <div className="flex gap-3">
                <Input
                  id="wait-time"
                  type="number"
                  value={newWaitTime}
                  onChange={(e) => setNewWaitTime(Number(e.target.value))}
                  className="flex-1"
                />
                <Button onClick={handleUpdateWaitTime} variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingBookings.length}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{confirmedBookings.length}</div>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{inProgressBookings.length}</div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{queue.length}</div>
              <p className="text-sm text-muted-foreground">In Queue</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Bookings */}
        {pendingBookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Pending Bookings ({pendingBookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
            {pendingBookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">
                      {booking.customer_id 
                        ? `${booking.profiles?.first_name || ''} ${booking.profiles?.last_name || ''}`.trim() || 'Customer'
                        : booking.customer_notes?.includes('Walk-in:') 
                          ? booking.customer_notes.replace('Walk-in: ', '').split(' - ')[0]
                          : 'Walk-in Customer'
                      }
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {booking.services?.name || 'Service'} • {booking.booking_time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.customer_id 
                        ? `Phone: ${booking.profiles?.phone || 'N/A'}`
                        : booking.customer_notes?.includes(' - ') 
                          ? `Phone: ${booking.customer_notes.split(' - ')[1]}`
                          : 'Walk-in'
                      }
                    </p>
                  </div>
                  <Badge variant="secondary">₹{booking.total_price}</Badge>
                </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptBooking(booking.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectBooking(booking.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Current Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Queue ({confirmedBookings.length + inProgressBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...inProgressBookings, ...confirmedBookings].map((booking, index) => (
              <div key={booking.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {booking.customer_id 
                          ? `${booking.profiles?.first_name || ''} ${booking.profiles?.last_name || ''}`.trim() || 'Customer'
                          : booking.customer_notes?.includes('Walk-in:') 
                            ? booking.customer_notes.replace('Walk-in: ', '').split(' - ')[0]
                            : 'Walk-in Customer'
                        }
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {booking.services?.name || 'Service'} • {booking.booking_time}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={booking.status === 'in_progress' ? 'default' : 'secondary'}
                  >
                    {booking.status === 'in_progress' ? 'In Progress' : 'Waiting'}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  {booking.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => startService(booking.id)}
                      variant="outline"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Service
                    </Button>
                  )}
                  {booking.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => completeService(booking.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {confirmedBookings.length === 0 && inProgressBookings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No customers in queue</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {/* Add Walk-in Customer */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-16">
                <UserPlus className="h-5 w-5 mr-2" />
                Add Walk-in
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Walk-in Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input
                    id="customer-name"
                    value={walkInData.name}
                    onChange={(e) => setWalkInData({...walkInData, name: e.target.value})}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone Number</Label>
                  <Input
                    id="customer-phone"
                    value={walkInData.phone}
                    onChange={(e) => setWalkInData({...walkInData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="service-select">Service</Label>
                  <Select 
                    value={walkInData.service_id} 
                    onValueChange={(value) => setWalkInData({...walkInData, service_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service1">Haircut</SelectItem>
                      <SelectItem value="service2">Hair Wash</SelectItem>
                      <SelectItem value="service3">Beard Trim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddWalkIn} className="w-full">
                  Add to Queue
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Notify Next Customer */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-16">
                <MessageSquare className="h-5 w-5 mr-2" />
                Notify Next
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notify Next Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-message">Custom Message (Optional)</Label>
                  <Textarea
                    id="custom-message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter a custom message for the customer..."
                  />
                </div>
                <Button onClick={handleNotifyNext} className="w-full">
                  Send Notification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Emergency Stop Button */}
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => updateSalonStatus({ accepts_bookings: false })}
              className="w-full"
            >
              <StopCircle className="h-5 w-5 mr-2" />
              Stop All New Bookings (Emergency)
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Use during rush hours or emergencies to temporarily stop accepting new bookings
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComprehensiveDashboard;