import { useState, useEffect, useMemo } from "react";
import { SalonLoader } from "@/components/ui/SalonLoader";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Clock, Mic, SlidersHorizontal, Loader2, Sparkles, X, ChevronRight } from "lucide-react";
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
import { NoSalonsInArea } from "@/components/location/NoSalonsInArea";
import { CustomerTutorial } from "@/components/onboarding/CustomerTutorial";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSalonOpenStatus } from "@/hooks/useSalonOpenStatus";
import { useCustomer } from "@/contexts/CustomerContext";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateDistance, formatDistance } from "@/lib/locationUtils";
import { MAX_BOOKING_DISTANCE_KM, NEARBY_FILTER_DISTANCE_KM } from "@/lib/locationConfig";
import { cn } from "@/lib/utils";

interface StylistQueueData {
  id: string;
  name: string;
  avatar_url: string | null;
  queueCount: number;
}

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
  stylists?: StylistQueueData[];
}

interface SalonWithDistance extends SalonData {
  distance: number | null;
  distanceText: string;
  isWithinRange: boolean;
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
  const { customerProfile } = useCustomer();
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return sessionStorage.getItem("profile_banner_dismissed") === "true";
  });

  // Calculate profile completeness
  const completeness = useMemo(() => {
    if (!user || !customerProfile) return 0;
    let score = 0;
    if (customerProfile.first_name?.trim()) score += 20;
    if (customerProfile.last_name?.trim()) score += 20;
    if (customerProfile.phone?.trim()) score += 20;
    if (customerProfile.address?.trim()) score += 20;
    if (customerProfile.avatar_url?.trim()) score += 20;
    return score;
  }, [user, customerProfile]);

  const showCompletenessBanner = user && completeness < 100 && !isBannerDismissed;

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    sessionStorage.setItem("profile_banner_dismissed", "true");
  };

  // Show location dialog on mount if no location is set
  useEffect(() => {
    const dismissed = sessionStorage.getItem("location_dialog_dismissed");
    if (!hasLocation && !dismissed) {
      setShowLocationDialog(true);
    }
  }, [hasLocation]);

  const filterTabs = ["All", "Open Now", "Nearby", "Quick Service"];

  // Fetch salons from database
  const fetchSalons = async () => {
    try {
      setLoadingSalons(true);
      
      // Query salons with their services, queue information, and staff
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
          ),
          salon_staff(
            id,
            name,
            avatar_url,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (salonsError) {
        console.error('Error fetching salons:', salonsError);
        toast.error('Failed to load salons: ' + salonsError.message);
        return;
      }

      // Get active queue counts for each salon securely bypassing RLS
      const salonIds = salonsData?.map(salon => salon.id) || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      const { data: queueData, error: queueError } = await supabase.rpc('get_active_salon_queues', {
        p_salon_ids: salonIds,
        p_date_start: todayStart
      });

      if (queueError) {
        console.error('Error fetching active salon queues:', queueError);
      }

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
        
        // Calculate queue count per stylist
        const activeStaff = salon.salon_staff?.filter((s: any) => s.is_active) || [];
        const stylists: StylistQueueData[] = activeStaff.map((s: any) => {
          const stylistQueueCount = queueData?.filter(q => q.salon_id === salon.id && q.staff_id === s.id).length || 0;
          return {
            id: s.id,
            name: s.name,
            avatar_url: s.avatar_url,
            queueCount: stylistQueueCount
          };
        });
        
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
          stylists
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

  useEffect(() => {
    fetchSalons();

    // Set up real-time subscription for queue updates on home page
    const channel = supabase
      .channel('home-queue-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => {
          // Refetch to update all queue numbers instantly
          fetchSalons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      let isWithinRange = false;

      if (hasLocation && userLat && userLng && salon.latitude && salon.longitude) {
        distance = calculateDistance(userLat, userLng, salon.latitude, salon.longitude);
        distanceText = formatDistance(distance);
        isWithinRange = distance <= MAX_BOOKING_DISTANCE_KM;
      } else if (!hasLocation) {
        distanceText = "Enable location";
        // If no location set, we can't determine range - allow viewing but not booking
        isWithinRange = false;
      }

      return { ...salon, distance, distanceText, isWithinRange };
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
  // When user has location enabled, only show salons within booking range by default
  const filteredSalons = salonsWithDistance.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         salon.primaryService.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // If user has location, only show salons within MAX_BOOKING_DISTANCE_KM
    if (hasLocation && salon.distance !== null) {
      if (salon.distance > MAX_BOOKING_DISTANCE_KM) return false;
    }
    
    switch (activeFilter) {
      case "Open Now":
        return true;
      case "Nearby": 
        return salon.distance !== null && salon.distance <= NEARBY_FILTER_DISTANCE_KM;
      case "Quick Service":
        return salon.queueCount <= 3;
      default:
        return true;
    }
  });

  // Check if there are any salons within range (for showing "no salons" message)
  const hasSalonsInRange = hasLocation 
    ? salonsWithDistance.some(s => s.distance !== null && s.distance <= MAX_BOOKING_DISTANCE_KM)
    : salons.length > 0;

  return (
    <CustomerLayout
      headerProps={{
        leftContent: <div data-tour="location-selector"><LocationSelector compact /></div>,
        showBackButton: false,
        showProfile: true,
        showNotifications: true,
        onProfileClick: handleProfileClick
      }}
    >
      {/* Customer Tutorial */}
      <CustomerTutorial />

      {/* Profile Completeness Banner */}
      {showCompletenessBanner && (
        <div className="mx-4 mt-4 relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 p-4 shadow-sm backdrop-blur-md">
          {/* Subtle background glow decorator */}
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />
          
          <div className="flex items-start gap-3">
            {/* Sparkles icon representing improvement */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground tracking-tight">
                  Unlock faster check-ins!
                </h4>
                <button 
                  onClick={handleDismissBanner}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pr-6">
                Your profile is only <span className="font-bold text-indigo-600">{completeness}%</span> complete. Set up your details to secure instant queue spots.
              </p>

              {/* Progress and CTA action block */}
              <div className="pt-2 flex items-center gap-4">
                <Progress value={completeness} className="h-1.5 flex-1 bg-muted/60" />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => navigate("/profile/edit")}
                  className="h-7 px-2.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold gap-0.5 rounded-lg border border-indigo-100 bg-white shadow-sm"
                >
                  Complete Setup
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters Section */}
      <div className="bg-card border-b border-border p-4">
        {/* Search Bar */}
        <div className="relative mb-4" data-tour="search-bar">
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
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2" data-tour="filter-tabs">
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
                <SalonLoader size="sm" />
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
            filteredSalons.map((salon, index) => (
              <div key={salon.id} data-tour={index === 0 ? "salon-card" : undefined}>
                <SalonCard
                  salon={salon}
                  user={user}
                  onNavigate={(salonId) => navigate(`/salon/${salonId}`)}
                  onAuthRequired={() => setAuthSheetOpen(true)}
                />
              </div>
            ))
          )}
        </div>

        {!loadingSalons && filteredSalons.length === 0 && (
          hasLocation && !hasSalonsInRange ? (
            <NoSalonsInArea />
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No salons found matching your search" : "No salons available"}
              </p>
            </div>
          )
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