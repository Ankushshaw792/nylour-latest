import { useState } from "react";
import { MapPin, Navigation, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserLocation } from "@/hooks/useUserLocation";
import { cn } from "@/lib/utils";

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationPermissionDialog({
  open,
  onOpenChange,
}: LocationPermissionDialogProps) {
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    refreshLocation,
    loading,
    searchLocation,
    searchResults,
    searching,
    setManualLocation,
    permissionDenied,
  } = useUserLocation();

  const handleEnableLocation = async () => {
    await refreshLocation();
    // Check if location was successfully obtained
    const stored = localStorage.getItem("user_location");
    if (stored) {
      sessionStorage.setItem("location_dialog_dismissed", "true");
      onOpenChange(false);
    }
  };

  const handleMaybeLater = () => {
    sessionStorage.setItem("location_dialog_dismissed", "true");
    onOpenChange(false);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 3) {
      searchLocation(query);
    }
  };

  const handleSelectLocation = (result: any) => {
    setManualLocation(result);
    sessionStorage.setItem("location_dialog_dismissed", "true");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-auto">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <AlertDialogTitle className="text-xl">
            Enable Location
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            To show you nearby salons and calculate accurate distances, we need
            access to your location.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!showManualSearch ? (
          <div className="space-y-3 mt-4">
            <Button
              onClick={handleEnableLocation}
              disabled={loading}
              className="w-full gap-2"
              size="lg"
            >
              <Navigation className="w-4 h-4" />
              {loading ? "Detecting Location..." : "Enable Location"}
            </Button>

            {permissionDenied && (
              <p className="text-sm text-destructive text-center">
                Location permission denied. Please enable it in your browser
                settings or enter manually.
              </p>
            )}

            <Button
              variant="outline"
              onClick={() => setShowManualSearch(true)}
              className="w-full gap-2"
              size="lg"
            >
              <Search className="w-4 h-4" />
              Enter Manually
            </Button>

            <button
              onClick={handleMaybeLater}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Maybe Later
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for your area, city or pincode..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {searching && (
              <p className="text-sm text-muted-foreground text-center">
                Searching...
              </p>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-1">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSelectLocation(result)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm",
                      "hover:bg-muted transition-colors",
                      "focus:outline-none focus:bg-muted"
                    )}
                  >
                    <span className="line-clamp-2">{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowManualSearch(false);
                  setSearchQuery("");
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                variant="ghost"
                onClick={handleMaybeLater}
                className="flex-1 text-muted-foreground"
              >
                Skip
              </Button>
            </div>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
