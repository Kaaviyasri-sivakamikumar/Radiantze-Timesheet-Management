// components/InfoRow.tsx
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  isLoading?: boolean;
  skeletonWidth?: string; // Tailwind width class like "w-24"
}

const InfoRow: React.FC<InfoRowProps> = ({
  icon,
  label,
  value,
  isLoading = false,
  skeletonWidth = "w-24",
}) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      {icon}
      <span className="min-w-[10px]">{label}</span>
      <span className="font-medium">:</span>
      <span className="font-semibold">
        {isLoading ? (
          <Skeleton className={`${skeletonWidth} h-4`} />
        ) : value ?? "N/A"}
      </span>
    </div>
  );
};

export default InfoRow;
