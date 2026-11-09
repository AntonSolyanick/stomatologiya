import { createFileRoute, Outlet } from "@tanstack/react-router";
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

function DoctorLayout() {
  return (
    <DoctorRoute>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </div>
    </DoctorRoute>
  );
}
