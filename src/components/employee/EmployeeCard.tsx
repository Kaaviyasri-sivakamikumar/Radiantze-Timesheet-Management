import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SquareUser } from "lucide-react";
import { Badge } from "../ui/badge";

interface EmployeeCardProps {
  firstName: string;
  lastName: string;
  employeeId: string;
  designation: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  firstName,
  lastName,
  employeeId,
  designation,
  startDate,
  endDate,
  isActive,
}) => {
  return (
    <Card className="w-72 h-44 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-xl p-5 relative overflow-hidden border border-blue-400 hover:scale-105 transition-transform duration-300 ease-in-out">
      {/* Status Badge */}
      <Badge
        variant={isActive ? "success" : "destructive"}
        className="px-2 py-0.5 text-xs font-semibold absolute right-4 top-4 z-10"
      >
        {isActive ? "Active" : "Inactive"}
      </Badge>

      {/* Profile Section */}
      <div className="flex items-center mt-2">
        <div className="p-2 bg-white rounded-full shadow-md">
          <SquareUser className="w-10 h-10 text-blue-600" />
        </div>

        <div className="ml-4">
          <h2 className="text-sm font-bold tracking-wide">
            {firstName} {lastName}
          </h2>
          <p className="text-xs opacity-90">{designation}</p>
          <p className="text-xs opacity-70">ID: {employeeId}</p>
          <p className="text-xs opacity-70 mt-1">
            Since {startDate ? startDate : "-- -- ----"}
          </p>
        </div>
      </div>

      {/* Footer */}
      <CardContent className="absolute bottom-0 left-0 w-full bg-white text-blue-900 flex justify-between items-center py-2 px-3 rounded-b-2xl shadow-inner">
        <p className="text-xs font-semibold">Radiantze Inc</p>
        <img
          src="/radiantze-logo.png"
          alt="Radiantze Logo"
          className="w-16 object-contain"
        />
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;
