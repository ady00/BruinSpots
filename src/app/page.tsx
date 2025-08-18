"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getUpdatedAccordionItems } from "@/utils/accordion";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import moment from "moment-timezone";
import LeftSidebar from "@/components/left";
import FacilityMap from "@/components/map";
import LoadingScreen from "@/components/LoadingScreen"
import { FacilityStatus, FacilityType } from "@/types";
import { useDateTimeContext } from "@/contexts/DateTimeContext";

const fetchFacilityData = async (
  selectedDateTime: Date,
): Promise<FacilityStatus> => {
  const dateParam = moment(selectedDateTime).format("YYYY-MM-DD");
  const timeParam = moment(selectedDateTime).format("HH:mm:ss");
  const apiUrl = `/api/facilities?date=${dateParam}&time=${timeParam}`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    const errorBody = await res.text();
    console.error("API Error Response:", errorBody);
    throw new Error(`Request failed with status ${res.status}. URL: ${apiUrl}`);
  }
  const data = await res.json();
  // Ensure facilities object exists, even if empty
  if (!data.facilities) {
    data.facilities = {};
  }
  return data;
};

const BruinSpotsPage: React.FC = () => {
  const { selectedDateTime } = useDateTimeContext();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [mountLoadingScreen, setMountLoadingScreen] = useState(true);

  const {
    data: facilityData,
    isLoading,
    isFetching,
    error: queryError,
    isSuccess,
  } = useQuery<FacilityStatus, Error>({
    queryKey: ["facilities", selectedDateTime.toISOString()],
    queryFn: () => fetchFacilityData(selectedDateTime),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
  });

  const error = queryError ? queryError.message : null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedShowModal = localStorage.getItem("showModal");
      if (storedShowModal !== null) {
        setShowModal(storedShowModal === "true");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("showModal", showModal.toString());
    }
  }, [showModal]);

  const handleMarkerClick = useCallback(
    (id: string, facilityType: FacilityType) => {
      const itemId = `${
        facilityType === FacilityType.LIBRARY ? "library" : "building"
      }-${id}`;

      // Open the modal and expand the clicked item
      setShowModal(true);

      // Use the shared utility function to update the expanded items
      setExpandedItems((prevItems) => {
        if (prevItems.includes(itemId)) {
          return prevItems;
        }

        return getUpdatedAccordionItems(itemId, prevItems);
      });
    },
    [],
  );

  const handleMapLoaded = useCallback(() => {
    setMapLoaded(true);
  }, []);

  const isDataReady = !isLoading && isSuccess && !!facilityData && !error;
  const isMapReady = mapLoaded;
  const isUIReady = isDataReady && isMapReady;
  const loadingScreenError = error && !isLoading ? error : null;

  // Effect to trigger the loading screen fade-out when the UI is ready
  useEffect(() => {
    if (isUIReady) {
      setShowLoadingScreen(false);
    }
  }, [isUIReady]);

  // Callback function passed to LoadingScreen, called when its fade-out transition ends
  const handleLoadingScreenExited = useCallback(() => {
    setMountLoadingScreen(false);
  }, []);

  const showFetchingOverlay = isFetching && !isLoading; 

  return (
    <>
      {mountLoadingScreen && (
        <LoadingScreen
          error={loadingScreenError}
          show={showLoadingScreen}
          onExited={handleLoadingScreenExited}
        />
      )}

      <div className={`h-screen w-full relative transition-opacity duration-300 ease-in-out ${
        mountLoadingScreen ? "opacity-0" : "opacity-100"
      }`}>
        {/* Fullscreen Map */}
        <div className="absolute inset-0">
          <FacilityMap
            facilityData={isDataReady ? facilityData : null}
            onMarkerClick={handleMarkerClick}
            onMapLoaded={handleMapLoaded}
          />
        </div>

        {/* Modal Sidebar */}
        <LeftSidebar
          facilityData={isDataReady ? facilityData : null}
          expandedItems={expandedItems}
          setExpandedItems={setExpandedItems}
          showModal={showModal}
          setShowModal={setShowModal}
          isFetching={showFetchingOverlay}
        />
      </div>
    </>
  );
};

export default BruinSpotsPage;
