import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { DoctorRoute } from "@/components/DoctorRoute";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Кабинет врача — Стоматология" },
      { name: "description", content: "Закрытый кабинет врача: приёмы, пациенты и расписание." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Кабинет врача" },
      { property: "og:description", content: "Закрытый раздел для врачей клиники." },
    ],
  }),
  component: DoctorLayout,
});

const tabs = [
  { to: "/doctor", label: "Дашборд", exact: true },
  { to: "/doctor/appointments", label: "Записи", exact: false },
  { to: "/doctor/patients", label: "Пациенты", exact: false },
  { to: "/doctor/schedule", label: "Расписание", exact: false },
] as const;

function DoctorLayout() {
  return (
    <DoctorRoute>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <nav className="mb-8 flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-card text-foreground shadow-soft" }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <Outlet />
      </div>
    </DoctorRoute>
  );
}
