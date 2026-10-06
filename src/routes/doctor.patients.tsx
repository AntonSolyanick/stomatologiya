import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/DoctorRoute";
import { doctorAppointmentsQuery, formatPrice, type DoctorAppointment } from "@/lib/clinic";

export const Route = createFileRoute("/doctor/patients")({
  component: Patients,
});

type PatientRow = {
  key: string;
  name: string;
  phone: string;
  email: string;
  birthdate: string | null;
  visits: DoctorAppointment[];
  last: string | null;
};

const fmt = (d: string) => format(parseISO(d), "d MMM yyyy", { locale: ru });

function Patients() {
  const { data: rows = [], isLoading } = useQuery(doctorAppointmentsQuery);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<PatientRow | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  const patients = useMemo(() => {
    const map = new Map<string, PatientRow>();
    for (const r of rows) {
      const key = r.user_id ?? r.patient_email;
      const p = map.get(key) ?? {
        key,
        name: r.patient_name,
        phone: r.patient_phone,
        email: r.patient_email,
        birthdate: r.patient_birthdate,
        visits: [],
        last: null,
      };
      p.visits.push(r);
      if (r.status !== "cancelled" && r.appointment_date <= today && (!p.last || r.appointment_date > p.last))
        p.last = r.appointment_date;
      map.set(key, p);
    }
    const term = q.trim().toLowerCase();
    return [...map.values()]
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.phone.includes(term) || p.email.includes(term))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [rows, q, today]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-extrabold">Пациенты</h1>
        <Input className="sm:max-w-xs" placeholder="Поиск по ФИО, телефону, email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : patients.length === 0 ? (
        <p className="surface-card p-8 text-center text-sm text-muted-foreground">Пациентов пока нет</p>
      ) : (
        <div className="overflow-hidden surface-card">
          <div className="hidden grid-cols-6 gap-4 border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground md:grid">
            <span>ФИО</span><span>Телефон</span><span>Email</span><span>Дата рождения</span><span>Визитов</span><span>Последний визит</span>
          </div>
          <div className="divide-y divide-border">
            {patients.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setOpen(p)}
                className="grid w-full gap-1 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 md:grid-cols-6 md:gap-4"
              >
                <span className="font-semibold">{p.name}</span>
                <span className="text-muted-foreground md:text-foreground">{p.phone}</span>
                <span className="truncate text-muted-foreground md:text-foreground">{p.email}</span>
                <span>{p.birthdate ? fmt(p.birthdate) : "—"}</span>
                <span><span className="md:hidden text-muted-foreground">Визитов: </span>{p.visits.length}</span>
                <span><span className="md:hidden text-muted-foreground">Последний: </span>{p.last ? fmt(p.last) : "—"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{open?.name}</DialogTitle>
            <DialogDescription>
              {open?.phone} · {open?.email}
              {open?.birthdate ? ` · ${fmt(open.birthdate)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {open?.visits.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{v.services?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(v.appointment_date)}, {v.appointment_time.slice(0, 5)}
                    {v.services ? ` · ${formatPrice(v.services.price)}` : ""}
                  </p>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
