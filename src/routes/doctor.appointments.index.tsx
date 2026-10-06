import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentActions } from "@/components/AppointmentActions";
import { StatusBadge } from "@/components/DoctorRoute";
import { doctorAppointmentsQuery, formatPrice } from "@/lib/clinic";

export const Route = createFileRoute("/doctor/appointments/")({
  component: AllAppointments,
});

const PAGE = 15;

function AllAppointments() {
  const { data: rows = [], isLoading } = useQuery(doctorAppointmentsQuery);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    return rows.filter(
      (r) =>
        (!from || r.appointment_date >= from) &&
        (!to || r.appointment_date <= to) &&
        (status === "all" || r.status === status) &&
        (!term ||
          r.patient_name.toLowerCase().includes(term) ||
          (digits.length >= 3 && r.patient_phone.replace(/\D/g, "").includes(digits))),
    );
  }, [rows, from, to, status, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const visible = filtered.slice((page - 1) * PAGE, page * PAGE);

  const exportCsv = () => {
    const head = ["Дата", "Время", "Пациент", "Телефон", "Email", "Услуга", "Цена", "Статус"];
    const lines = filtered.map((r) =>
      [
        r.appointment_date,
        r.appointment_time.slice(0, 5),
        r.patient_name,
        r.patient_phone,
        r.patient_email,
        r.services?.name ?? "",
        r.services?.price ?? "",
        r.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob(["\ufeff" + [head.join(";"), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `zapisi-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-extrabold">Все записи</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="size-4" /> CSV
          </Button>
          <Button asChild>
            <Link to="/doctor/appointments/new">
              <Plus className="size-4" /> Новая запись
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 surface-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="f-from">С даты</Label>
          <Input id="f-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-to">По дату</Label>
          <Input id="f-to" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-1.5">
          <Label>Статус</Label>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="confirmed">Подтверждённые</SelectItem>
              <SelectItem value="completed">Завершённые</SelectItem>
              <SelectItem value="cancelled">Отменённые</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-q">Пациент</Label>
          <Input id="f-q" placeholder="ФИО или телефон" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <p className="surface-card p-8 text-center text-sm text-muted-foreground">Записей не найдено</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto surface-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr>
                  {["Дата", "Время", "Пациент", "Услуга", "Цена", "Статус", "Действия"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3">
                      {format(parseISO(r.appointment_date), "d MMM yyyy", { locale: ru })}
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.appointment_time.slice(0, 5)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{r.patient_phone}</p>
                    </td>
                    <td className="px-4 py-3">{r.services?.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.services ? formatPrice(r.services.price) : "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3"><AppointmentActions row={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {visible.map((r) => (
              <article key={r.id} className="space-y-3 surface-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{r.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{r.patient_phone}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm">
                  {format(parseISO(r.appointment_date), "d MMMM yyyy", { locale: ru })},{" "}
                  {r.appointment_time.slice(0, 5)} · {r.services?.name} ·{" "}
                  {r.services ? formatPrice(r.services.price) : ""}
                </p>
                <AppointmentActions row={r} />
              </article>
            ))}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Назад</Button>
              <span className="text-sm text-muted-foreground">{page} из {pages}</span>
              <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Вперёд</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
