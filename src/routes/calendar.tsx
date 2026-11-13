import { useEffect, useMemo, useState } from "react";
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
import { ChevronLeft, ChevronRight, ListOrdered, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDialog } from "@/components/BookingDialog";
import { useProfile } from "@/hooks/useProfile";
import { Link } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slotsForDate, bookedSlotsQuery, doctorsQuery, servicesQuery } from "@/lib/clinic";

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
          "Выберите удобную дату и время приёма стоматолога в Луганске. Свободные слоты видны прямо в календаре.",
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
  const { data: doctors = [], isLoading: doctorsLoading, isError: doctorsError } = useQuery(doctorsQuery);
  const doctor = doctors.find((d) => d.id === doctorParam) ?? doctors[0] ?? null;
  const { user, profile } = useProfile();
  const isStaff = profile?.role === "doctor" || profile?.role === "admin";
  const queryClient = useQueryClient();
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(startOfMonth(today));
  const [selected, setSelected] = useState<Date | null>(null);

  const rangeFrom = format(startOfMonth(month), "yyyy-MM-dd");
  const rangeTo = format(endOfMonth(month), "yyyy-MM-dd");

  const { data: services = [], isLoading: servicesLoading } = useQuery(servicesQuery);
  const slotsQ = bookedSlotsQuery(doctor?.id ?? null, rangeFrom, rangeTo);
  const { data: booked = {}, isLoading: slotsQLoading, isError: slotsError } = useQuery(slotsQ);
  const slotsLoading = doctorsLoading || slotsQLoading;

  // Заранее подгружаем следующий месяц, чтобы переключение было мгновенным.
  const doctorId = doctor?.id ?? null;
  useEffect(() => {
    if (!doctorId) return;
    const next = addMonths(month, 1);
    queryClient.prefetchQuery(
      bookedSlotsQuery(
        doctorId,
        format(startOfMonth(next), "yyyy-MM-dd"),
        format(endOfMonth(next), "yyyy-MM-dd"),
      ),
    );
  }, [doctorId, month, queryClient]);

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
        {user && (
          <Button asChild variant="outline" className="mt-6">
            <Link to={isStaff ? "/doctor/appointments" : "/my-appointments"}>
              <ListOrdered className="size-4" />
              {isStaff ? "Все записи пациентов" : "Мои записи"}
            </Link>
          </Button>
        )}
      </header>

      {(doctorsError || slotsError) && (
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
          <p className="font-semibold text-destructive">Не удалось связаться с сервером</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Проверьте интернет. Если сайт не открывается без VPN — включите VPN и повторите.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              void queryClient.refetchQueries({ queryKey: ["doctors"] });
              void queryClient.refetchQueries({ queryKey: ["booked-slots"] });
              void queryClient.refetchQueries({ queryKey: ["services"] });
            }}
          >
            Повторить
          </Button>
        </div>
      )}

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
                    <span className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-mint text-mint-foreground">
                      {d.photo_url ? <img src={d.photo_url} alt="" className="size-full object-cover" /> : <Stethoscope className="size-4" />}
                    </span>
                    <span className="text-left">
                      <span className="block font-medium">{d.specialization}</span>
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
          Врач: <span className="font-semibold text-foreground">{doctor.specialization}</span>
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
              const daySlots = slotsForDate(doctor?.work_hours, day);
              const takenCount = (booked[key] ?? []).filter((t) => daySlots.includes(t)).length;
              const isSunday = daySlots.length === 0;
              const isPast = isBefore(day, today);
              const isFull = takenCount >= daySlots.length;
              const disabled = isSunday || isPast || isFull;
              const isToday = isSameDay(day, today);
              // Закрашивание по числу записей видят только врач и администратор;
              // для пациентов и гостей календарь остаётся однотонным.
              const heat =
                !isStaff || isPast || isSunday || takenCount === 0
                  ? 0
                  : 12 + Math.round((takenCount / daySlots.length) * 58);
              const heatStyle = heat
                ? { backgroundColor: `color-mix(in oklab, var(--primary) ${heat}%, var(--card))`, color: heat > 45 ? "var(--primary-foreground)" : undefined }
                : undefined;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelected(day)}
                  style={heatStyle}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-all ${
                    disabled
                      ? "cursor-not-allowed border-transparent bg-muted/50 text-muted-foreground/60"
                      : "border-border bg-card hover:-translate-y-0.5 hover:border-primary hover:bg-accent hover:shadow-card"
                  } ${isToday && !disabled ? "border-primary" : ""}`}
                >
                  {format(day, "d")}
                  {!disabled && (
                    <span className={`mt-0.5 hidden text-[10px] font-normal sm:block ${heat > 45 ? "" : "text-muted-foreground"}`}>
                      {daySlots.length - takenCount} своб.
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

      </div>

      <BookingDialog
        date={selected}
        doctorId={doctor?.id ?? null}
        doctorLabel={doctor?.specialization ?? ""}
        bookedTimes={booked[selectedKey] ?? []}
        slots={selected ? slotsForDate(doctor?.work_hours, selected) : []}
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
