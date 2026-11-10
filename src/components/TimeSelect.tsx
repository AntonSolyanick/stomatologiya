import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** Поле времени в 24-часовом формате: часы и минуты списком, без AM/PM. */
export function TimeSelect({
  value,
  onChange,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const parts = (value ?? "").split(":");
  const rawHour = parts[0] ?? "";
  const rawMinute = parts[1] ?? "";
  const hour = HOURS.includes(rawHour) ? rawHour : "00";
  const minute = MINUTES.includes(rawMinute) ? rawMinute : "00";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Select value={hour} onValueChange={(v) => onChange(`${v}:${minute}`)}>
        <SelectTrigger aria-label={`${ariaLabel}: часы`} className="w-[4.75rem] tabular-nums">
          <span className="tabular-nums">{hour}</span>
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              <span className="tabular-nums">{h}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span aria-hidden className="text-muted-foreground">
        :
      </span>
      <Select value={minute} onValueChange={(v) => onChange(`${hour}:${v}`)}>
        <SelectTrigger aria-label={`${ariaLabel}: минуты`} className="w-[4.75rem] tabular-nums">
          <span className="tabular-nums">{minute}</span>
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              <span className="tabular-nums">{m}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
