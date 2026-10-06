import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";

export function DoctorRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfile();
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (profile?.role !== "doctor") return <Navigate to="/" />;
  return <>{children}</>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    confirmed: ["Подтверждена", "bg-accent text-accent-foreground"],
    cancelled: ["Отменена", "bg-muted text-muted-foreground"],
    completed: ["Завершена", "bg-mint text-mint-foreground"],
  };
  const [label, cls] = map[status] ?? [status, "bg-muted text-muted-foreground"];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
