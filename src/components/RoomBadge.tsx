import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { FacilityType, RoomStatus } from "@/types";

interface RoomBadgeProps {
  status: RoomStatus;
  availableAt?: string;
  availableFor?: number;
  facilityType: FacilityType;
}

const badgeStyles: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: "bg-emerald-900/30 text-emerald-300 border-emerald-700/50",
  [RoomStatus.PASSING_PERIOD]: "bg-yellow-900/30 text-yellow-300 border-yellow-700/50",
  [RoomStatus.OPENING_SOON]: "bg-blue-900/30 text-blue-300 border-blue-700/50",
  [RoomStatus.RESERVED]: "bg-red-900/30 text-red-300 border-red-700/50",
  [RoomStatus.OCCUPIED]: "bg-red-900/30 text-red-300 border-red-700/50",
};

const getStatusText = (
  status: RoomStatus,
  facilityType: FacilityType,
): string => {
  const statusTexts: Record<RoomStatus, string> = {
    [RoomStatus.AVAILABLE]: "Available",
    [RoomStatus.PASSING_PERIOD]: "Break",
    [RoomStatus.OPENING_SOON]: "Opening Soon",
    [RoomStatus.RESERVED]:
      facilityType === FacilityType.LIBRARY ? "Reserved" : "Occupied",
    [RoomStatus.OCCUPIED]: "Occupied",
  };

  return statusTexts[status];
};

export const RoomBadge: React.FC<RoomBadgeProps> = memo(
  ({ status, facilityType }) => {
    return (
      <Badge variant="outline" className={badgeStyles[status]}>
        {getStatusText(status, facilityType)}
      </Badge>
    );
  },
);

RoomBadge.displayName = "RoomBadge";
