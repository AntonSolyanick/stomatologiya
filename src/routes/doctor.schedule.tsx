import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { doctorsQuery } from "@/lib/clinic";

export const Route = createFileRoute("/doctor/schedule")({
  component: Schedule,
});

const DAYS: [string, string][] = [
  ["1", "Понедельник"], ["2", "Вторник"], ["3", "Среда"], ["4", "Четверг"],
  ["5", "Пятница"], ["6", "Суббота"], ["0", "Воскресенье"],
];

type Hours = Record<string, [string, string] | null>;

function Schedule() {
  const qc = useQueryClient();
  const { profile } = useProfile();
  const { data: doctors = [] } = useQuery(doctorsQuery);
  const doctor = findMyDoctor(doctors, profile);
  const [hours, setHours] = useState<Hours>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (doctor) setHours(doctor.work_hours ?? {});
  }, [doctor]);

  const save = async () => {
    if (!doctor) return;
    setSaving(true);
    const { error } = await supabase.from("doctors").update({ work_hours: hours }).eq("id", doctor.id);
    setSaving(false);
    if (error) {
      toast.error("Не удалось сохранить расписание");
      return;
    }
    toast.success("Расписание сохранено");
    qc.invalidateQueries({ queryKey: ["doctors"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Расписание</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Рабочие часы по дням недели. Блокировка слотов (обед, отпуск) появится в следующей версии.
        </p>
      </div>
      {!doctor ? (
        <p className="surface-card p-8 text-center text-sm text-muted-foreground">
          Профиль врача не привязан к этому аккаунту.
        </p>
      ) : (
        <div className="divide-y divide-border surface-card">
          {DAYS.map(([k, label]) => {
            const v = hours[k] ?? null;
            return (
              <div key={k} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!v}
                    onCheckedChange={(on) => setHours({ ...hours, [k]: on ? ["09:00", "19:00"] : null })}
                  />
                  <span className="font-medium">{label}</span>
                </div>
                {v ? (
                  <div className="flex items-center gap-2">
                    <Input type="time" className="w-32" value={v[0]} onChange={(e) => setHours({ ...hours, [k]: [e.target.value, v[1]] })} />
                    <span>—</span>
                    <Input type="time" className="w-32" value={v[1]} onChange={(e) => setHours({ ...hours, [k]: [v[0], e.target.value] })} />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Выходной</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Button disabled={!doctor || saving} onClick={save}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Сохранить
      </Button>
    </div>
  );
}
