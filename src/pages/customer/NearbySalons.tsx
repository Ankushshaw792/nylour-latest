import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Clock, ChevronDown, Mic, Filter, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { useAuth } from "@/contexts/AuthContext";

// Mock data
const mockSalons = [
  {
    id: 1,
    name: "Style Studio",
    address: "123 Fashion Street, Downtown", 
    rating: 4.8,
    waitTime: "15-25 mins",
    distance: "0.8 km",
    queueCount: 3,
    image: "/placeholder.svg",
    primaryService: "Haircut",
    servicePrice: "₹200"
  },
  {
    id: 2,
    name: "Modern Cuts", 
    address: "456 Trend Avenue, City Center",
    rating: 4.6,
    waitTime: "20-30 mins", 
    distance: "1.2 km",
    queueCount: 5,
    image: "/placeholder.svg",
    primaryService: "Hair Styling",
    servicePrice: "₹350"
  },
  {
    id: 3,
    name: "Luxury Hair Lounge",
    address: "789 Elite Road, Business District",
    rating: 4.9,
    waitTime: "25-35 mins",
    distance: "1.5 km", 
    queueCount: 7,
    image: "/placeholder.svg",
    primaryService: "Premium Cut", 
    servicePrice: "₹500"
  },
];

const NearbySalons = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const filterTabs = ["All", "Open Now", "Nearby", "Quick Service"];

  const handleAvatarClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      setAuthSheetOpen(true);
    }
  };

  const filteredSalons = mockSalons.filter(salon =>
    salon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <span className="text-sm font-medium text-foreground">{filteredSalons.length} salons found</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Sort
          </Button>
        </div>

        {/* Salon Cards */}
        <div className="space-y-3">
          {filteredSalons.map((salon) => (
            <Card
              key={salon.id}
              className="overflow-hidden rounded-xl border border-border hover:shadow-md transition-all duration-300 cursor-pointer bg-white"
              onClick={() => {
                if (user) {
                  navigate(`/salon/${salon.id}`);
                } else {
                  setAuthSheetOpen(true);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Salon Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={salon.image}
                      alt={salon.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Salon Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-foreground text-sm leading-tight">{salon.name}</h3>
                      <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
                        <Star className="h-3 w-3 fill-green-600 text-green-600" />
                        <span className="text-xs font-medium text-green-700">{salon.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{salon.address}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary" />
                          <span className="text-primary font-medium">{salon.waitTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{salon.distance}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {salon.queueCount} queue
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{salon.primaryService}</span>
                      <span className="text-sm font-semibold text-primary">{salon.servicePrice}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSalons.length === 0 && (
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