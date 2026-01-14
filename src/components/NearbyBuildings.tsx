"use client";
import React, { useMemo } from "react";
import { FacilityStatus, FacilityType } from "@/types";
import { calculateDistance, formatDistance } from "@/utils/distance";

interface NearbyBuildingsProps {
  userLocation: [number, number] | null;
  facilityData: FacilityStatus | null;
  onBuildingClick: (id: string, type: FacilityType) => void;
}

interface NearbyFacility {
  id: string;
  name: string;
  type: FacilityType;
  distance: number;
  availableRooms: number;
  totalRooms: number;
  isOpen: boolean;
}

export default function NearbyBuildings({
  userLocation,
  facilityData,
  onBuildingClick,
}: NearbyBuildingsProps) {
  const nearbyFacilities = useMemo(() => {
    if (!userLocation || !facilityData?.facilities) return [];

    const [userLng, userLat] = userLocation;

    const facilitiesWithDistance: NearbyFacility[] = Object.entries(
      facilityData.facilities
    ).map(([id, facility]) => ({
      id: facility.id,
      name: facility.name,
      type: facility.type,
      distance: calculateDistance(
        userLat,
        userLng,
        facility.coordinates.latitude,
        facility.coordinates.longitude
      ),
      availableRooms: facility.roomCounts.available,
      totalRooms: facility.roomCounts.total,
      isOpen: facility.isOpen,
    }));

    // Sort by distance and take top 3
    return facilitiesWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [userLocation, facilityData]);

  if (!userLocation || nearbyFacilities.length === 0) {
    return null;
  }

  return (
    <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg overflow-hidden w-44">
      <div className="px-3 py-2 border-b border-border/50">
        <h3 className="text-xs font-semibold text-foreground/90">Nearby</h3>
      </div>
      <div className="divide-y divide-border/30">
        {nearbyFacilities.map((facility, index) => (
          <button
            key={facility.id}
            onClick={() => onBuildingClick(facility.id, facility.type)}
            className="w-full px-3 py-2 text-left hover:bg-accent/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {index + 1}. {facility.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistance(facility.distance)}
                </p>
              </div>
              <div className="flex-shrink-0">
                {facility.isOpen ? (
                  <span
                    className={`text-[10px] font-medium ${
                      facility.availableRooms > 0
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {facility.availableRooms}/{facility.totalRooms}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    Closed
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
