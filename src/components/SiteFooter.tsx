import { MapPin } from "lucide-react";
import { CLINIC } from "@/lib/clinic";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">{CLINIC.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {CLINIC.role}
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            {CLINIC.address}
          </p>
        </div>
        <p className="text-sm text-muted-foreground md:text-right">
          © {new Date().getFullYear()} {CLINIC.name}.
        </p>
      </div>
    </footer>
  );
}
