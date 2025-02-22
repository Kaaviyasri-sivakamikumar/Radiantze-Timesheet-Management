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
    <Card className="w-72 h-40 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl shadow-lg p-4 relative overflow-hidden border border-blue-300">
      {/* Top Section */}
      <div className="flex justify-between items-center">
        <div className="flex justify-between items-center">
          {/* Badge moved to the right side corner */}
          <Badge
            variant={isActive ? "success" : "destructive"}
            className="px-2 py-0.5 text-xs font-semibold absolute right-4 top-4"
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <Badge
          variant={isActive ? "success" : "destructive"}
          className="px-2 py-0.5 text-xs font-semibold"
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Profile & Details */}
      <div className="flex mt-0 items-center">
        <div className="p-2 bg-white rounded-full shadow-md">
          <SquareUser className="w-10 h-10 text-blue-600" />
        </div>
        <div className="ml-3">
          {/* <p className="text-sm font-semibold">{designation}</p> */}
          <h2 className="text-xs font-bold drop-shadow-md">
            {firstName} {lastName}
          </h2>
          <p className="text-xs opacity-80 mt-1">{designation}</p>
          <p className="text-xs opacity-80 mt-1">{employeeId}</p>

          <p className="text-xs opacity-80 mt-1">
            Employee since {startDate ? startDate : "-- -- ----"}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <CardContent className="mt-4 absolute bottom-0 left-0 w-full bg-white text-blue-900 flex justify-between items-center py-2 px-3 rounded-b-xl shadow-inner">
        <p className="text-xs font-semibold">Radiantze Inc</p>
        <img src="/radiantze-logo.png" alt="Radiantze Logo" className="w-16" />
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;
