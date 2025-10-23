"use client";
import React from "react";
import { useRef, useEffect, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { MarkerData, MapProps, FacilityType } from "@/types";
import { formatTime } from "@/utils/format";

export default function FacilityMap({
  facilityData,
  onMarkerClick,
  onMapLoaded,
}: MapProps) {
  const DEFAULT_CENTER: [number, number] = [-118.44218401034593, 34.07097491919498];
  const DEFAULT_ZOOM = 16.5;
  const DEFAULT_PITCH = 25;
  const DEFAULT_BEARING = 0;

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  const handleMarkerClick = useCallback(
    (id: string, type: FacilityType) => {
      onMarkerClick(id, type);
    },
    [onMarkerClick],
  );

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<
    Map<string, { marker: maplibregl.Marker; data: MarkerData }>
  >(new Map());
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapContainerEl = mapContainer.current;
    map.current = new maplibregl.Map({
      container: mapContainerEl,
      style: "/map/style.json",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      maxPitch: 60,
      bearing: DEFAULT_BEARING,
      antialias: true,
      minZoom: 15.2,
      attributionControl: false,
    });

    const handleResize = () => {
      if (map.current) {
        map.current.resize();
        const width = mapContainer.current?.clientWidth || 0;
        map.current.setLayoutProperty(
          "building_labels",
          "text-size",
          width < 768 ? 8 : 12,
        );

        if (width >= 768 && !map.current.hasControl(attributionControl)) {
          map.current.addControl(attributionControl);
        } else if (width < 768 && map.current.hasControl(attributionControl)) {
          map.current.removeControl(attributionControl);
        }
      }
    };

    map.current.on("load", () => {
      setIsMapLoaded(true);
      if (onMapLoaded) {
        onMapLoaded();
      }
      handleResize();
      // Set initial 10-degree tilt for 3D effect
      map.current!.setPitch(DEFAULT_PITCH);
      map.current!.setSky({
        "sky-color": "#192c4a",
        "sky-horizon-blend": 0.9,
        "horizon-color": "#fbe7b6",
        "horizon-fog-blend": 0.3,
      });
    });

    window.addEventListener("resize", handleResize);

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl({
      showCompass: false,
      visualizePitch: true
    }));
    
    // Add attribution control
    const attributionControl = new maplibregl.AttributionControl({
        compact: window.innerWidth < 768,
    });

    if (window.innerWidth >= 768) {
        map.current.addControl(attributionControl);
    }

    // Add geolocation control and track user location
    const geolocateControl = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    });
    
    geolocateControl.on('geolocate', (e: any) => {
      setUserLocation([e.coords.longitude, e.coords.latitude]);
    });
    
    map.current.addControl(geolocateControl);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onMapLoaded]);

  useEffect(() => {
    if (!map.current || !isMapLoaded || !facilityData) return;

    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }

    const createMarkerElement = (data: MarkerData, isMobile: boolean) => {
      const markerEl = document.createElement("div");
      const markerSize = isMobile ? "15px" : "12px";
      
      markerEl.style.width = markerSize;
      markerEl.style.height = markerSize;
      markerEl.style.borderRadius = "50%";
      markerEl.style.cursor = "pointer";

      // Get status-based styling with white border trim
      if (!data.isOpen) {
        markerEl.className = "h-3 w-3 rounded-full cursor-pointer bg-gray-400 shadow-[0px_0px_4px_2px_rgba(156,163,175,0.7)] border-2 border-white";
      } else {
        const hasAvailable = data.available > 0;
        if (hasAvailable) {
          markerEl.className = "h-3 w-3 rounded-full cursor-pointer bg-green-400 shadow-[0px_0px_4px_2px_rgba(34,197,94,0.7)] border-2 border-white";
        } else {
          markerEl.className = "h-3 w-3 rounded-full cursor-pointer bg-red-400 shadow-[0px_0px_4px_2px_rgba(239,68,68,0.9)] border-2 border-white";
        }
      }

      return markerEl;
    };

    const createPopupContent = (data: MarkerData) => {
    return `
      <div style="padding: 4px 8px; background-color: #27272a; color: white; border-radius: 6px;">
        <strong>${data.name}</strong><br/>
        ${
          data.isOpen
            ? `${data.available}/${data.total} available`
            : `CLOSED<br/><span style="font-size: 0.9em; color: #a1a1aa;">${
                data.hours.open
                  ? `Opens ${formatTime(data.hours.open)}`
                  : "Not open today"
              }</span>`
        }
      </div>
    `;
  };


    const setupMarkerInteractions = (
      markerEl: HTMLDivElement,
      marker: maplibregl.Marker,
      data: MarkerData,
    ) => {
      markerEl.addEventListener("mouseenter", () => {
        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }

        activePopupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: [0, -10],
          className: "popup-dark"
        })
          .setLngLat([data.coordinates.longitude, data.coordinates.latitude])
          .setHTML(createPopupContent(data))
          .addTo(map.current!);
      });

      markerEl.addEventListener("mouseleave", () => {
        if (activePopupRef.current) {
          activePopupRef.current.remove();
          activePopupRef.current = null;
        }
      });

      markerEl.addEventListener("click", (e) => {
        if (activePopupRef.current) {
          activePopupRef.current.remove();
          activePopupRef.current = null;
        }

        const flyToOptions = {
          center: [data.coordinates.longitude, data.coordinates.latitude] as [number, number],
          zoom: DEFAULT_ZOOM + 1.2,
          pitch: DEFAULT_PITCH,
          bearing: DEFAULT_BEARING,
          essential: true,
          duration: 880, // Faster animation
        };

        map.current?.flyTo(flyToOptions);

        // Wait for the flyTo animation to complete before triggering the sidebar
        map.current?.once('moveend', () => {
          handleMarkerClick(data.id, data.type);
        });

        e.stopPropagation();
      });
    };

    const removeUnusedMarkers = (keysToRemove: Set<string>) => {
      keysToRemove.forEach((keyToRemove) => {
        const markerData = markersRef.current.get(keyToRemove);
        if (markerData) {
          markerData.marker.remove();
          markersRef.current.delete(keyToRemove);
        }
      });
    };

    const currentMarkerKeys = new Set(markersRef.current.keys());
    const newMarkerDataMap: { [key: string]: MarkerData } = {};
    const width = mapContainer.current?.clientWidth || 0;
    const isMobile = width < 768;

    // Helper function to create or update markers
    const createOrUpdateMarker = (
      markerKey: string,
      markerData: MarkerData,
    ) => {
      // Remove existing marker if it exists
      const existingMarker = markersRef.current.get(markerKey);
      if (existingMarker) {
        existingMarker.marker.remove();
      }

      // Create new marker element and marker
      const markerEl = createMarkerElement(markerData, isMobile);
      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([
          markerData.coordinates.longitude,
          markerData.coordinates.latitude,
        ])
        .addTo(map.current!);

      // Set up interactions
      setupMarkerInteractions(markerEl, marker, markerData);

      // Update reference
      markersRef.current.set(markerKey, {
        marker,
        data: markerData,
      });
    };

    // Process all facilities
    Object.values(facilityData.facilities).forEach((facility) => {
      // Skip facilities with missing required data
      if (!facility.coordinates || !facility.roomCounts) {
        console.warn(`Facility ${facility.id} is missing required properties`);
        return;
      }

      const markerData: MarkerData = {
        id: facility.id,
        name: facility.name,
        coordinates: {
          latitude: facility.coordinates.latitude,
          longitude: facility.coordinates.longitude,
        },
        isOpen: facility.isOpen,
        available: facility.roomCounts.available,
        total: facility.roomCounts.total,
        type: facility.type,
        hours: facility.hours,
      };

      const markerKey = `${facility.type}-${facility.id}`;
      newMarkerDataMap[markerKey] = markerData;

      // If marker exists, check if it needs updating
      if (currentMarkerKeys.has(markerKey)) {
        currentMarkerKeys.delete(markerKey); // Remove from keys to delete

        const existingMarkerData = markersRef.current.get(markerKey);
        if (existingMarkerData) {
          const hasChanged =
            existingMarkerData.data.isOpen !== markerData.isOpen ||
            existingMarkerData.data.available !== markerData.available ||
            existingMarkerData.data.total !== markerData.total;

          if (hasChanged) {
            createOrUpdateMarker(markerKey, markerData);
          }
        }
      } else {
        createOrUpdateMarker(markerKey, markerData);
      }
    });

    removeUnusedMarkers(currentMarkerKeys);

    return () => {
      if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      }
    };
  }, [facilityData, handleMarkerClick, isMapLoaded]);

  // Add user location marker when location is available
  useEffect(() => {
    if (!map.current || !isMapLoaded || !userLocation) return;

    const userMarkerEl = document.createElement("div");
    userMarkerEl.className = "h-3.5 w-3.5 border-[1.5px] border-zinc-50 rounded-full bg-blue-400 shadow-[0px_0px_4px_2px_rgba(14,165,233,1)]";

    new maplibregl.Marker({ element: userMarkerEl })
      .setLngLat(userLocation)
      .addTo(map.current);
  }, [userLocation, isMapLoaded]);

  return (
    <div ref={mapContainer} className="w-full h-full relative">
      <div className="absolute bottom-20 md:bottom-4 left-4 z-10 pointer-events-none py-4">
        <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 shadow-lg">
          <h1 className="text-xl md:text-3xl font-bold">
            <span className="text-primary">Bruin</span>
            <span className="text-accent">Spots</span>
          </h1>
        </div>
      </div>
      <div className="absolute bottom-5 md:bottom-10 right-4 z-10 pointer-events-auto">
        <a
          href="https://forms.gle/dh3xn3y5SWuKX39ZA"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-lg hover:bg-background/95 transition-colors group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground/70 group-hover:text-foreground"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span className="text-[10px] text-foreground/70 group-hover:text-foreground font-medium">
            Report Issue
          </span>
        </a>
      </div>
    </div>
  );
}
