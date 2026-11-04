import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarCheck, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TIME_SLOTS,
  bookAppointment,
  isSlotTaken,
  formatPrice,
  type Service,
} from "@/lib/clinic";
import type { User } from "@supabase/supabase-js";

type Props = {
  date: Date | null;
  doctorId: string | null;
  doctorName?: string;
  bookedTimes: string[];
  services: Service[];
  servicesLoading: boolean;
  preselectedServiceId?: string | null;
  user: User | null;
  onClose: () => void;
  onBooked: () => void;
};

type GuestForm = {
  name: string;
  email: string;
  phone: string;
  birthdate: string;
};

const emptyGuest: GuestForm = { name: "", email: "", phone: "", birthdate: "" };

export function BookingDialog({
  date,
  doctorId,
  doctorName,
  bookedTimes,
  services,
  servicesLoading,
  preselectedServiceId,
  user,
  onClose,
  onBooked,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [time, setTime] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [guest, setGuest] = useState<GuestForm>(emptyGuest);
  const [errors, setErrors] = useState<Partial<Record<keyof GuestForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!date) return;
    setStep(1);
    setTime(null);
    setServiceId(preselectedServiceId ?? null);
    setGuest(emptyGuest);
    setErrors({});
    setDone(false);
    setSaving(false);
  }, [date, preselectedServiceId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  const dateLabel = date ? format(date, "d MMMM yyyy, EEEE", { locale: ru }) : "";
  const dateValue = date ? format(date, "yyyy-MM-dd") : "";

  const validateGuest = () => {
    const next: Partial<Record<keyof GuestForm, string>> = {};
    if (guest.name.trim().length < 3) next.name = "Укажите фамилию, имя и отчество";
    if (!/^[^@\s]+@[^@\s]+\.[a-zA-Zа-яА-Я]{2,}$/.test(guest.email.trim()))
      next.email = "Укажите корректный email";
    const digits = guest.phone.replace(/\D/g, "");
    if (digits.length < 10) next.phone = "Укажите телефон в формате +7 (999) 123-45-67";
    if (!guest.birthdate) next.birthdate = "Укажите дату рождения";
    else if (new Date(guest.birthdate) > new Date())
      next.birthdate = "Дата рождения не может быть в будущем";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!date || !time || !serviceId || !doctorId) return;
    if (!user && !validateGuest()) return;

    setSaving(true);
    try {
      await bookAppointment({
        doctorId,
        serviceId,
        date: dateValue,
        time,
        name: user
          ? (user.user_metadata?.["full_name"] as string) || user.email || "Пациент"
          : guest.name,
        email: user ? user.email! : guest.email,
        phone: user ? (user.user_metadata?.["phone"] as string) || "" : guest.phone,
        birthdate: user ? (user.user_metadata?.["birthdate"] as string) || null : guest.birthdate,
      });
      setDone(true);
      onBooked();
      toast.success("Вы записаны на приём");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не удалось создать запись";
      toast.error(message);
      onBooked();
      if (isSlotTaken(e)) {
        setTime(null);
        setStep(1);
      }
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    setStep(1);
    setTime(null);
    setServiceId(null);
    setDone(false);
    setGuest(emptyGuest);
  };

  return (
    <Dialog open={!!date} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-[100vw] gap-0 overflow-hidden rounded-none p-0 sm:max-w-lg sm:rounded-2xl">
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle className="font-display text-lg">
            {done ? "Запись подтверждена" : "Запись на приём"}
          </DialogTitle>
          <DialogDescription className="capitalize">{dateLabel}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92dvh-9rem)]">
          <div className="px-5 py-5">
            {done ? (
              <div className="space-y-5 text-center">
                <CheckCircle2 className="mx-auto size-14 text-primary" />
                <div className="rounded-xl bg-muted/60 p-4 text-left text-sm">
                  <p className="flex justify-between gap-4 py-1">
                    <span className="text-muted-foreground">Дата</span>
                    <span className="font-medium capitalize">{dateLabel}</span>
                  </p>
                  {doctorName && (
                    <p className="flex justify-between gap-4 py-1">
                      <span className="text-muted-foreground">Врач</span>
                      <span className="text-right font-medium">{doctorName}</span>
                    </p>
                  )}
                  <p className="flex justify-between gap-4 py-1">
                    <span className="text-muted-foreground">Время</span>
                    <span className="font-medium">{time}</span>
                  </p>
                  <p className="flex justify-between gap-4 py-1">
                    <span className="text-muted-foreground">Услуга</span>
                    <span className="text-right font-medium">{selectedService?.name}</span>
                  </p>
                  <p className="flex justify-between gap-4 py-1">
                    <span className="text-muted-foreground">Стоимость</span>
                    <span className="font-medium">
                      {selectedService ? formatPrice(selectedService.price) : "—"}
                    </span>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Приходите за 10 минут до приёма: {CLINIC.address}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" className="flex-1" onClick={restart}>
                    Записаться ещё
                  </Button>
                  {user ? (
                    <Button asChild className="flex-1">
                      <Link to="/my-appointments" onClick={onClose}>
                        <CalendarCheck className="size-4" />
                        Мои записи
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="flex-1">
                      <Link to="/register" onClick={onClose}>
                        Создать аккаунт
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : step === 1 ? (
              <div>
                <p className="mb-3 text-sm font-medium">Выберите время приёма</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TIME_SLOTS.map((slot) => {
                    const taken = bookedTimes.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={taken}
                        onClick={() => {
                          setTime(slot);
                          setStep(2);
                        }}
                        className={`flex flex-col items-center rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                          taken
                            ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                            : "border-border bg-card hover:-translate-y-0.5 hover:border-primary hover:bg-accent hover:shadow-card"
                        }`}
                      >
                        {slot}
                        <span className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                          {taken ? "занято" : "свободно"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : step === 2 ? (
              <div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                  Время: {time}
                </button>
                <p className="mb-3 text-sm font-medium">Выберите услугу</p>
                {servicesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <RadioGroup
                    value={serviceId ?? ""}
                    onValueChange={setServiceId}
                    className="gap-2"
                  >
                    {services.map((s) => (
                      <Label
                        key={s.id}
                        htmlFor={`svc-${s.id}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                          serviceId === s.id
                            ? "border-primary bg-accent"
                            : "border-border hover:bg-muted/60"
                        }`}
                      >
                        <RadioGroupItem value={s.id} id={`svc-${s.id}`} />
                        <span className="flex-1 text-sm font-medium">{s.name}</span>
                        <span className="text-sm font-semibold text-primary-deep">
                          {formatPrice(s.price)}
                        </span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                  Назад к услугам
                </button>
                <p className="text-sm text-muted-foreground">
                  Заполните данные пациента — мы подтвердим запись по телефону.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="g-name">ФИО</Label>
                  <Input
                    id="g-name"
                    value={guest.name}
                    onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                    placeholder="Петров Пётр Петрович"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-email">Email</Label>
                  <Input
                    id="g-email"
                    type="email"
                    value={guest.email}
                    onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                    placeholder="patient@mail.ru"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-phone">Телефон</Label>
                  <Input
                    id="g-phone"
                    type="tel"
                    value={guest.phone}
                    onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67"
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-birth">Дата рождения</Label>
                  <Input
                    id="g-birth"
                    type="date"
                    value={guest.birthdate}
                    max={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setGuest({ ...guest, birthdate: e.target.value })}
                  />
                  {errors.birthdate && (
                    <p className="text-xs text-destructive">{errors.birthdate}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {!done && step !== 1 && (
          <div className="border-t border-border px-5 py-4">
            {step === 2 ? (
              <Button
                className="w-full"
                disabled={!serviceId}
                onClick={() => (user ? submit() : setStep(3))}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {user ? "Подтвердить запись" : "Продолжить"}
              </Button>
            ) : (
              <Button className="w-full" disabled={saving} onClick={submit}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Подтвердить запись
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
