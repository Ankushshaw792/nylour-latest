import { useState, useEffect } from "react";
import { Navigation, Search, Loader2, MapPin, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSalonLocation } from "@/hooks/useSalonLocation";

interface SalonLocationPickerProps {
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (data: {
    address: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
  }) => void;
}

export function SalonLocationPicker({
  address,
  city,
  latitude,
  longitude,
  onChange,
}: SalonLocationPickerProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    loading,
    permissionDenied,
    detectCurrentLocation,
    searchLocation,
    selectSearchResult,
    searchResults,
    searching,
    clearSearchResults,
    hasLocation,
  } = useSalonLocation({ latitude, longitude, address, city });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchLocation(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocation]);

  const handleDetectLocation = async () => {
    const result = await detectCurrentLocation();
    if (result) {
      onChange({
        address: result.address,
        city: result.city,
        latitude: result.latitude,
        longitude: result.longitude,
      });
    }
  };

  const handleSelectResult = (result: any) => {
    const data = selectSearchResult(result);
    onChange({
      address: data.address,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
    });
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleToggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery("");
      clearSearchResults();
    }
  };

  const displayHasLocation = latitude !== null && longitude !== null;

  return (
    <div className="space-y-3">
      {/* Use Current Location Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-3 h-14"
        onClick={handleDetectLocation}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <Navigation className="h-5 w-5 text-primary" />
        )}
        <div className="text-left">
          <p className="font-medium">Use Current Location</p>
          <p className="text-xs text-muted-foreground">
            {loading ? "Detecting location..." : "Detect via GPS"}
          </p>
        </div>
      </Button>

      {/* Search Location Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-3 h-14"
        onClick={handleToggleSearch}
      >
        <Edit3 className="h-5 w-5 text-primary" />
        <div className="text-left">
          <p className="font-medium">Search Location</p>
          <p className="text-xs text-muted-foreground">
            Enter area, city or pincode
          </p>
        </div>
      </Button>

      {/* Search Input */}
      {showSearch && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter area, city or pincode"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                >
                  <p className="font-medium text-sm text-foreground line-clamp-1">
                    {result.address?.suburb ||
                      result.address?.neighbourhood ||
                      result.address?.village ||
                      result.display_name.split(",")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {result.display_name}
                  </p>
                </button>
              ))}
            </div>
          )}

          {searchQuery && !searching && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No locations found
            </p>
          )}
        </div>
      )}

      {/* Permission Denied Error */}
      {permissionDenied && (
        <p className="text-sm text-destructive text-center">
          Location permission denied. Please enable it in your browser settings.
        </p>
      )}

      {/* Current Location Display */}
      {displayHasLocation && (
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{address || "Location set"}</p>
              <p className="text-xs text-muted-foreground">{city}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Coordinates: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
