import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarDays, Clock, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/DoctorRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cancelMyAppointment, formatPrice } from "@/lib/clinic";

export const Route = createFileRoute("/my-appointments")({
  head: () => ({
    meta: [
      { title: "Мои записи — Стоматология" },
      { name: "description", content: "Предстоящие приёмы и история визитов пациента: дата, время, врач, услуга и стоимость." },
      { property: "og:title", content: "Мои записи к стоматологу" },
      { property: "og:description", content: "Предстоящие приёмы и история визитов пациента." },
    ],
  }),
  component: MyAppointments,
});

type Row = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  services: { name: string; price: number } | null;
  doctors: { full_name: string } | null;
};

function MyAppointments() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["my-appointments", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Row[]> => {
      await (supabase.rpc as unknown as (fn: string) => Promise<unknown>)("claim_my_appointments");
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, status, services(name, price), doctors(full_name)")
        .eq("user_id", user!.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const cancel = async (id: string) => {
    setBusy(id);
    try {
      await cancelMyAppointment(id);
      toast.success("Запись отменена");
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
      qc.invalidateQueries({ queryKey: ["booked-slots"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось отменить");
    } finally {
      setBusy(null);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-16 sm:px-6">
        <Skeleton className="h-10 w-56 rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md surface-card p-8 text-center">
          <h1 className="text-2xl font-extrabold">Мои записи</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Войдите в аккаунт, чтобы увидеть свои приёмы. Записаться можно и без регистрации.
          </p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1"><Link to="/login" search={{ redirect: "/my-appointments" }}>Войти</Link></Button>
            <Button asChild variant="outline" className="flex-1"><Link to="/register">Регистрация</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const upcoming = rows.filter((r) => r.status === "confirmed" && r.appointment_date >= today);
  const history = rows.filter((r) => !upcoming.includes(r)).reverse();

  const card = (r: Row, canCancel: boolean) => (
    <article key={r.id} className="flex flex-col gap-4 p-5 surface-card sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-lg font-bold">{r.services?.name ?? "Услуга"}</p>
          <StatusBadge status={r.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-primary" />
            {format(parseISO(r.appointment_date), "d MMMM yyyy", { locale: ru })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4 text-primary" />
            {r.appointment_time.slice(0, 5)}
          </span>
          {r.doctors && (
            <span className="flex items-center gap-1.5">
              <Stethoscope className="size-4 text-primary" />
              {r.doctors.full_name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
        <p className="font-display text-xl font-extrabold text-primary-deep">
          {r.services ? formatPrice(r.services.price) : "—"}
        </p>
        {canCancel && (
          <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => cancel(r.id)}>
            Отменить
          </Button>
        )}
      </div>
    </article>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-extrabold">Мои записи</h1>
        {upcoming.length < 2 ? (
          <Button asChild><Link to="/calendar">Записаться ещё</Link></Button>
        ) : (
          <Button disabled>Записаться ещё</Button>
        )}
      </header>
      <p className="mt-3 text-sm text-muted-foreground">
        Можно иметь не более 2 активных записей ({upcoming.length} из 2). Чтобы записаться снова, отмените одну из них.
      </p>
      {isLoading ? (
        <div className="mt-10 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-10 surface-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Пока нет записей. Выберите удобное время в календаре.</p>
          <Button asChild className="mt-5"><Link to="/calendar">Открыть календарь</Link></Button>
        </div>
      ) : (
        <>
          <h2 className="mt-10 text-xl font-bold">Предстоящие</h2>
          <div className="mt-4 space-y-3">
            {upcoming.length ? upcoming.map((r) => card(r, true)) : (
              <p className="text-sm text-muted-foreground">Нет предстоящих приёмов.</p>
            )}
          </div>
          {history.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-bold">История</h2>
              <div className="mt-4 space-y-3">{history.map((r) => card(r, false))}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
