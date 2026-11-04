import { supabase } from "@/integrations/supabase/client";
import { SERVICES } from "./services-data";

export const CLINIC = {
  doctor: "Иванов Иван Иванович",
  role: "Стоматолог-терапевт, ортопед",
  name: "Стоматология",
  address: "г. Москва, ул. Примерная, д. 10, каб. 25",
  phone: "+7 (495) 123-45-67",
  phoneHref: "+74951234567",
  hours: "Пн–Сб: 09:00–19:00, Вс — выходной",
};

/** Рабочие часы приёма: начало каждого слота. */
export const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sort_order: number;
};

export type Appointment = {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
};

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value) + " ₽";

export const servicesQuery = {
  queryKey: ["services"],
  queryFn: async (): Promise<Service[]> => SERVICES,
  initialData: SERVICES,
  staleTime: Infinity,
};

export type Doctor = {
  id: string;
  user_id: string | null;
  full_name: string;
  specialization: string;
  experience_years: number;
  bio: string;
  photo_url: string | null;
  work_hours: Record<string, [string, string] | null>;
};

export const doctorsQuery = {
  queryKey: ["doctors"],
  queryFn: async (): Promise<Doctor[]> => {
    const { data, error } = await supabase
      .from("doctors")
      .select("id, user_id, full_name, specialization, experience_years, bio, photo_url, work_hours")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as Doctor[];
  },
  staleTime: 5 * 60 * 1000,
};

export type AppointmentStatus = "confirmed" | "cancelled" | "completed";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  completed: "Завершена",
};

export const STATUS_CLASS: Record<AppointmentStatus, string> = {
  confirmed: "bg-accent text-accent-foreground",
  cancelled: "bg-muted text-muted-foreground",
  completed: "bg-mint text-mint-foreground",
};

/** Ошибка занятого слота (уникальный индекс в базе). */
export const isSlotTaken = (e: unknown) => {
  const err = e as { code?: string; message?: string } | null;
  return err?.code === "23505" || /занят/i.test(err?.message ?? "");
};
export const SLOT_TAKEN_MESSAGE = "Этот слот уже занят, выберите другое время";

/** Занятые слоты врача за период — только дата и время, без персональных данных. */
export function bookedSlotsQuery(doctorId: string | null, from: string, to: string) {
  return {
    queryKey: ["booked-slots", doctorId, from, to],
    enabled: !!doctorId,
    queryFn: async (): Promise<Record<string, string[]>> => {
      const { data, error } = await supabase.rpc("booked_slots", {
        p_doctor_id: doctorId!,
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      const map: Record<string, string[]> = {};
      for (const row of (data ?? []) as {
        appointment_date: string;
        appointment_time: string;
      }[]) {
        const time = row.appointment_time.slice(0, 5);
        map[row.appointment_date] = [...(map[row.appointment_date] ?? []), time];
      }
      return map;
    },
  };
}

export async function bookAppointment(input: {
  doctorId: string;
  serviceId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  birthdate?: string | null;
  patientId?: string | null;
}) {
  const { data, error } = await supabase.rpc("book_appointment", {
    p_doctor_id: input.doctorId,
    p_service_id: input.serviceId,
    p_date: input.date,
    p_time: input.time,
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone,
    ...(input.birthdate ? { p_birthdate: input.birthdate } : {}),
    ...(input.patientId ? { p_patient_id: input.patientId } : {}),
  });
  if (error) {
    if (isSlotTaken(error)) throw Object.assign(new Error(SLOT_TAKEN_MESSAGE), { code: "23505" });
    throw new Error(error.message);
  }
  return data as string;
}

export async function cancelMyAppointment(id: string) {
  const { error } = await supabase.rpc("cancel_my_appointment", { p_id: id });
  if (error) throw new Error(error.message);
}

/** Смена статуса или переноса приёма врачом (RLS: только свои приёмы). */
export async function updateAppointment(
  id: string,
  patch: { status?: AppointmentStatus; appointment_date?: string; appointment_time?: string },
) {
  const { error } = await supabase.from("appointments").update(patch).eq("id", id);
  if (error) {
    if (isSlotTaken(error)) throw new Error(SLOT_TAKEN_MESSAGE);
    throw new Error(error.message);
  }
}

/** Удаление записи врачом (RLS: только приёмы этого врача, независимо от автора). */
export async function deleteAppointment(id: string) {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Лимит активных записей для пациента (врачу не применяется). */
export const PATIENT_ACTIVE_LIMIT = 2;

export type DoctorAppointment = {
  id: string;
  user_id: string | null;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  patient_birthdate: string | null;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  services: { name: string; price: number } | null;
};

/** Все приёмы текущего врача (RLS ограничивает строками этого врача). */
export const doctorAppointmentsQuery = {
  queryKey: ["doctor-appointments"],
  queryFn: async (): Promise<DoctorAppointment[]> => {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        "id, user_id, patient_name, patient_email, patient_phone, patient_birthdate, appointment_date, appointment_time, status, services(name, price)",
      )
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as DoctorAppointment[];
  },
};

export async function searchPatients(query: string) {
  const { data, error } = await supabase.rpc("doctor_search_patients", { p_query: query });
  if (error) throw new Error(error.message);
  return (data ?? []) as {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    birthdate: string | null;
  }[];
}
