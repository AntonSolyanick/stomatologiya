import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentActions } from "@/components/AppointmentActions";
import { StatusBadge } from "@/components/DoctorRoute";
import { TIME_SLOTS, doctorAppointmentsQuery } from "@/lib/clinic";

export const Route = createFileRoute("/doctor/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: rows = [], isLoading } = useQuery(doctorAppointmentsQuery);
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const wFrom = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const wTo = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const active = rows.filter((r) => r.status !== "cancelled");
  const todayRows = rows
    .filter((r) => r.appointment_date === today)
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  const week = active.filter((r) => r.appointment_date >= wFrom && r.appointment_date <= wTo);
  const patients = new Set(rows.map((r) => r.user_id ?? r.patient_email)).size;
  const load = Math.round((week.length / (TIME_SLOTS.length * 6)) * 100);

  const metrics = [
    { label: "Сегодня", value: todayRows.filter((r) => r.status !== "cancelled").length },
    { label: "Эта неделя", value: week.length },
    { label: "Всего пациентов", value: patients },
    { label: "Загрузка недели", value: `${load}%` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Дашборд</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {format(now, "EEEE, d MMMM yyyy", { locale: ru })}
          </p>
        </div>
        <Button asChild>
          <Link to="/doctor/appointments/new">
            <Plus className="size-4" /> Новая запись
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) =>
          isLoading ? (
            <Skeleton key={m.label} className="h-28 rounded-2xl" />
          ) : (
            <div key={m.label} className="surface-card p-5">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-primary-deep">{m.value}</p>
            </div>
          ),
        )}
      </div>

      <section className="surface-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Приёмы на сегодня</h2>
        <div className="mt-4 divide-y divide-border">
          {isLoading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : todayRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">На сегодня записей нет</p>
          ) : (
            todayRows.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-start gap-4">
                  <span className="font-display text-lg font-extrabold text-primary">
                    {r.appointment_time.slice(0, 5)}
                  </span>
                  <div>
                    <p className="font-semibold">{r.patient_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.patient_phone || r.patient_email} · {r.services?.name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={r.status} />
                  <AppointmentActions row={r} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
