import { useState } from "react";
import { Calendar, Clock, MapPin, Star, Phone, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const mockCurrentBookings = [
  {
    id: 1,
    salonName: "Glam Studio",
    service: "Hair Cut & Style",
    date: "Today",
    time: "2:30 PM",
    status: "upcoming",
    price: "$75",
    address: "123 Fashion St",
    queuePosition: 3,
    estimatedWait: "15 min"
  },
  {
    id: 2,
    salonName: "Beauty Haven",
    service: "Manicure & Pedicure", 
    date: "Tomorrow",
    time: "11:00 AM",
    status: "confirmed",
    price: "$50",
    address: "456 Style Ave",
    queuePosition: null,
    estimatedWait: null
  }
];

const mockPastBookings = [
  {
    id: 3,
    salonName: "Radiant Salon",
    service: "Hair Color Treatment",
    date: "Jan 15, 2024",
    time: "1:00 PM",
    status: "completed",
    price: "$120",
    address: "789 Beauty Blvd",
    rating: 4.7,
    userRating: null
  },
  {
    id: 4,
    salonName: "Modern Cuts",
    service: "Beard Trim",
    date: "Jan 10, 2024",
    time: "3:00 PM", 
    status: "cancelled",
    price: "$30",
    address: "321 Style Blvd",
    rating: 4.5,
    userRating: 5
  }
];

const BookingsPage = () => {
  const { user, loading } = useRequireAuth();
  const [activeRating, setActiveRating] = useState<{[key: number]: number}>({});

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleRating = (bookingId: number, rating: number) => {
    setActiveRating(prev => ({ ...prev, [bookingId]: rating }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Book Now
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          {/* Current Bookings */}
          <TabsContent value="current" className="space-y-4">
            {mockCurrentBookings.map((booking) => (
              <Card key={booking.id} className="border border-border bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{booking.salonName}</h3>
                      <p className="text-sm text-muted-foreground">{booking.service}</p>
                    </div>
                    <Badge variant={booking.status === "upcoming" ? "default" : "secondary"}>
                      {booking.status === "upcoming" ? "Upcoming" : "Confirmed"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{booking.time}</span>
                    </div>
                  </div>

                  {booking.queuePosition && (
                    <div className="bg-primary/10 p-3 rounded-lg mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Queue Position</p>
                          <p className="text-xs text-muted-foreground">Estimated wait time</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">#{booking.queuePosition}</p>
                          <p className="text-sm text-primary">{booking.estimatedWait}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{booking.address}</span>
                    </div>
                    <span className="font-semibold text-primary">{booking.price}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {mockCurrentBookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No current bookings</h3>
                <p className="text-muted-foreground mb-4">Book your next appointment</p>
                <Button>Find Salons</Button>
              </div>
            )}
          </TabsContent>

          {/* Past Bookings */}
          <TabsContent value="past" className="space-y-4">
            {mockPastBookings.map((booking) => (
              <Card key={booking.id} className="border border-border bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{booking.salonName}</h3>
                      <p className="text-sm text-muted-foreground">{booking.service}</p>
                    </div>
                    <Badge variant={booking.status === "completed" ? "secondary" : "destructive"}>
                      {booking.status === "completed" ? "Completed" : "Cancelled"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{booking.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{booking.address}</span>
                    </div>
                    <span className="font-semibold text-foreground">{booking.price}</span>
                  </div>

                  {booking.status === "completed" && (
                    <div className="bg-muted/30 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-foreground mb-2">Rate your experience</p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 cursor-pointer transition-colors ${
                              star <= (activeRating[booking.id] || booking.userRating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                            onClick={() => handleRating(booking.id, star)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <Button variant="outline" size="sm" className="w-full">
                    {booking.status === "completed" ? "Book Again" : "Rebook"}
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {mockPastBookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No past bookings</h3>
                <p className="text-muted-foreground">Your booking history will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BookingsPage;