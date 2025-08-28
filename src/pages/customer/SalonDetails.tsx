import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Users, Phone, Scissors, Sparkles, Plus, Minus, Share, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import salonHeroImage from "@/assets/salon-hero.jpg";
import haircutImage from "@/assets/haircut-service.jpg";
import beardTrimImage from "@/assets/beard-trim-service.jpg";
import hairWashImage from "@/assets/hair-wash-service.jpg";

interface SalonService {
  id: string;
  name: string;
  price: number;
  duration: number;
  image?: string;
  icon: any;
}

interface SalonDetails {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  reviews: number;
  waitTime: string;
  queueCount: number;
  services: SalonService[];
  hours: string;
  image_url: string | null;
}

const SalonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useRequireAuth();
  const { addItem, removeItem, updateQuantity, items, totalPrice, totalItems } = useCart();
  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [loadingSalon, setLoadingSalon] = useState(true);

  // Fetch salon details from database
  useEffect(() => {
    const fetchSalonDetails = async () => {
      if (!id) return;
      
      try {
        setLoadingSalon(true);
        
        // Fetch salon with services
        const { data: salonData, error: salonError } = await supabase
          .from('salons_public')
          .select(`
            id,
            name,
            address,
            image_url,
            salon_services (
              id,
              price,
              duration,
              services (
                id,
                name,
                default_duration
              )
            )
          `)
          .eq('id', id)
          .eq('status', 'approved')
          .single();

        if (salonError) {
          console.error('Error fetching salon:', salonError);
          toast.error('Failed to load salon details');
          return;
        }

        if (!salonData) {
          toast.error('Salon not found');
          return;
        }

        // Get current queue count
        const { data: queueData } = await supabase
          .from('queue_entries')
          .select('id')
          .eq('salon_id', id)
          .eq('status', 'waiting');

        const queueCount = queueData?.length || 0;
        const avgWaitTime = Math.max(15, queueCount * 20);

        // Get salon hours (mock for now)
        const hours = "9:00 AM - 9:00 PM";

        // Process services with images and icons
        const serviceImages = [haircutImage, beardTrimImage, hairWashImage];
        const serviceIcons = [Scissors, Sparkles, Sparkles];
        
        const processedServices: SalonService[] = salonData.salon_services?.map((salonService, index) => ({
          id: salonService.id,
          name: salonService.services.name,
          price: salonService.price,
          duration: salonService.duration,
          image: serviceImages[index % serviceImages.length],
          icon: serviceIcons[index % serviceIcons.length]
        })) || [];

        const processedSalon: SalonDetails = {
          id: salonData.id,
          name: salonData.name,
          address: salonData.address,
          phone: 'Contact salon for phone number', // Phone now protected
          rating: Math.round((4.5 + Math.random() * 0.8) * 10) / 10, // Mock rating
          reviews: Math.floor(Math.random() * 200) + 50, // Mock reviews
          waitTime: `${avgWaitTime} min`,
          queueCount,
          services: processedServices,
          hours,
          image_url: salonData.image_url
        };

        setSalon(processedSalon);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load salon details');
      } finally {
        setLoadingSalon(false);
      }
    };

    fetchSalonDetails();
  }, [id]);

  const getItemQuantity = (serviceId: string) => {
    const item = items.find(item => item.id === serviceId);
    return item ? item.quantity : 0;
  };

  const handleAddService = (service: SalonService) => {
    addItem({
      id: service.id,
      name: service.name,
      price: service.price,
      duration: `${service.duration} min`
    });
  };

  const handleUpdateQuantity = (serviceId: string, newQuantity: number) => {
    updateQuantity(serviceId, newQuantity);
  };

  if (loading || loadingSalon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading salon details...</span>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Salon not found</h2>
          <Button onClick={() => navigate('/')}>Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image Section */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={salon.image_url || salonHeroImage} 
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
                <p className="text-2xl font-bold text-purple-500">{salon.waitTime}</p>
                <p className="text-sm text-muted-foreground">Wait Time</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-2xl font-bold">{salon.queueCount}</p>
                <p className="text-sm text-muted-foreground">In Queue</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-green-500">Open</p>
                <p className="text-sm text-muted-foreground">{salon.hours}</p>
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
            {salon.services.map((service) => {
              const quantity = getItemQuantity(service.id);
              return (
                <Card key={service.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Service Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={service.image || haircutImage} 
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Service Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{service.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{service.duration} min</p>
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