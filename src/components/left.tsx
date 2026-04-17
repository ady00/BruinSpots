import React, {
  useRef,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useState,
} from "react";
import { getUpdatedAccordionItems } from "@/utils/accordion";
import { Accordion } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Facility, FacilityStatus, FacilityType, AccordionRefs } from "@/types";
import {
  Map as MapIcon,
  TriangleAlert,
  Info,
  Search,
  LoaderPinwheel,
} from "lucide-react";
import FacilityAccordion from "@/components/FacilityAccordion";
import DateTimeButton from "@/components/DateTimeButton";
import DateTimeDisplay from "@/components/DateTimeDisplay";
import { LeftSidebarProps } from "@/types";

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  facilityData,
  showModal,
  setShowModal,
  expandedItems,
  setExpandedItems,
  isFetching,
  scrollToId,
  setScrollToId,
}) => {
  const accordionRefs = useRef<AccordionRefs>({});
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModal, setShowModal]);

  useEffect(() => {
    if (scrollToId && showModal) {
      const element = accordionRefs.current[scrollToId];
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          setScrollToId(null);
        }, 150);
      }
    }
  }, [scrollToId, showModal, setScrollToId]);

  const scrollToAccordion = useCallback((accordionId: string) => {
    const element = accordionRefs.current[accordionId];
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, []);

  const toggleItem = useCallback(
    (value: string) => {
      setExpandedItems((prevItems) => getUpdatedAccordionItems(value, prevItems));
    },
    [setExpandedItems],
  );

  const prevExpandedItemsRef = useRef<string[]>([]);

  useEffect(() => {
    const newItems = expandedItems.filter(
      (item) => !prevExpandedItemsRef.current.includes(item),
    );
    if (newItems.length === 1) {
      scrollToAccordion(newItems[0]);
    }
    prevExpandedItemsRef.current = expandedItems;
  }, [expandedItems, scrollToAccordion]);

  const filterFacilities = useCallback(
    (facilities: Facility[]) => {
      if (!searchTerm) {
        return facilities;
      }
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return facilities.filter((facility) =>
        facility.name.toLowerCase().includes(lowerCaseSearchTerm),
      );
    },
    [searchTerm],
  );

  const libraryFacilities = useMemo(() => {
    const allLibraries = facilityData
      ? Object.values(facilityData.facilities)
          .filter((facility) => facility.type === FacilityType.LIBRARY)
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];
    return filterFacilities(allLibraries);
  }, [facilityData, filterFacilities]);

  const academicFacilities = useMemo(() => {
    const allAcademic = facilityData
      ? Object.values(facilityData.facilities)
          .filter((facility) => facility.type === FacilityType.ACADEMIC)
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];
    return filterFacilities(allAcademic);
  }, [facilityData, filterFacilities]);

  return (
    <>
      {/* Modal Toggle Button - Fixed Position */}
      <Button
        onClick={() => setShowModal(!showModal)}
        className="fixed top-4 left-4 z-50 h-10 w-10 md:h-12 md:w-12 rounded-full bg-background/90 backdrop-blur-sm border-2 border-border/50 hover:bg-background/95 shadow-lg transition-all"
        size="icon"
        aria-label="Toggle facilities panel"
      >
        <Search size={16} className="md:w-5 md:h-5" />
      </Button>

      {/* Modal Overlay */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowModal(false)}
        />
      )}

      {/* Modal Content */}
      <div 
        className={`fixed z-50 bg-background backdrop-blur-sm border border-border/50 rounded-lg shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${
          showModal 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0 pointer-events-none'
        } 
        ${/* Mobile: bottom modal */ ''}
        bottom-4 left-4 right-4 h-[70vh] max-h-[70vh]
        ${/* Desktop: left modal */ ''}
        md:bottom-4 md:left-4 md:right-auto md:top-4 md:w-96 md:h-auto md:max-h-[calc(100vh-2rem)] md:translate-y-0 ${
          showModal ? 'md:translate-x-0' : 'md:-translate-x-full md:translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">
                <span className="text-primary">Bruin</span>
                <span className="text-accent">Spots</span>
              </h1>
              <div className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full border-2 border-foreground/20"
                      aria-label="Important notes about room availability"
                    >
                      <Info size={12} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="text-sm space-y-2">
                      <p className="font-medium"><i>Some Notes</i></p>
                      <ul className="list-disc pl-4 space-y-1">
                        
                        <li>
                          The availability displayed only showcases official class
                          schedules and events–the room may be occupied by
                          unofficial meetings or study groups.
                        </li>
                        <li>
                          The UCLA schedule of classes only displays classroom hours from 8AM to 6PM. BruinSpots will not work for classrooms after that hour (but library rooms can still be booked).
                          I am working on extending this in the future.
                        </li>
                    
                        <li>
                          If a room is marked as available and it is locked/busy/etc, please fill out the report issue
                          form in the bottom right corner. Alternatively, if a classroom is empty and available but not marked 
                          as such, please report that as well.
                        </li>
                        <li>Different schedules may apply during exam periods.</li>
                        <li>If there are any non-room issues with the app (e.g rendering/technical glitches), please FILL OUT <u><a href = "https://forms.gle/dh3xn3y5SWuKX39ZA">THIS FORM</a></u>.</li>
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
                <DateTimeButton isFetching={isFetching} />
              </div>
            </div>
            <DateTimeDisplay />
            <div className="mt-3 relative">
              <Search
                className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 rounded-full"
                aria-label="Search facilities"
              />
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-2">
            {libraryFacilities.length > 0 ? (
              <div className="mt-2">
                <h2 className="text-sm font-normal text-muted-foreground pl-4">
                  Library
                </h2>
                <Accordion type="multiple" value={expandedItems} className="w-full">
                  {libraryFacilities.map((facility) => (
                    <FacilityAccordion
                      key={`library-${facility.id}`}
                      facility={facility}
                      facilityType={FacilityType.LIBRARY}
                      expandedItems={expandedItems}
                      toggleItem={toggleItem}
                      accordionRefs={accordionRefs}
                      idPrefix="library"
                    />
                  ))}
                </Accordion>
              </div>
            ) : searchTerm && academicFacilities.length === 0 ? null : null}

            {/* Academic Buildings Section */}
            {academicFacilities.length > 0 ? (
              <div className="mt-5">
                <h2 className="text-sm font-normal text-muted-foreground pl-4">
                  Academic
                </h2>
                <Accordion type="multiple" value={expandedItems} className="w-full">
                  {academicFacilities.map((facility) => (
                    <FacilityAccordion
                      key={`building-${facility.id}`}
                      facility={facility}
                      facilityType={FacilityType.ACADEMIC}
                      expandedItems={expandedItems}
                      toggleItem={toggleItem}
                      accordionRefs={accordionRefs}
                      idPrefix="building"
                    />
                  ))}
                </Accordion>
              </div>
            ) : searchTerm && libraryFacilities.length === 0 ? null : null}

            {/* No Results Message */}
            {searchTerm &&
              libraryFacilities.length === 0 &&
              academicFacilities.length === 0 && (
                <p className="text-center text-muted-foreground text-sm mt-6 px-4">
                  No facilities found matching &quot;{searchTerm}&quot;
                </p>
              )}
            <div className="h-4"></div>
          </ScrollArea>

          {/* Loading Overlay */}
          {isFetching && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10 pointer-events-none rounded-lg">
              <LoaderPinwheel className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

LeftSidebar.displayName = "LeftSidebar";

export default memo(LeftSidebar);
