import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDialog } from "@/components/BookingDialog";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIME_SLOTS, bookedSlotsQuery, doctorsQuery, servicesQuery } from "@/lib/clinic";

export const Route = createFileRoute("/calendar")({
  validateSearch: (search: Record<string, unknown>): { service?: string; doctor?: string } => ({
    ...(typeof search["service"] === "string" ? { service: search["service"] } : {}),
    ...(typeof search["doctor"] === "string" ? { doctor: search["doctor"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Онлайн-запись на приём — Стоматология" },
      {
        name: "description",
        content:
          "Выберите удобную дату и время приёма стоматолога в Луганске. Свободные слоты Пн–Сб с 09:00 до 19:00.",
      },
      { property: "og:title", content: "Онлайн-запись на приём к стоматологу" },
      {
        property: "og:description",
        content: "Календарь свободного времени и запись за 2 шага — без звонков.",
      },
    ],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function CalendarPage() {
  const { service: preselectedServiceId, doctor: doctorParam } = useSearch({ from: "/calendar" });
  const navigate = useNavigate({ from: "/calendar" });
  const { data: doctors = [], isLoading: doctorsLoading } = useQuery(doctorsQuery);
  const doctor = doctors.find((d) => d.id === doctorParam) ?? doctors[0] ?? null;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(startOfMonth(today));
  const [selected, setSelected] = useState<Date | null>(null);

  const rangeFrom = format(startOfMonth(month), "yyyy-MM-dd");
  const rangeTo = format(endOfMonth(month), "yyyy-MM-dd");

  const { data: services = [], isLoading: servicesLoading } = useQuery(servicesQuery);
  const slotsQ = bookedSlotsQuery(doctor?.id ?? null, rangeFrom, rangeTo);
  const { data: booked = {}, isLoading: slotsQLoading } = useQuery(slotsQ);
  const slotsLoading = doctorsLoading || slotsQLoading;

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const all = eachDayOfInterval({ start, end });
    const leading = (start.getDay() + 6) % 7;
    return [...Array.from({ length: leading }, () => null), ...all];
  }, [month]);

  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Онлайн-запись
        </p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Выберите дату приёма</h1>
        <p className="mt-3 text-muted-foreground">
          Приём ведётся Пн–Сб с 09:00 до 19:00. Воскресенье — выходной. После выбора даты
          останется указать время и услугу.
        </p>
      </header>

      {doctors.length > 1 && (
        <div className="mx-auto mt-10 max-w-3xl">
          <Select
            value={doctor?.id ?? ""}
            onValueChange={(id) => {
              setSelected(null);
              navigate({ search: (s) => ({ ...s, doctor: id }) });
            }}
          >
            <SelectTrigger className="h-auto w-full py-3">
              <SelectValue placeholder="Выберите врача" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  <span className="flex items-center gap-3">
                    <span className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-mint text-xs font-bold text-mint-foreground">
                      {d.photo_url ? <img src={d.photo_url} alt="" className="size-full object-cover" /> : d.full_name.slice(0, 1)}
                    </span>
                    <span className="text-left">
                      <span className="block font-medium">{d.full_name}</span>
                      <span className="block text-xs text-muted-foreground">{d.specialization}</span>
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {doctors.length === 1 && doctor && (
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-muted-foreground">
          Врач: <span className="font-semibold text-foreground">{doctor.full_name}</span> · {doctor.specialization}
        </p>
      )}

      <div className="mx-auto mt-6 max-w-3xl surface-card p-4 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="icon"
            aria-label="Предыдущий месяц"
            disabled={isSameMonth(month, today)}
            onClick={() => setMonth(subMonths(month, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="font-display text-lg font-bold capitalize sm:text-xl">
            {format(month, "LLLL yyyy", { locale: ru })}
          </p>
          <Button
            variant="outline"
            size="icon"
            aria-label="Следующий месяц"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted-foreground sm:gap-2">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {slotsLoading ? (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {days.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} />;
              const key = format(day, "yyyy-MM-dd");
              const takenCount = booked[key]?.length ?? 0;
              const isSunday = day.getDay() === 0;
              const isPast = isBefore(day, today);
              const isFull = takenCount >= TIME_SLOTS.length;
              const disabled = isSunday || isPast || isFull;
              const isToday = isSameDay(day, today);

              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelected(day)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-all ${
                    disabled
                      ? "cursor-not-allowed border-transparent bg-muted/50 text-muted-foreground/60"
                      : "border-border bg-card hover:-translate-y-0.5 hover:border-primary hover:bg-accent hover:shadow-card"
                  } ${isToday && !disabled ? "border-primary" : ""}`}
                >
                  {format(day, "d")}
                  {!disabled && (
                    <span className="mt-0.5 hidden text-[10px] font-normal text-muted-foreground sm:block">
                      {TIME_SLOTS.length - takenCount} своб.
                    </span>
                  )}
                  {isFull && !isPast && !isSunday && (
                    <span className="mt-0.5 hidden text-[10px] font-normal sm:block">занято</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            Слоты по одному часу: 09:00 — 18:00
          </p>
          <p className="flex items-center gap-2">
            <Info className="size-4 text-primary" />
            Приглушённые дни недоступны
          </p>
        </div>
      </div>

      <BookingDialog
        date={selected}
        doctorId={doctor?.id ?? null}
        doctorName={doctor?.full_name ?? ""}
        bookedTimes={booked[selectedKey] ?? []}
        services={services}
        servicesLoading={servicesLoading}
        preselectedServiceId={preselectedServiceId ?? null}
        user={user}
        onClose={() => setSelected(null)}
        onBooked={() => {
          queryClient.invalidateQueries({ queryKey: ["booked-slots"] });
          queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
        }}
      />
    </div>
  );
}
