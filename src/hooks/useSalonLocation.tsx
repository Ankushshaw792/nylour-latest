import { useState, useCallback } from "react";

interface SalonLocationState {
  latitude: number | null;
  longitude: number | null;
  address: string;
  area: string;
  city: string;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    suburb?: string;
    neighbourhood?: string;
    village?: string;
    town?: string;
    city?: string;
    state_district?: string;
    county?: string;
    postcode?: string;
    road?: string;
    house_number?: string;
  };
}

export function useSalonLocation(initialData?: {
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
}) {
  const [location, setLocation] = useState<SalonLocationState>({
    latitude: initialData?.latitude ?? null,
    longitude: initialData?.longitude ?? null,
    address: initialData?.address ?? "",
    area: "",
    city: initialData?.city ?? "",
    loading: false,
    error: null,
    permissionDenied: false,
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            "User-Agent": "NylourApp/1.0",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }
      
      const data = await response.json();
      const addr = data.address || {};
      
      const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || "";
      const city = addr.city || addr.state_district || addr.county || "";
      const pincode = addr.postcode || "";
      const road = addr.road || "";
      const houseNumber = addr.house_number || "";
      
      const addressParts = [houseNumber, road, area].filter(Boolean);
      const fullAddress = addressParts.join(", ") + (pincode ? `, ${pincode}` : "");
      
      return { area, city, address: fullAddress || data.display_name };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return { area: "", city: "", address: "" };
    }
  };

  const detectCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }));
      return null;
    }

    setLocation((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      const geocoded = await reverseGeocode(latitude, longitude);

      const newLocation = {
        latitude,
        longitude,
        ...geocoded,
        loading: false,
        error: null,
        permissionDenied: false,
      };

      setLocation(newLocation);

      return {
        latitude,
        longitude,
        address: geocoded.address,
        city: geocoded.city,
      };
    } catch (error: any) {
      const isPermissionDenied = error?.code === 1;
      setLocation((prev) => ({
        ...prev,
        loading: false,
        permissionDenied: isPermissionDenied,
        error: isPermissionDenied
          ? "Location permission denied"
          : "Failed to get location",
      }));
      return null;
    }
  }, []);

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`,
        {
          headers: {
            "User-Agent": "NylourApp/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: SearchResult[] = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Location search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const selectSearchResult = useCallback((result: SearchResult) => {
    const addr = result.address || {};
    const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || "";
    const city = addr.city || addr.state_district || addr.county || "";
    const pincode = addr.postcode || "";
    const road = addr.road || "";
    
    const addressParts = [road, area].filter(Boolean);
    const fullAddress = addressParts.join(", ") + (pincode ? `, ${pincode}` : "");

    const newLocation = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      area: area || result.display_name.split(",")[0],
      city,
      address: fullAddress || result.display_name,
      loading: false,
      error: null,
      permissionDenied: false,
    };

    setLocation(newLocation);
    setSearchResults([]);

    return {
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      address: newLocation.address,
      city: newLocation.city,
    };
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    ...location,
    detectCurrentLocation,
    searchLocation,
    selectSearchResult,
    searchResults,
    searching,
    clearSearchResults,
    hasLocation: location.latitude !== null && location.longitude !== null,
  };
}
