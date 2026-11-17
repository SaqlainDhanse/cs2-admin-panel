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
            className={"w-full justify-start text-left font-normal border border-line bg-canvas hover:bg-canvas focus:ring-2 focus:ring-theme focus:border-theme focus:shadow-[0_0_10px_rgb(var(--theme-primary-rgb)_/_0.5)] text-ink"}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.getTime() === 0? <span>Never</span> : (date ? format(date, "PPP") : <span>Select Date</span>)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-panel border-line text-ink pointer-events-auto" align="start">
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