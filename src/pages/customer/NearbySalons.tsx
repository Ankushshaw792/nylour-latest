import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Clock, Mic, SlidersHorizontal, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { Button } from "@/components/ui/button";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { SalonStatusBadge } from "@/components/salon/SalonStatusBadge";
import { SalonCard } from "@/components/salon/SalonCard";
import { LocationSelector } from "@/components/location/LocationSelector";
import { LocationPermissionDialog } from "@/components/location/LocationPermissionDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSalonOpenStatus } from "@/hooks/useSalonOpenStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateDistance, formatDistance } from "@/lib/locationUtils";
import { cn } from "@/lib/utils";

interface SalonData {
  id: string;
  name: string;
  address: string;
  image_url: string | null;
  phone: string;
  queueCount: number;
  waitTime: string;
  primaryService: string;
  servicePrice: string;
  rating: number;
  latitude: number | null;
  longitude: number | null;
}

interface SalonWithDistance extends SalonData {
  distance: number | null;
  distanceText: string;
}

const NearbySalons = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [salons, setSalons] = useState<SalonData[]>([]);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latitude: userLat, longitude: userLng, hasLocation } = useUserLocation();

  // Show location dialog on mount if no location is set
  useEffect(() => {
    const dismissed = sessionStorage.getItem("location_dialog_dismissed");
    if (!hasLocation && !dismissed) {
      setShowLocationDialog(true);
    }
  }, [hasLocation]);

  const filterTabs = ["All", "Open Now", "Nearby", "Quick Service"];

  // Fetch salons from database
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        setLoadingSalons(true);
        
        // Query salons with their services and queue information
        const { data: salonsData, error: salonsError } = await supabase
          .from('salons')
          .select(`
            id,
            name,
            address,
            image_url,
            phone,
            latitude,
            longitude,
            salon_services(
              price,
              duration,
              services(
                name
              )
            ),
            salon_images(
              image_url,
              is_primary
            )
          `)
          .order('created_at', { ascending: false });

        if (salonsError) {
          console.error('Error fetching salons:', salonsError);
          console.error('Error details:', { 
            message: salonsError.message, 
            code: salonsError.code,
            details: salonsError.details 
          });
          toast.error('Failed to load salons: ' + salonsError.message);
          return;
        }

        console.log('Fetched salons data:', salonsData);

        // Get queue counts for each salon (today only)
        const salonIds = salonsData?.map(salon => salon.id) || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();
        
        const { data: queueData } = await supabase
          .from('queue_entries')
          .select('salon_id, status')
          .in('salon_id', salonIds)
          .eq('status', 'waiting')
          .gte('check_in_time', todayStart);

        // Process salon data with queue counts and service info
        const processedSalons: SalonData[] = salonsData?.map((salon: any) => {
          const queueCount = queueData?.filter(q => q.salon_id === salon.id).length || 0;
          const avgWaitTime = Math.max(15, queueCount * 20);
          const waitTimeRange = `${avgWaitTime}-${avgWaitTime + 10} mins`;
          
          const primarySalonService = salon.salon_services?.[0];
          const primaryService = primarySalonService?.services?.name || "Haircut";
          const servicePrice = `₹${primarySalonService?.price || 200}`;
          
          // Get primary image from salon_images or fallback to image_url
          const primaryImage = salon.salon_images?.find((img: any) => img.is_primary)?.image_url 
            || salon.salon_images?.[0]?.image_url 
            || salon.image_url;
          
          return {
            id: salon.id,
            name: salon.name,
            address: salon.address,
            image_url: primaryImage,
            phone: 'Contact salon for phone number',
            queueCount,
            waitTime: waitTimeRange,
            primaryService,
            servicePrice,
            rating: Math.round((4.5 + Math.random() * 0.8) * 10) / 10,
            latitude: salon.latitude || null,
            longitude: salon.longitude || null,
          };
        }) || [];

        setSalons(processedSalons);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load salons');
      } finally {
        setLoadingSalons(false);
      }
    };

    fetchSalons();
  }, []);

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      setAuthSheetOpen(true);
    }
  };

  // Calculate distances and sort salons
  const salonsWithDistance: SalonWithDistance[] = useMemo(() => {
    return salons.map(salon => {
      let distance: number | null = null;
      let distanceText = "Distance unknown";

      if (hasLocation && userLat && userLng && salon.latitude && salon.longitude) {
        distance = calculateDistance(userLat, userLng, salon.latitude, salon.longitude);
        distanceText = formatDistance(distance);
      } else if (!hasLocation) {
        distanceText = "Enable location";
      }

      return { ...salon, distance, distanceText };
    }).sort((a, b) => {
      // Sort by distance if available
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return 0;
    });
  }, [salons, userLat, userLng, hasLocation]);

  // Filter salons based on search and active filter
  const filteredSalons = salonsWithDistance.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         salon.primaryService.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case "Open Now":
        return true;
      case "Nearby": 
        return salon.distance !== null && salon.distance <= 1.0;
      case "Quick Service":
        return salon.queueCount <= 3;
      default:
        return true;
    }
  });

  return (
    <CustomerLayout
      headerProps={{
        leftContent: <LocationSelector compact />,
        showBackButton: false,
        showProfile: true,
        showNotifications: true,
        onProfileClick: handleProfileClick
      }}
    >
      {/* Search & Filters Section */}
      <div className="bg-card border-b border-border p-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search for salon, service or more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-12 bg-muted/30 border-border"
          />
          <Mic className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 cursor-pointer" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {filterTabs.map((tab) => (
            <Button
              key={tab}
              variant={activeFilter === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(tab)}
              className="whitespace-nowrap"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="p-4">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {loadingSalons ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium text-foreground">Loading salons...</span>
              </div>
            ) : (
              <span className="text-sm font-medium text-foreground">{filteredSalons.length} salons found</span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Sort
          </Button>
        </div>

        {/* Salon Cards */}
        <div className="space-y-4">
          {loadingSalons ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="overflow-hidden rounded-xl border border-border bg-white">
                <CardContent className="p-0">
                  <div className="h-48 bg-muted animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                      <div className="h-8 bg-muted animate-pulse rounded w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredSalons.map((salon) => (
              <SalonCard
                key={salon.id}
                salon={salon}
                user={user}
                onNavigate={(salonId) => navigate(`/salon/${salonId}`)}
                onAuthRequired={() => setAuthSheetOpen(true)}
              />
            ))
          )}
        </div>

        {!loadingSalons && filteredSalons.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No salons found matching your search</p>
          </div>
        )}
      </div>

      {/* Auth Sheet */}
      <AuthSheet 
        open={authSheetOpen} 
        onOpenChange={setAuthSheetOpen} 
      />

      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
      />
    </CustomerLayout>
  );
};

export default NearbySalons;