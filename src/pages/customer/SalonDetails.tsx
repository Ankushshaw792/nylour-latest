import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Users, Phone, Scissors, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data
const mockSalonData: Record<string, any> = {
  "1": {
    id: 1,
    name: "Style Studio",
    address: "123 Fashion Street, Downtown",
    phone: "+91 98765 43210",
    rating: 4.8,
    reviews: 156,
    waitTime: "15 min",
    queueCount: 3,
    services: [
      { id: 1, name: "Haircut", price: 299, duration: "30 min", icon: Scissors },
      { id: 2, name: "Beard Trim", price: 149, duration: "15 min", icon: Sparkles },
      { id: 3, name: "Hair Wash", price: 99, duration: "20 min", icon: Sparkles },
    ],
    hours: "9:00 AM - 9:00 PM",
    image: "/placeholder.svg"
  }
};

const SalonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const salon = mockSalonData[id || "1"];

  if (!salon) {
    return <div>Salon not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative bg-gradient-hero text-white">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="mobile-icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Salon Details</h1>
        </div>
        
        <div className="px-4 pb-6">
          <div className="flex gap-4">
            {/* Salon Image */}
            <div className="w-20 h-20 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>

            {/* Salon Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{salon.name}</h2>
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{salon.rating}</span>
                <span className="text-white/70">({salon.reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm text-white/90">{salon.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Queue Status */}
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Current Wait Time</p>
                  <p className="text-2xl font-bold text-primary">{salon.waitTime}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">People in queue</p>
                <p className="text-lg font-bold">{salon.queueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Services Available</h3>
          <div className="space-y-3">
            {salon.services.map((service: any) => (
              <Card key={service.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">₹{service.price}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span>{salon.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <span>{salon.hours}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book Now Button */}
        <div className="fixed bottom-20 left-4 right-4">
          <Button
            variant="gradient"
            size="xl"
            className="w-full"
            onClick={() => navigate(`/book/${salon.id}`)}
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SalonDetails;