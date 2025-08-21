import { Calendar, Clock, MapPin, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mockBookings = [
  {
    id: 1,
    salonName: "Glam Studio",
    service: "Hair Cut & Style",
    date: "2024-01-15",
    time: "2:30 PM",
    status: "confirmed",
    price: "$75",
    address: "123 Fashion St",
    rating: 4.8
  },
  {
    id: 2,
    salonName: "Beauty Haven",
    service: "Manicure & Pedicure",
    date: "2024-01-10",
    time: "11:00 AM",
    status: "completed",
    price: "$50",
    address: "456 Style Ave",
    rating: 4.9
  },
  {
    id: 3,
    salonName: "Radiant Salon",
    service: "Hair Color Treatment",
    date: "2024-01-20",
    time: "1:00 PM",
    status: "upcoming",
    price: "$120",
    address: "789 Beauty Blvd",
    rating: 4.7
  }
];

const BookingsPage = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-primary text-primary-foreground";
      case "completed":
        return "bg-success text-success-foreground";
      case "upcoming":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "completed":
        return "Completed";
      case "upcoming":
        return "Upcoming";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Book Now
          </Button>
        </div>

        <div className="space-y-4">
          {mockBookings.map((booking) => (
            <Card key={booking.id} className="glass card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">{booking.salonName}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning fill-current" />
                        <span className="text-sm text-muted-foreground">{booking.rating}</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{booking.address}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {getStatusLabel(booking.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{booking.service}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary">{booking.price}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {booking.status === "upcoming" && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        Reschedule
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Cancel
                      </Button>
                    </>
                  )}
                  {booking.status === "completed" && (
                    <Button variant="outline" size="sm" className="flex-1">
                      Book Again
                    </Button>
                  )}
                  {booking.status === "confirmed" && (
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockBookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-4">Book your first appointment to get started</p>
            <Button>Find Salons</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;