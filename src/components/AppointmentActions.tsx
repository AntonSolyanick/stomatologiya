import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarClock, Check, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import {
  TIME_SLOTS,
  bookedSlotsQuery,
  doctorsQuery,
  updateAppointment,
  deleteAppointment,
  type DoctorAppointment,,
  findMyDoctor,
} from "@/lib/clinic";

export function AppointmentActions({ row }: { row: DoctorAppointment }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const setStatus = async (status: "completed" | "cancelled") => {
    setBusy(true);
    try {
      await updateAppointment(row.id, { status });
      toast.success(status === "completed" ? "Приём завершён" : "Запись отменена");
      qc.invalidateQueries({ queryKey: ["doctor-appointments"] });
      qc.invalidateQueries({ queryKey: ["booked-slots"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось обновить запись");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Удалить запись пациента ${row.patient_name}? Действие необратимо.`)) return;
    setBusy(true);
    try {
      await deleteAppointment(row.id);
      toast.success("Запись удалена");
      qc.invalidateQueries({ queryKey: ["doctor-appointments"] });
      qc.invalidateQueries({ queryKey: ["booked-slots"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить запись");
    } finally {
      setBusy(false);
    }
  };

  const delBtn = (
    <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={remove}>
      <Trash2 className="size-3.5" /> Удалить
    </Button>
  );

  if (row.status !== "confirmed") return <div className="flex flex-wrap gap-1.5">{delBtn}</div>;

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("completed")}>
        <Check className="size-3.5" /> Завершить
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setMoveOpen(true)}>
        <CalendarClock className="size-3.5" /> Перенести
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus("cancelled")}>
        <X className="size-3.5" /> Отменить
      </Button>
      {delBtn}
      {moveOpen && <RescheduleDialog row={row} onClose={() => setMoveOpen(false)} />}
    </div>
  );
}

function RescheduleDialog({ row, onClose }: { row: DoctorAppointment; onClose: () => void }) {
  const qc = useQueryClient();
  const { profile } = useProfile();
  const { data: doctors = [] } = useQuery(doctorsQuery);
  const doctorId = findMyDoctor(doctors, profile)?.id ?? null;
  const [date, setDate] = useState(row.appointment_date);
  const [time, setTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { data: booked = {} } = useQuery(bookedSlotsQuery(doctorId, date, date));
  const taken = booked[date] ?? [];
  const isSunday = date ? parseISO(date).getDay() === 0 : false;

  const save = async () => {
    if (!time) return;
    setSaving(true);
    try {
      await updateAppointment(row.id, { appointment_date: date, appointment_time: time });
      toast.success("Запись перенесена");
      qc.invalidateQueries({ queryKey: ["doctor-appointments"] });
      qc.invalidateQueries({ queryKey: ["booked-slots"] });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось перенести");
      qc.invalidateQueries({ queryKey: ["booked-slots"] });
      setTime(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Перенос приёма</DialogTitle>
          <DialogDescription>{row.patient_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mv-date">Новая дата</Label>
            <Input
              id="mv-date"
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
            <div className="grid grid-cols-3 gap-2">
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
                        ? "cursor-not-allowed bg-muted text-muted-foreground"
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
          <Button className="w-full" disabled={!time || saving || isSunday} onClick={save}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Перенести
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
