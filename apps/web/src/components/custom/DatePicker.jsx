import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DatePicker({ value, onChange }) {
  // value is the UNIX timestamp (seconds) from your state
  // If no value, default to null
  const date = new Date(value * 1000);

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"secondary"}
            className={"w-full justify-start text-left font-normal border border-gray-700 bg-[#0a0a0a] hover:bg-[#0a0a0a] focus:ring-2 focus:ring-[#00FF41] focus:border-[#00FF41] focus:shadow-[0_0_10px_rgba(0,255,65,0.5)] text-white"}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.getTime() === 0? <span>Never</span> : (date ? format(date, "PPP") : <span>Select Date</span>)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700 text-white pointer-events-auto" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              if (!selectedDate) return;
              // Convert to UNIX Timestamp (seconds) for your MySQL API
              const unix = Math.floor(selectedDate.getTime() / 1000);
              onChange(unix);
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Prevent picking past dates
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}