import { MapPin, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { SalonStatusBadge } from "@/components/salon/SalonStatusBadge";
import { useSalonOpenStatus } from "@/hooks/useSalonOpenStatus";
import { cn } from "@/lib/utils";
import { MAX_BOOKING_DISTANCE_KM } from "@/lib/locationConfig";

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
  distance?: number | null;
  isWithinRange?: boolean;
}

interface SalonCardProps {
  salon: SalonData;
  user: any;
  onNavigate: (salonId: string) => void;
  onAuthRequired: () => void;
}

export const SalonCard = ({ salon, user, onNavigate, onAuthRequired }: SalonCardProps) => {
  const { isOpen, isLoading, nextOpenInfo } = useSalonOpenStatus(salon.id);
  
  // Check if salon is within booking range
  const isOutOfRange = salon.distance !== null && 
                       salon.distance !== undefined && 
                       salon.distance > MAX_BOOKING_DISTANCE_KM;
  const canBook = !isLoading && isOpen && !isOutOfRange;

  const handleClick = () => {
    if (user) {
      onNavigate(salon.id);
    } else {
      onAuthRequired();
    }
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canBook) return; // Don't allow booking if closed or out of range
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
              <span className={cn(
                "text-sm",
                isOutOfRange ? "text-destructive font-medium" : "text-muted-foreground"
              )}>
                {salon.distanceText}
                {isOutOfRange && " (too far)"}
              </span>
            </div>
          </div>

          {/* Out of range warning */}
          {isOutOfRange && (
            <div className="flex items-center gap-2 text-destructive text-xs mb-3 p-2 bg-destructive/10 rounded-md">
              <AlertTriangle className="h-3 w-3" />
              <span>Outside {MAX_BOOKING_DISTANCE_KM} km booking range</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{salon.primaryService}</p>
              <p className="text-lg font-bold text-foreground">{salon.servicePrice}</p>
            </div>
            <Button
              size="sm"
              className={cn(
                "bg-primary hover:bg-primary/90 text-primary-foreground",
                !canBook && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleBookClick}
              disabled={!canBook}
            >
              {!isLoading && !isOpen ? "Closed" : isOutOfRange ? "Too Far" : "Book Now"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
