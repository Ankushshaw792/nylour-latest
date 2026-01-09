import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Store, Clock, Scissors, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIME_SLOTS = [
  "Morning (9AM - 12PM)",
  "Afternoon (12PM - 4PM)",
  "Evening (4PM - 8PM)",
  "No Preference",
];

const CustomerFavoritesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, loading: favoritesLoading, removeFromFavorites } = useFavorites();
  const [profile, setProfile] = useState<{
    favorite_services: string[] | null;
    preferred_time: string | null;
  }>({ favorite_services: null, preferred_time: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("customers")
        .select("favorite_services, preferred_time")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          favorite_services: data.favorite_services as string[] | null,
          preferred_time: data.preferred_time,
        });
      }
    };

    fetchProfile();
  }, [user]);

  const handleRemoveFavorite = async (salonId: string) => {
    await removeFromFavorites(salonId);
  };

  const handleUpdatePreferredTime = async (time: string) => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("customers")
        .update({ preferred_time: time, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, preferred_time: time }));
      toast.success("Preferred time updated");
    } catch (error) {
      console.error("Error updating preferred time:", error);
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Favorites</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Favorite Salons */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-5 w-5" />
              Favorite Salons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favoritesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Heart className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No favorite salons yet</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => navigate("/customer")}
                >
                  Browse Salons
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/salon/${fav.salon_id}`)}
                  >
                    <p className="font-medium text-sm">{fav.salons?.name || "Unknown Salon"}</p>
                    <p className="text-xs text-muted-foreground">{fav.salons?.address || ""}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveFavorite(fav.salon_id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Favorite Services */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Favorite Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!profile.favorite_services || profile.favorite_services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Scissors className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No favorite services set</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Services you book frequently will appear here
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.favorite_services.map((service, index) => (
                  <Badge key={index} variant="secondary" className="py-1.5 px-3">
                    {service}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferred Time */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Preferred Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={profile.preferred_time || ""}
              onValueChange={handleUpdatePreferredTime}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select preferred time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              We'll suggest slots matching your preference
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerFavoritesPage;
