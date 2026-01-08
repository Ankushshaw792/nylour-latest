import { MapPin, ChevronDown, Navigation, Loader2, Edit3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useState, useEffect } from "react";

interface LocationSelectorProps {
  compact?: boolean;
}

export function LocationSelector({ compact = false }: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { 
    area, 
    address, 
    loading, 
    error, 
    permissionDenied, 
    refreshLocation, 
    hasLocation,
    searchLocation,
    setManualLocation,
    searchResults,
    searching,
    clearSearchResults
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
    if (!error) {
      setOpen(false);
    }
  };

  const handleSelectResult = (result: any) => {
    setManualLocation(result);
    setSearchQuery("");
    setShowSearch(false);
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setShowSearch(false);
      setSearchQuery("");
      clearSearchResults();
    }
  };

  const displayArea = hasLocation ? area || "Your Location" : "Set Location";
  const displayAddress = hasLocation ? address : "Tap to detect your location";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <div className="flex items-center cursor-pointer min-w-0">
          <MapPin className={compact ? "h-4 w-4 mr-1.5 text-primary flex-shrink-0" : "h-4 w-4 mr-2 text-primary flex-shrink-0"} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className={compact ? "font-semibold text-foreground text-sm truncate" : "font-semibold text-foreground truncate"}>{displayArea}</span>
              <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground flex-shrink-0" />
            </div>
            <p className={compact ? "text-[10px] text-muted-foreground truncate" : "text-xs text-muted-foreground truncate"}>{displayAddress}</p>
          </div>
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Choose your location</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-4">
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

          {hasLocation && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground">{area}</p>
              <p className="text-xs text-muted-foreground">{address}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
