import { MapPin, ChevronDown, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useState } from "react";

export function LocationSelector() {
  const [open, setOpen] = useState(false);
  const { area, address, loading, error, permissionDenied, refreshLocation, hasLocation } =
    useUserLocation();

  const handleGetLocation = async () => {
    await refreshLocation();
    if (!error) {
      setOpen(false);
    }
  };

  const displayArea = hasLocation ? area || "Your Location" : "Set Location";
  const displayAddress = hasLocation ? address : "Tap to detect your location";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="flex items-center cursor-pointer">
          <MapPin className="h-4 w-4 mr-2 text-primary" />
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-semibold text-foreground">{displayArea}</span>
              <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{displayAddress}</p>
          </div>
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Choose your location</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-4">
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
