"use client";

import { useState, useEffect, useCallback } from "react";

export interface NearbyPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  address?: string;
  phone?: string;
  type: "hospital" | "police" | "mechanic";
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    "addr:full"?: string;
    "addr:street"?: string;
    "addr:city"?: string;
    phone?: string;
    "contact:phone"?: string;
  };
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useNearbyPlaces(
  userLat: number | null,
  userLon: number | null,
  type: "hospital" | "police" | "mechanic",
  radiusKm: number = 10
) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    if (userLat === null || userLon === null) return;

    setLoading(true);
    setError(null);

    const radiusMeters = radiusKm * 1000;

    let query = "";
    if (type === "hospital") {
      query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${radiusMeters},${userLat},${userLon});
          way["amenity"="hospital"](around:${radiusMeters},${userLat},${userLon});
          node["amenity"="clinic"](around:${radiusMeters},${userLat},${userLon});
          way["amenity"="clinic"](around:${radiusMeters},${userLat},${userLon});
        );
        out center;
      `;
    } else if (type === "police") {
      query = `
        [out:json][timeout:25];
        (
          node["amenity"="police"](around:${radiusMeters},${userLat},${userLon});
          way["amenity"="police"](around:${radiusMeters},${userLat},${userLon});
        );
        out center;
      `;
    } else if (type === "mechanic") {
      query = `
        [out:json][timeout:25];
        (
          node["shop"="car_repair"](around:${radiusMeters},${userLat},${userLon});
          way["shop"="car_repair"](around:${radiusMeters},${userLat},${userLon});
          node["amenity"="car_repair"](around:${radiusMeters},${userLat},${userLon});
          way["amenity"="car_repair"](around:${radiusMeters},${userLat},${userLon});
          node["shop"="car"](around:${radiusMeters},${userLat},${userLon});
          way["shop"="car"](around:${radiusMeters},${userLat},${userLon});
        );
        out center;
      `;
    }

    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
        headers: {
          "Content-Type": "text/plain",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch nearby places");
      }

      const data = await response.json();

      const fetchedPlaces: NearbyPlace[] = data.elements
        .map((element: OverpassElement) => {
          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;

          if (!lat || !lon) return null;

          const distance = calculateDistance(userLat, userLon, lat, lon);

          const address =
            element.tags?.["addr:full"] ||
            [element.tags?.["addr:street"], element.tags?.["addr:city"]]
              .filter(Boolean)
              .join(", ") ||
            undefined;

          return {
            id: `${element.id}`,
            name: element.tags?.name || getDefaultName(type),
            lat,
            lon,
            distance,
            address,
            phone: element.tags?.phone || element.tags?.["contact:phone"],
            type,
          };
        })
        .filter(Boolean)
        .sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance)
        .slice(0, 10);

      setPlaces(fetchedPlaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch places");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [userLat, userLon, type, radiusKm]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  return { places, loading, error, refetch: fetchPlaces };
}

function getDefaultName(type: "hospital" | "police" | "mechanic"): string {
  switch (type) {
    case "hospital":
      return "Hospital/Clinic";
    case "police":
      return "Police Station";
    case "mechanic":
      return "Auto Repair Shop";
  }
}

export function useAllNearbyServices(
  userLat: number | null,
  userLon: number | null
) {
  const hospitals = useNearbyPlaces(userLat, userLon, "hospital", 15);
  const police = useNearbyPlaces(userLat, userLon, "police", 15);
  const mechanics = useNearbyPlaces(userLat, userLon, "mechanic", 10);

  return {
    hospitals: hospitals.places,
    police: police.places,
    mechanics: mechanics.places,
    loading: hospitals.loading || police.loading || mechanics.loading,
    error: hospitals.error || police.error || mechanics.error,
  };
}
