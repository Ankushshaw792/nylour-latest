import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Phone, Scissors, Sparkles, Plus, Minus, Share, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SalonGalleryCarousel from "@/components/salon/SalonGalleryCarousel";
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

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
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
  galleryImages: GalleryImage[];
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
          .from('salons')
          .select(`
            id,
            name,
            address,
            image_url,
            avg_service_time,
            salon_services (
              id,
              price,
              duration,
              image_url,
              display_order,
              services (
                id,
                name,
                default_duration
              )
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (salonError) {
          console.error('Error fetching salon:', salonError);
          toast.error('Failed to load salon details');
          return;
        }

        if (!salonData) {
          toast.error('Salon not found');
          return;
        }

        // Fetch gallery images
        const { data: galleryData } = await supabase
          .from('salon_images')
          .select('id, image_url, caption, is_primary')
          .eq('salon_id', id)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true });

        // Get current queue count (today only)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();
        
        const { data: queueData } = await supabase
          .from('queue_entries')
          .select('id')
          .eq('salon_id', id)
          .eq('status', 'waiting')
          .gte('check_in_time', todayStart);

        const queueCount = queueData?.length || 0;
        // Use salon's avg_service_time (default 30 mins) for wait calculation
        const avgServiceTime = salonData.avg_service_time || 30;
        const avgWaitTime = queueCount * avgServiceTime;

        // Get salon hours (mock for now)
        const hours = "9:00 AM - 9:00 PM";

        // Process services - use uploaded image_url if available, otherwise fallback
        const serviceImages = [haircutImage, beardTrimImage, hairWashImage];
        const serviceIcons = [Scissors, Sparkles, Sparkles];
        
        // Sort services by display_order
        const sortedServices = [...(salonData.salon_services || [])].sort(
          (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
        );
        
        const processedServices: SalonService[] = sortedServices.map((salonService: any, index: number) => ({
          id: salonService.id, // Use salon_services.id for bookings foreign key
          name: salonService.services.name,
          price: salonService.price,
          duration: salonService.duration,
          image: salonService.image_url || serviceImages[index % serviceImages.length],
          icon: serviceIcons[index % serviceIcons.length]
        }));

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
          image_url: salonData.image_url,
          galleryImages: galleryData || []
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
    <CustomerLayout
      headerProps={{
        title: salon?.name || "Salon Details",
        showBackButton: true,
        showProfile: false,
        showNotifications: false,
        rightContent: (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="mobile-icon"
              className="text-foreground hover:bg-muted"
            >
              <Share className="h-5 w-5" />
            </Button>
            <FavoriteButton 
              salonId={salon?.id || ""} 
              size="md"
              className="text-foreground hover:bg-muted"
            />
          </div>
        )
      }}
      bottomButtonProps={totalItems > 0 ? {
        text: "Book Now",
        onClick: () => navigate(`/book/${salon?.id}`),
        disabled: totalItems === 0,
        price: totalPrice,
        itemCount: totalItems
      } : undefined}
    >
      {/* Gallery Carousel */}
      <SalonGalleryCarousel
        images={salon.galleryImages}
        fallbackImage={salon.image_url}
        salonName={salon.name}
      />

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
        <div className="pb-6">
          {/* Fixed button is now handled by CustomerLayout */}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default SalonDetails;