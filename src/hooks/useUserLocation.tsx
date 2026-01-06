import { useState, useCallback, useEffect } from "react";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string;
  area: string;
  city: string;
  pincode: string;
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
  };
}

const LOCATION_STORAGE_KEY = "user_location";

const getInitialLocation = (): LocationState => {
  const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { ...parsed, loading: false, error: null, permissionDenied: false };
    } catch {
      // Ignore parse errors
    }
  }
  return {
    latitude: null,
    longitude: null,
    address: "",
    area: "",
    city: "",
    pincode: "",
    loading: false,
    error: null,
    permissionDenied: false,
  };
};

export function useUserLocation() {
  const [location, setLocation] = useState<LocationState>(getInitialLocation);
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
      const fullAddress = `${city}${pincode ? `, ${pincode}` : ""}`;
      
      return { area, city, pincode, address: fullAddress };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return { area: "Unknown Area", city: "", pincode: "", address: "" };
    }
  };

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }));
      return;
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

      localStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify({
          latitude,
          longitude,
          ...geocoded,
        })
      );
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

  const setManualLocation = useCallback((result: SearchResult) => {
    const addr = result.address || {};
    const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || "";
    const city = addr.city || addr.state_district || addr.county || "";
    const pincode = addr.postcode || "";
    const fullAddress = `${city}${pincode ? `, ${pincode}` : ""}`;

    const newLocation = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      area: area || result.display_name.split(",")[0],
      city,
      pincode,
      address: fullAddress || result.display_name,
      loading: false,
      error: null,
      permissionDenied: false,
    };

    setLocation(newLocation);
    setSearchResults([]);

    localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        area: newLocation.area,
        city: newLocation.city,
        pincode: newLocation.pincode,
        address: newLocation.address,
      })
    );
  }, []);

  const clearLocation = useCallback(() => {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    setLocation({
      latitude: null,
      longitude: null,
      address: "",
      area: "",
      city: "",
      pincode: "",
      loading: false,
      error: null,
      permissionDenied: false,
    });
    setSearchResults([]);
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    ...location,
    refreshLocation: getCurrentLocation,
    clearLocation,
    searchLocation,
    setManualLocation,
    searchResults,
    searching,
    clearSearchResults,
    hasLocation: location.latitude !== null && location.longitude !== null,
  };
}
