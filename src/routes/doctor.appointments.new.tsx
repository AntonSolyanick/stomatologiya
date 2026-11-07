import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Loader2, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
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
import { useProfile } from "@/hooks/useProfile";
import { StatusBadge } from "@/components/DoctorRoute";
import {
  TIME_SLOTS,
  bookAppointment,
  bookedSlotsQuery,
  doctorsQuery,
  doctorAppointmentsQuery,
  formatPrice,
  isSlotTaken,
  searchPatients,
  servicesQuery,,
  findMyDoctor,
} from "@/lib/clinic";

export const Route = createFileRoute("/doctor/appointments/new")({
  component: NewAppointment,
});

type Patient = { id: string | null; name: string; email: string; phone: string; birthdate: string };
const empty: Patient = { id: null, name: "", email: "", phone: "", birthdate: "" };

function NewAppointment() {
  const router = useRouter();
  const qc = useQueryClient();
  const { profile } = useProfile();
  const { data: doctors = [] } = useQuery(doctorsQuery);
  const { data: services = [] } = useQuery(servicesQuery);
  const doctorId = findMyDoctor(doctors, profile)?.id ?? null;

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchPatients>>>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [patient, setPatient] = useState<Patient>(empty);
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { data: allAppts = [] } = useQuery(doctorAppointmentsQuery);
  const history = picked
    ? allAppts.filter((a) => a.patient_email.toLowerCase() === picked || (patient.id && a.user_id === patient.id))
    : [];

  const { data: booked = {} } = useQuery(bookedSlotsQuery(doctorId, date, date));
  const taken = booked[date] ?? [];
  const isSunday = date ? parseISO(date).getDay() === 0 : false;

  const doSearch = async () => {
    setSearching(true);
    try {
      setResults(await searchPatients(query));
      setSearched(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка поиска");
    } finally {
      setSearching(false);
    }
  };

  const submit = async () => {
    if (!doctorId) {
      toast.error("Профиль врача не привязан к аккаунту");
      return;
    }
    if (!time || !serviceId) {
      toast.error("Выберите время и услугу");
      return;
    }
    if (patient.name.trim().length < 3 || !patient.email.includes("@"))
    {
      toast.error("Укажите ФИО и email пациента");
      return;
    }
    setSaving(true);
    try {
      await bookAppointment({
        doctorId,
        serviceId,
        date,
        time,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        birthdate: patient.birthdate || null,
        patientId: patient.id,
      });
      toast.success("Запись создана");
      qc.invalidateQueries({ queryKey: ["doctor-appointments"] });
      qc.invalidateQueries({ queryKey: ["booked-slots"] });
      router.navigate({ to: "/doctor/appointments" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать запись");
      if (isSlotTaken(e)) {
        setTime(null);
        qc.invalidateQueries({ queryKey: ["booked-slots"] });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Новая запись</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 surface-card p-5 sm:p-6">
          <h2 className="text-lg font-bold">Дата, время и услуга</h2>
          <div className="space-y-1.5">
            <Label htmlFor="n-date">Дата</Label>
            <Input
              id="n-date"
              type="date"
              min={format(new Date(), "yyyy-MM-dd")}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime(null);
              }}
            />
          </div>
          {isSunday ? (
            <p className="text-sm text-muted-foreground">В этот день нет свободных слотов.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {TIME_SLOTS.map((s) => {
                const dis = taken.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={dis}
                    onClick={() => setTime(s)}
                    className={`rounded-xl border px-2 py-2 text-sm font-medium ${
                      dis
                        ? "cursor-not-allowed bg-muted text-muted-foreground line-through"
                        : time === s
                          ? "border-primary bg-accent"
                          : "border-border hover:bg-muted/60"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Услуга</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder="Выберите услугу" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {formatPrice(s.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="space-y-4 surface-card p-5 sm:p-6">
          <h2 className="text-lg font-bold">Пациент</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Email или телефон"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
            <Button variant="outline" onClick={doSearch} disabled={searching || query.trim().length < 3}>
              {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Найти
            </Button>
          </div>
          {searched && (
            <div className="space-y-2">
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Пациент не найден — заполните данные, они сохранятся для следующих записей.
                </p>
              ) : (
                results.map((r) => {
                  const active = picked === r.email.toLowerCase();
                  return (
                    <button
                      key={r.email}
                      type="button"
                      onClick={() => {
                        setPicked(r.email.toLowerCase());
                        setPatient({
                          id: r.id,
                          name: r.full_name,
                          email: r.email,
                          phone: r.phone,
                          birthdate: r.birthdate ?? "",
                        });
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                        active ? "border-primary bg-accent" : "border-border hover:bg-muted/60"
                      }`}
                    >
                      <span>
                        <span className="font-medium">{r.full_name || "Без имени"}</span>
                        <span className="block text-xs text-muted-foreground">
                          {r.email} · {r.phone} {r.id ? "· аккаунт" : ""}
                        </span>
                      </span>
                      {active && <UserCheck className="size-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "ФИО", "text"],
                ["email", "Email", "email"],
                ["phone", "Телефон", "tel"],
                ["birthdate", "Дата рождения", "date"],
              ] as const
            ).map(([k, label, type]) => (
              <div key={k} className="space-y-1.5">
                <Label htmlFor={`p-${k}`}>{label}</Label>
                <Input
                  id={`p-${k}`}
                  type={type}
                  value={patient[k]}
                  disabled={!!patient.id}
                  onChange={(e) => setPatient({ ...patient, [k]: e.target.value })}
                />
              </div>
            ))}
          </div>
          {picked && (
            <Button variant="ghost" size="sm" onClick={() => { setPatient(empty); setPicked(null); }}>
              Сбросить выбор пациента
            </Button>
          )}
          {picked && (
            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-bold">История приёмов</h3>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">Приёмов пока нет</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-2 text-xs">
                      <span>
                        <span className="font-medium">{h.services?.name}</span>
                        <span className="block text-muted-foreground">
                          {h.appointment_date}, {h.appointment_time.slice(0, 5)}
                        </span>
                      </span>
                      <StatusBadge status={h.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      <Button size="lg" className="w-full sm:w-auto" disabled={saving} onClick={submit}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Создать запись
      </Button>
    </div>
  );
}
