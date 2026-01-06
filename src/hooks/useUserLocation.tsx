import { useState, useEffect, useCallback } from "react";

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

const LOCATION_STORAGE_KEY = "user_location";

export function useUserLocation() {
  const [location, setLocation] = useState<LocationState>(() => {
    // Try to load from localStorage first
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
  });

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

      // Save to localStorage
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
  }, []);

  return {
    ...location,
    refreshLocation: getCurrentLocation,
    clearLocation,
    hasLocation: location.latitude !== null && location.longitude !== null,
  };
}
