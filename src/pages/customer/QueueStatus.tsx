import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Phone, RefreshCw, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const QueueStatus = () => {
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const [position, setPosition] = useState(2);
  const [estimatedTime, setEstimatedTime] = useState(20);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update position (simulate queue movement)
      if (Math.random() > 0.7 && position > 1) {
        setPosition(prev => prev - 1);
        setEstimatedTime(prev => Math.max(5, prev - 8));
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [position]);

  // Mock booking data
  const booking = {
    bookingId: "NYL001234",
    salonName: "Style Studio",
    service: "Haircut",
    time: "Now",
    address: "123 Fashion Street, Downtown",
    phone: "+91 98765 43210"
  };

  const progress = Math.max(0, (5 - position) * 20); // Progress based on initial queue of 5

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
              <h2 className="text-2xl font-bold mb-2">Position #{position}</h2>
              <p className="text-muted-foreground">in the queue</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Queue Progress</span>
                <span className="text-sm font-medium">{progress}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Estimated Time */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Estimated wait time</p>
              <p className="text-3xl font-bold text-primary">{estimatedTime} min</p>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Your Booking</h3>
              <Badge variant="secondary">ID: {booking.bookingId}</Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salon</span>
                <span className="font-medium">{booking.salonName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{booking.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{booking.time}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Queue Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Live Queue</h3>
            <div className="space-y-3">
              {[
                { position: 1, name: "Rajesh Kumar", service: "Haircut", status: "active", isCurrentUser: false },
                { position: 2, name: "You", service: "Haircut", status: "waiting", isCurrentUser: position === 2 },
                { position: 3, name: "Amit Singh", service: "Beard Trim", status: "waiting", isCurrentUser: position === 3 },
                { position: 4, name: "Priya Sharma", service: "Hair Wash", status: "waiting", isCurrentUser: position === 4 },
                { position: 5, name: "Vikash Yadav", service: "Haircut", status: "waiting", isCurrentUser: position === 5 }
              ].map((customer) => (
                <div
                  key={customer.position}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    customer.isCurrentUser 
                      ? 'bg-primary/10 border border-primary/20' 
                      : customer.position === 1 
                        ? 'bg-amber-50 border border-amber-200' 
                        : 'bg-muted/30 border border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        customer.isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : customer.position === 1 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-muted-foreground/20 text-foreground'
                      }`}
                    >
                      {customer.position}
                    </div>
                    <div>
                      <p className={`font-medium ${customer.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                        {customer.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{customer.service}</p>
                    </div>
                  </div>
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      customer.status === 'active' 
                        ? 'bg-amber-500' 
                        : 'bg-muted-foreground/40'
                    }`}
                  />
                </div>
              ))}
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
                <span className="text-sm">{booking.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm">{booking.phone}</span>
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

          {position === 1 && (
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