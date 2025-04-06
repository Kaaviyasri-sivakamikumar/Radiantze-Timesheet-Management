import React from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Briefcase, Building2 } from "lucide-react";

interface EntityRef {
  id: string;
}

interface Employment {
  designation?: string;
  client: EntityRef;
  vendor: EntityRef;
  startDate: string;
  endDate: string;
}

interface PreviousEmploymentsProps {
  previousEmployments: Employment[];
  getEntityNameById: (type: "client" | "vendor", id: string) => string | undefined;
}

const PreviousEmployments: React.FC<PreviousEmploymentsProps> = ({
  previousEmployments,
  getEntityNameById,
}) => {
  if (previousEmployments.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Previous Employments</h3>
      <div className="grid gap-6 md:grid-cols-2">
        {previousEmployments.map((employment, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-base font-medium">
                <Briefcase className="w-5 h-5 text-primary" />
                <span>{employment.designation || "Unknown Role"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>Client: {getEntityNameById("client", employment.client.id) || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>Vendor: {getEntityNameById("vendor", employment.vendor.id) || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm pt-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline">
                  {format(parseISO(employment.startDate), "MMM d, yyyy")} → {format(parseISO(employment.endDate), "MMM d, yyyy")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PreviousEmployments;
