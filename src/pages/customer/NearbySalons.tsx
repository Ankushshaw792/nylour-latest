import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Mock data
const mockSalons = [
  {
    id: 1,
    name: "Style Studio",
    address: "123 Fashion Street, Downtown",
    rating: 4.8,
    waitTime: "15 min",
    queueCount: 3,
    image: "/placeholder.svg"
  },
  {
    id: 2,
    name: "Modern Cuts",
    address: "456 Trend Avenue, City Center",
    rating: 4.6,
    waitTime: "25 min",
    queueCount: 5,
    image: "/placeholder.svg"
  },
  {
    id: 3,
    name: "Luxury Hair Lounge",
    address: "789 Elite Road, Business District",
    rating: 4.9,
    waitTime: "30 min",
    queueCount: 7,
    image: "/placeholder.svg"
  },
];

const NearbySalons = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredSalons = mockSalons.filter(salon =>
    salon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero p-6 text-white">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Nylour</h1>
          <p className="text-white/90">Find and book nearby salons</p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search salons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/20 border-white/20 text-white placeholder:text-white/70"
          />
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
            className="card-hover cursor-pointer"
            onClick={() => navigate(`/salon/${salon.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Salon Image */}
                <div className="w-16 h-16 bg-gradient-card rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>

                {/* Salon Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{salon.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{salon.rating}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{salon.address}</p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">{salon.waitTime}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {salon.queueCount} in queue
                    </Badge>
                  </div>
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