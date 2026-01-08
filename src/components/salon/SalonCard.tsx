import { MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { SalonStatusBadge } from "@/components/salon/SalonStatusBadge";
import { useSalonOpenStatus } from "@/hooks/useSalonOpenStatus";
import { cn } from "@/lib/utils";

interface SalonData {
  id: string;
  name: string;
  address: string;
  image_url: string | null;
  queueCount: number;
  waitTime: string;
  primaryService: string;
  servicePrice: string;
  distanceText: string;
}

interface SalonCardProps {
  salon: SalonData;
  user: any;
  onNavigate: (salonId: string) => void;
  onAuthRequired: () => void;
}

export const SalonCard = ({ salon, user, onNavigate, onAuthRequired }: SalonCardProps) => {
  const { isOpen, isLoading, nextOpenInfo } = useSalonOpenStatus(salon.id);

  const handleClick = () => {
    if (user) {
      onNavigate(salon.id);
    } else {
      onAuthRequired();
    }
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) return; // Don't allow booking if closed
    if (user) {
      onNavigate(salon.id);
    } else {
      onAuthRequired();
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-xl border border-border hover:shadow-lg transition-all duration-300 cursor-pointer bg-white card-hover",
        !isLoading && !isOpen && "grayscale opacity-70"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Salon Image */}
        <div className="relative h-48 bg-muted">
          <img
            src={salon.image_url || "/placeholder.svg"}
            alt={`${salon.name} salon exterior view - ${salon.address}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <FavoriteButton salonId={salon.id} size="sm" />
          </div>
          <Badge 
            variant="secondary" 
            className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-foreground font-medium"
          >
            {salon.queueCount} in queue
          </Badge>
          
          {/* Closed overlay */}
          {!isLoading && !isOpen && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-white/95 px-4 py-2 rounded-lg text-center">
                <p className="font-semibold text-foreground">Closed</p>
                {nextOpenInfo && (
                  <p className="text-xs text-muted-foreground">{nextOpenInfo}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Salon Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">{salon.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {salon.address}
              </p>
            </div>
            <SalonStatusBadge salonId={salon.id} />
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">{salon.waitTime}</span>
              </div>
              <span className="text-muted-foreground text-sm">{salon.distanceText}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{salon.primaryService}</p>
              <p className="text-lg font-bold text-foreground">{salon.servicePrice}</p>
            </div>
            <Button
              size="sm"
              className={cn(
                "bg-primary hover:bg-primary/90 text-primary-foreground",
                !isLoading && !isOpen && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleBookClick}
              disabled={!isLoading && !isOpen}
            >
              {!isLoading && !isOpen ? "Closed" : "Book Now"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
