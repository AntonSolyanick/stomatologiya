import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Menu, X, LogOut, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { CLINIC } from "@/lib/clinic";

const links = [
  { to: "/", label: "Главная" },
  { to: "/services", label: "Услуги" },
  { to: "/calendar", label: "Запись" },
] as const;

const doctorLinks = [
  { to: "/doctor", label: "Дашборд" },
  { to: "/doctor/appointments", label: "Записи" },
  { to: "/doctor/patients", label: "Пациенты" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, loading, isDoctor } = useProfile();
  const nav = isDoctor ? doctorLinks : links;
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="font-display text-base font-extrabold tracking-tight sm:text-lg">
          {CLINIC.name}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" || l.to === "/doctor" }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              {!isDoctor && <Button asChild variant="ghost" size="sm">
                <Link to="/my-appointments">
                  <CalendarCheck className="size-4" />
                  Мои записи
                </Link>
              </Button>}
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="size-4" />
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Войти</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Регистрация</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Меню"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-border/70 bg-background/95 transition-[max-height,opacity] duration-300 md:hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
          {nav.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              activeOptions={{ exact: l.to === "/" || l.to === "/doctor" }}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            {user ? (
              <>
                {!isDoctor && <Button asChild variant="outline">
                  <Link to="/my-appointments" onClick={() => setOpen(false)}>
                    Мои записи
                  </Link>
                </Button>}
                <Button variant="ghost" onClick={signOut}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    Войти
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/register" onClick={() => setOpen(false)}>
                    Регистрация
                  </Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
