import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Clock, ChevronDown, Mic, Filter, SlidersHorizontal, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  distance: string;
}

const NearbySalons = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [salons, setSalons] = useState<SalonData[]>([]);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const filterTabs = ["All", "Open Now", "Nearby", "Quick Service"];

  // Fetch salons from database
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        setLoadingSalons(true);
        
        // Query salons with their services and queue information
        const { data: salonsData, error: salonsError } = await supabase
          .from('salons_public')
          .select(`
            id,
            name,
            address,
            image_url,
            salon_services (
              price,
              services (
                name
              )
            )
          `)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (salonsError) {
          console.error('Error fetching salons:', salonsError);
          toast.error('Failed to load salons');
          return;
        }

        // Get queue counts for each salon
        const salonIds = salonsData?.map(salon => salon.id) || [];
        const { data: queueData } = await supabase
          .from('queue_entries')
          .select('salon_id, status')
          .in('salon_id', salonIds)
          .eq('status', 'waiting');

        // Process salon data with queue counts and service info
        const processedSalons: SalonData[] = salonsData?.map(salon => {
          const queueCount = queueData?.filter(q => q.salon_id === salon.id).length || 0;
          const avgWaitTime = Math.max(15, queueCount * 20); // Estimate 20 min per person, min 15 min
          const waitTimeRange = `${avgWaitTime}-${avgWaitTime + 10} mins`;
          
          // Get primary service and price
          const primarySalonService = salon.salon_services?.[0];
          const primaryService = primarySalonService?.services?.name || "Haircut";
          const servicePrice = `₹${primarySalonService?.price || 200}`;
          
          return {
            id: salon.id,
            name: salon.name,
            address: salon.address,
            image_url: salon.image_url,
            phone: 'Contact salon for phone number', // Phone now protected
            queueCount,
            waitTime: waitTimeRange,
            primaryService,
            servicePrice,
            rating: Math.round((4.5 + Math.random() * 0.8) * 10) / 10, // Mock rating for now
            distance: `${(Math.random() * 2 + 0.5).toFixed(1)} km` // Mock distance for now
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

  const handleAvatarClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      setAuthSheetOpen(true);
    }
  };

  // Filter salons based on search and active filter
  const filteredSalons = salons.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         salon.primaryService.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case "Open Now":
        return true; // All salons are considered open for now
      case "Nearby": 
        return parseFloat(salon.distance) <= 1.0; // Within 1km
      case "Quick Service":
        return salon.queueCount <= 3; // 3 or fewer people in queue
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border p-4">
        {/* Top Section with Location and Profile */}
        <div className="flex items-center justify-between mb-4">
          {/* Location Selector */}
          <div className="flex-1">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => setIsLocationOpen(!isLocationOpen)}
            >
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-semibold text-foreground">Kankarbagh</span>
                  <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Patna, Bihar 800020</p>
              </div>
            </div>
          </div>

          {/* Profile */}
          <Avatar 
            className="h-8 w-8 cursor-pointer ring-2 ring-border hover:ring-primary transition-all"
            onClick={handleAvatarClick}
          >
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">
              {user ? 
                `${user.user_metadata?.first_name?.[0] || ''}${user.user_metadata?.last_name?.[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
                : 'U'
              }
            </AvatarFallback>
          </Avatar>
        </div>

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
              <Card
                key={salon.id}
                className="overflow-hidden rounded-xl border border-border hover:shadow-lg transition-all duration-300 cursor-pointer bg-white card-hover"
                onClick={() => {
                  if (user) {
                    navigate(`/salon/${salon.id}`);
                  } else {
                    setAuthSheetOpen(true);
                  }
                }}
              >
                <CardContent className="p-0">
                  {/* Salon Image */}
                  <div className="relative h-48 bg-muted">
                    <img
                      src={salon.image_url || "/placeholder.svg"}
                      alt={salon.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{salon.rating}</span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-foreground font-medium"
                    >
                      {salon.queueCount} in queue
                    </Badge>
                  </div>

                  {/* Salon Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{salon.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {salon.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-primary font-medium">{salon.waitTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{salon.distance}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div>
                        <p className="text-sm text-muted-foreground">{salon.primaryService}</p>
                        <p className="text-lg font-semibold text-primary">{salon.servicePrice}</p>
                      </div>
                      <Button size="sm" className="ml-4">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
    </div>
  );
};

export default NearbySalons;