import { useState } from "react";
import { format, subDays, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subMonths } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type DatePreset = "today" | "week" | "month" | "quarter" | "half_year" | "year" | "custom";

interface DateRangeFilterProps {
  from: Date;
  to: Date;
  onRangeChange: (from: Date, to: Date) => void;
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "Quarter" },
  { key: "half_year", label: "Half Year" },
  { key: "year", label: "Year" },
  { key: "custom", label: "Custom" },
];

const getPresetRange = (preset: DatePreset): [Date, Date] => {
  const now = new Date();
  switch (preset) {
    case "today": return [now, now];
    case "week": return [startOfWeek(now, { weekStartsOn: 1 }), now];
    case "month": return [startOfMonth(now), now];
    case "quarter": return [startOfQuarter(now), now];
    case "half_year": return [subMonths(now, 6), now];
    case "year": return [startOfYear(now), now];
    default: return [subDays(now, 30), now];
  }
};

const DateRangeFilter = ({ from, to, onRangeChange }: DateRangeFilterProps) => {
  const [activePreset, setActivePreset] = useState<DatePreset>("month");
  const [showCustom, setShowCustom] = useState(false);

  const handlePreset = (preset: DatePreset) => {
    setActivePreset(preset);
    if (preset === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const [f, t] = getPresetRange(preset);
    onRangeChange(f, t);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p.key}
          variant={activePreset === p.key ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset(p.key)}
          className="text-xs"
        >
          {p.label}
        </Button>
      ))}

      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs gap-1.5", !from && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {from ? format(from, "dd MMM yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={from}
                onSelect={(d) => d && onRangeChange(d, to)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-xs">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs gap-1.5", !to && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {to ? format(to, "dd MMM yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={to}
                onSelect={(d) => d && onRangeChange(from, d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
export { getPresetRange };
