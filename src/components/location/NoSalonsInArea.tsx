import { useState, useEffect } from "react";
import { MapPinOff, MapPin, ArrowRight, Navigation, Loader2, Edit3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NO_SALONS_MESSAGE, NO_SALONS_SUB_MESSAGE } from "@/lib/locationConfig";
import { useUserLocation } from "@/hooks/useUserLocation";

interface NoSalonsInAreaProps {
  className?: string;
}

export const NoSalonsInArea = ({ className }: NoSalonsInAreaProps) => {
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    loading,
    permissionDenied,
    refreshLocation,
    searchLocation,
    setManualLocation,
    searchResults,
    searching,
    clearSearchResults,
  } = useUserLocation();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchLocation(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocation]);

  const handleGetLocation = async () => {
    await refreshLocation();
    setShowLocationOptions(false);
  };

  const handleSelectResult = (result: any) => {
    setManualLocation(result);
    setSearchQuery("");
    setShowSearch(false);
    setShowLocationOptions(false);
  };

  const handleChangeLocation = () => {
    setShowLocationOptions(true);
    setShowSearch(false);
    setSearchQuery("");
    clearSearchResults();
  };

  const handleBack = () => {
    setShowLocationOptions(false);
    setShowSearch(false);
    setSearchQuery("");
    clearSearchResults();
  };

  if (showLocationOptions) {
    return (
      <Card className={className}>
        <CardContent className="py-8 px-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Change Location</h3>
              <Button variant="ghost" size="sm" onClick={handleBack}>
                Back
              </Button>
            </div>

            {/* Use Current Location */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={handleGetLocation}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Navigation className="h-5 w-5 text-primary" />
              )}
              <div className="text-left">
                <p className="font-medium">Use current location</p>
                <p className="text-xs text-muted-foreground">
                  {loading ? "Detecting location..." : "Enable GPS to detect"}
                </p>
              </div>
            </Button>

            {/* Enter Manually */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Edit3 className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Enter Manually</p>
                <p className="text-xs text-muted-foreground">
                  Search for your location
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
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        onClick={() => handleSelectResult(result)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-medium text-sm text-foreground line-clamp-1">
                          {result.address?.suburb || result.address?.neighbourhood || result.address?.village || result.display_name.split(",")[0]}
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

            {permissionDenied && (
              <p className="text-sm text-destructive text-center">
                Location permission denied. Please enable it in your browser settings.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="py-12 px-6 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPinOff className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {NO_SALONS_MESSAGE}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
          {NO_SALONS_SUB_MESSAGE}
        </p>

        <Button 
          variant="outline" 
          onClick={handleChangeLocation}
          className="gap-2"
        >
          <MapPin className="h-4 w-4" />
          Change Location
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
