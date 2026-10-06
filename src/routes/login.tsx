import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" && search["redirect"].startsWith("/")
      ? { redirect: search["redirect"] }
      : {},
  head: () => ({
    meta: [
      { title: "Вход в личный кабинет — Стоматология Иванова" },
      {
        name: "description",
        content: "Войдите, чтобы посмотреть свои записи к стоматологу и записаться в один клик.",
      },
      { property: "og:title", content: "Вход в личный кабинет пациента" },
      { property: "og:description", content: "Доступ к истории записей и быстрой записи на приём." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[^@\s]+@[^@\s]+\.[a-zA-Zа-яА-Я]{2,}$/.test(email.trim())) {
      setError("Укажите корректный email");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    setLoading(true);
    const { data: signIn, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (authError) {
      setError(
        authError.message.includes("Invalid login")
          ? "Неверный email или пароль"
          : authError.message.includes("not confirmed")
            ? "Подтвердите email по ссылке из письма"
            : authError.message,
      );
      return;
    }

    const profile = signIn.user ? await fetchProfile(signIn.user.id) : null;
    toast.success("Вы вошли в личный кабинет");
    if (profile?.role === "doctor") router.navigate({ to: "/doctor" });
    else router.history.push(redirect && !redirect.startsWith("/doctor") ? redirect : "/calendar");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md surface-card p-7 sm:p-9">
        <h1 className="text-2xl font-extrabold">Вход</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Войдите, чтобы видеть свои записи и записываться быстрее.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@mail.ru"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Войти
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
