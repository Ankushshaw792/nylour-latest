import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Loader2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { FavoriteButton } from "./FavoriteButton";

export const FavoritesList = () => {
  const navigate = useNavigate();
  const { favorites, loading } = useFavorites();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Favorite Salons</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Favorite Salons</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No favorite salons yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add salons to your favorites to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          Favorite Salons
          <Badge variant="secondary" className="text-xs">
            {favorites.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {favorites.map((favorite) => {
          const salon = favorite.salons;
          if (!salon) return null;

          return (
            <div
              key={favorite.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => navigate(`/salon/${salon.id}`)}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Salon Image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={salon.image_url || "/placeholder.svg"}
                    alt={`${salon.name} salon`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Salon Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">
                      {salon.name}
                    </h3>
                    {/* Status badge removed - is_online doesn't exist */}
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">
                      {salon.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Favorite Button */}
              <FavoriteButton salonId={salon.id} size="sm" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};