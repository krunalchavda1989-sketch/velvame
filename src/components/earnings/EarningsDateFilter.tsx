import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DatePreset } from "@/hooks/useEarningsData";

const presets: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "Quarter" },
  { value: "half_year", label: "Half Year" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom" },
];

interface Props {
  preset: DatePreset;
  setPreset: (p: DatePreset) => void;
  customStart?: Date;
  setCustomStart: (d: Date | undefined) => void;
  customEnd?: Date;
  setCustomEnd: (d: Date | undefined) => void;
}

export default function EarningsDateFilter({ preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1">
        {presets.map(p => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-md transition-colors font-medium",
              preset === p.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs", !customStart && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                {customStart ? format(customStart, "dd MMM yyyy") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customStart} onSelect={setCustomStart} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-xs">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs", !customEnd && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                {customEnd ? format(customEnd, "dd MMM yyyy") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
