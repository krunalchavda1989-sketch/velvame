import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateDropdownsProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  maxDate?: Date;
  minYear?: number;
  label?: string;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DateDropdowns = ({ value, onChange, maxDate, minYear = 1940 }: DateDropdownsProps) => {
  const currentYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear();
  const years = Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i);

  const selectedDay = value ? value.getDate().toString() : "";
  const selectedMonth = value ? value.getMonth().toString() : "";
  const selectedYear = value ? value.getFullYear().toString() : "";

  const getDaysInMonth = (month: number, year: number) => {
    if (isNaN(month) || isNaN(year)) return 31;
    return new Date(year, month + 1, 0).getDate();
  };

  const currentMonth = selectedMonth !== "" ? parseInt(selectedMonth) : 0;
  const currentYear2 = selectedYear !== "" ? parseInt(selectedYear) : currentYear;
  const daysCount = getDaysInMonth(currentMonth, currentYear2);
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  const handleChange = (type: "day" | "month" | "year", val: string) => {
    let d = selectedDay ? parseInt(selectedDay) : 1;
    let m = selectedMonth !== "" ? parseInt(selectedMonth) : 0;
    let y = selectedYear !== "" ? parseInt(selectedYear) : currentYear;

    if (type === "day") d = parseInt(val);
    if (type === "month") m = parseInt(val);
    if (type === "year") y = parseInt(val);

    const maxDays = getDaysInMonth(m, y);
    if (d > maxDays) d = maxDays;

    const newDate = new Date(y, m, d);
    if (maxDate && newDate > maxDate) {
      onChange(maxDate);
    } else {
      onChange(newDate);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select value={selectedDay} onValueChange={(v) => handleChange("day", v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedMonth} onValueChange={(v) => handleChange("month", v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m, i) => (
            <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedYear} onValueChange={(v) => handleChange("year", v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DateDropdowns;
