import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Регистрация пациента — Стоматология Иванова" },
      {
        name: "description",
        content:
          "Создайте аккаунт пациента, чтобы записываться к стоматологу онлайн и хранить историю визитов.",
      },
      { property: "og:title", content: "Регистрация пациента" },
      {
        property: "og:description",
        content: "Аккаунт для онлайн-записи и истории приёмов у стоматолога Иванова.",
      },
    ],
  }),
  component: RegisterPage,
});

type Form = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  birthdate: string;
};

function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    birthdate: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof Form, string>> = {};
    if (!/^[^@\s]+@[^@\s]+\.[a-zA-Zа-яА-Я]{2,}$/.test(form.email.trim()))
      next.email = "Укажите корректный email";
    if (form.password.length < 6) next.password = "Минимум 6 символов";
    if (form.fullName.trim().length < 3) next.fullName = "Укажите фамилию, имя и отчество";
    if (form.phone.replace(/\D/g, "").length < 10)
      next.phone = "Укажите телефон в формате +7 (999) 123-45-67";
    if (!form.birthdate) next.birthdate = "Укажите дату рождения";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/login`,
        data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          birthdate: form.birthdate,
        },
      },
    });

    if (error) {
      setLoading(false);
      setErrors({
        email: error.message.includes("already registered")
          ? "Этот email уже зарегистрирован"
          : error.message,
      });
      return;
    }

    if (data.session && data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        birthdate: form.birthdate,
      });
      setLoading(false);
      toast.success("Аккаунт создан");
      router.navigate({ to: "/calendar" });
      return;
    }

    setLoading(false);
    toast.success("Проверьте почту — мы отправили ссылку для подтверждения");
    router.navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md surface-card p-7 sm:p-9">
        <h1 className="text-2xl font-extrabold">Регистрация</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Аккаунт нужен, чтобы видеть историю визитов и записываться в один клик.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">ФИО</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={set("fullName")}
              placeholder="Петров Пётр Петрович"
            />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              placeholder="patient@mail.ru"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+7 (999) 123-45-67"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthdate">Дата рождения</Label>
            <Input
              id="birthdate"
              type="date"
              max={format(new Date(), "yyyy-MM-dd")}
              value={form.birthdate}
              onChange={set("birthdate")}
            />
            {errors.birthdate && <p className="text-xs text-destructive">{errors.birthdate}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Создать аккаунт
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
