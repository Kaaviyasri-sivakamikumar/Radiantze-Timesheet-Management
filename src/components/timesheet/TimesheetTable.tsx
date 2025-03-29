import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
  } from "@/components/ui/table";
  import { Input } from "@/components/ui/Input";
  import { Button } from "@/components/ui/Button";
  import { Trash2 } from "lucide-react";
  import { Skeleton } from "@/components/ui/skeleton";
  
  const TimeName = ({ name, color }: { name: string; color: string }) => (
    <div className="flex items-center gap-2">
      <div style={{ background: color }} className="w-2 h-2 rounded-full" />
      {name}
    </div>
  );
  
  const TimesheetTable = ({
    data,
    loading,
    dayLabels,
    handleInputChange,
    handleDeleteRow,
    totalRow
  }) => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-[#1c5e93] text-white">TIME</TableHead>
              {dayLabels.map((day, index) => (
                <TableHead key={index} className="bg-[#1c5e93] text-white">{day}</TableHead>
              ))}
              <TableHead className="text-right bg-[#1c5e93] text-white">TOTAL</TableHead>
              <TableHead className="text-center bg-[#1c5e93] text-white">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
  
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  {dayLabels.map((_, dayIndex) => (
                    <TableCell key={dayIndex}><Skeleton className="h-8 w-20" /></TableCell>
                  ))}
                  <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {data?.times?.map((time, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-[#6fd3f2]"}>
                    <TableCell className="font-medium">
                      <TimeName name={time.name} color="#1c5e93" />
                    </TableCell>
                    {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => (
                      <TableCell key={day}>
                        <Input
                          type="number"
                          value={time[day]}
                          className="w-20"
                          onChange={(e) => handleInputChange(index, day, e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-right">{time.total}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
  
                {totalRow && (
                  <TableRow>
                    <TableCell className="font-medium">{totalRow.name}</TableCell>
                    {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => (
                      <TableCell key={day} className="pl-[21px]">{totalRow[day]}</TableCell>
                    ))}
                    <TableCell className="text-right">{totalRow.total}</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  export default TimesheetTable;
  