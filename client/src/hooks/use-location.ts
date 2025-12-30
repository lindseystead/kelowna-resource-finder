/**
 * @fileoverview User location hook
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * React hook for requesting and managing user's geolocation with permission handling.
 */

import { useState, useCallback, useRef } from "react";

interface UserLocation {
  lat: number;
  lng: number;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const requestInFlightRef = useRef(false);

  const requestLocation = useCallback(async () => {
    // Prevent concurrent location requests
    if (requestInFlightRef.current) {
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    // Check permission state first (if Permissions API is available)
    let permissionState: PermissionState | null = null;
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        permissionState = result.state;
        
        // If already denied, don't try to request
        if (permissionState === 'denied') {
          setPermissionDenied(true);
          setError("Location permission denied. Please enable location access in your browser settings.");
          setLoading(false);
          return;
        }
      } catch (e) {
        // Permissions API might not be fully supported, continue with request
      }
    }

    requestInFlightRef.current = true;
    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    setHasRequested(true);

    // Browser will automatically show permission prompt if needed
    navigator.geolocation.getCurrentPosition(
      (position) => {
        requestInFlightRef.current = false;
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
        setError(null);
        setPermissionDenied(false);
      },
      (err) => {
        requestInFlightRef.current = false;
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError("Location permission denied. Please enable location access in your browser settings.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Location information unavailable.");
        } else if (err.code === err.TIMEOUT) {
          setError("Location request timed out. Please try again.");
        } else {
          setError(err.message || "Failed to get location");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Always get fresh location
      }
    );
  }, []);

  return { 
    location, 
    error, 
    loading, 
    permissionDenied,
    hasRequested,
    requestLocation 
  };
}
