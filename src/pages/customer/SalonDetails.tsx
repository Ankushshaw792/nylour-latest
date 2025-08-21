import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Users, Phone, Scissors, Sparkles, Plus, Minus, Share, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCart } from "@/contexts/CartContext";
import salonHeroImage from "@/assets/salon-hero.jpg";
import haircutImage from "@/assets/haircut-service.jpg";
import beardTrimImage from "@/assets/beard-trim-service.jpg";
import hairWashImage from "@/assets/hair-wash-service.jpg";

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
      { id: 1, name: "Haircut", price: 299, duration: "30 min", icon: Scissors, image: haircutImage },
      { id: 2, name: "Beard Trim", price: 149, duration: "15 min", icon: Sparkles, image: beardTrimImage },
      { id: 3, name: "Hair Wash", price: 99, duration: "20 min", icon: Sparkles, image: hairWashImage },
    ],
    hours: "9:00 AM - 9:00 PM",
    image: "/placeholder.svg"
  }
};

const SalonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const { addItem, removeItem, updateQuantity, items, totalPrice, totalItems } = useCart();
  
  const salon = mockSalonData[id || "1"];

  const getItemQuantity = (serviceId: number) => {
    const item = items.find(item => item.id === serviceId);
    return item ? item.quantity : 0;
  };

  const handleAddService = (service: any) => {
    addItem({
      id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration
    });
  };

  const handleUpdateQuantity = (serviceId: number, newQuantity: number) => {
    updateQuantity(serviceId, newQuantity);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!salon) {
    return <div>Salon not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image Section */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={salonHeroImage} 
          alt={salon.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Overlay Buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button
            variant="ghost"
            size="mobile-icon"
            onClick={() => navigate(-1)}
            className="bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="mobile-icon"
              className="bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm"
            >
              <Share className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="mobile-icon"
              className="bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Wait Time Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-purple-500">25 min</p>
                <p className="text-sm text-muted-foreground">Wait Time</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-2xl font-bold">{salon.queueCount}</p>
                <p className="text-sm text-muted-foreground">In Queue</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-green-500">Open</p>
                <p className="text-sm text-muted-foreground">Until 9 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salon Details Section */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-2xl font-bold mb-3">{salon.name}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-foreground">{salon.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-foreground">{salon.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Available Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Services Available</h3>
          <div className="space-y-4">
            {salon.services.map((service: any) => {
              const quantity = getItemQuantity(service.id);
              return (
                <Card key={service.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Service Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={service.image} 
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Service Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{service.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{service.duration}</p>
                        <p className="text-xl font-bold text-primary">₹{service.price}</p>
                      </div>
                      
                      {/* Cart Controls */}
                      <div className="flex flex-col items-center justify-center gap-2">
                        {quantity === 0 ? (
                          <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => handleAddService(service)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="mobile-icon"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(service.id, quantity - 1)}
                              className="h-8 w-8"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold min-w-[2rem] text-center">
                              {quantity}
                            </span>
                            <Button
                              size="mobile-icon"
                              onClick={() => handleUpdateQuantity(service.id, quantity + 1)}
                              className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Book Now Button */}
        <div className="pb-24">
          <div className="fixed bottom-20 left-4 right-4">
            <Button
              variant="gradient"
              size="xl"
              className="w-full relative"
              onClick={() => navigate(`/book/${salon.id}`)}
              disabled={totalItems === 0}
            >
              Book Now
              {totalItems > 0 && (
                <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                  {totalItems}
                </div>
              )}
              {totalPrice > 0 && (
                <span className="ml-2">• ₹{totalPrice}</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonDetails;