import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Clock, ChevronDown, Mic, Bookmark, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const navigate = useNavigate();

  const filteredSalons = mockSalons.filter(salon =>
    salon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero p-4 text-white">
        {/* Top Section with Location and Profile */}
        <div className="flex items-center justify-between mb-4">
          {/* Location Selector */}
          <div className="flex-1">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => setIsLocationOpen(!isLocationOpen)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-semibold">Kankarbagh</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
                <p className="text-xs text-white/80">Patna, Bihar 800020</p>
              </div>
            </div>
          </div>

          {/* Profile */}
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>

        {/* Nylour Title */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">Nylour</h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search for salon, service or more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-12 bg-white/20 border-white/20 text-white placeholder:text-white/70"
          />
          <Mic className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4 cursor-pointer" />
        </div>
      </div>

      {/* Salons List */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">Nearby Salons</span>
        </div>

        {filteredSalons.map((salon) => (
          <Card
            key={salon.id}
            className="overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
            onClick={() => navigate(`/salon/${salon.id}`)}
          >
            <CardContent className="p-0">
              {/* Hero Image Section */}
              <div className="relative">
                <img
                  src={salon.image}
                  alt={salon.name}
                  className="w-full h-48 object-cover"
                />
                
                {/* Service & Price Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-white/90 text-foreground font-medium">
                    {salon.primaryService} • {salon.servicePrice}
                  </Badge>
                </div>
                
                {/* Action Icons */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <Bookmark className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <Bell className="h-4 w-4 text-foreground" />
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4">
                {/* Salon Name and Rating */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-foreground">{salon.name}</h3>
                  <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3 fill-green-600 text-green-600" />
                    <span className="text-xs font-bold text-green-700">{salon.rating}</span>
                  </div>
                </div>

                {/* Address */}
                <p className="text-sm text-muted-foreground mb-3">{salon.address}</p>

                {/* Time, Distance and Queue */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      {salon.waitTime} • {salon.distance}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {salon.queueCount} in queue
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSalons.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No salons found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbySalons;