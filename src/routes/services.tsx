import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, servicesQuery } from "@/lib/clinic";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Услуги и цены — Стоматология Иванова" },
      {
        name: "description",
        content:
          "Прайс-лист стоматолога в Москве: консультация 500 ₽, гигиена 3 500 ₽, лечение кариеса 3 000 ₽, коронки и имплантация. Цены ниже средних по РФ.",
      },
      { property: "og:title", content: "Услуги и цены стоматолога Иванова" },
      {
        property: "og:description",
        content: "20 направлений лечения с прозрачными ценами и записью онлайн.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: services = [], isLoading } = useQuery(servicesQuery);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Прайс-лист</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Услуги и цены</h1>
        <p className="mt-3 text-muted-foreground">
          Стоимость указана за один визит и не меняется после начала лечения. Точный план врач
          составит на консультации.
        </p>
      </header>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))
          : services.map((s) => (
              <article key={s.id} className="flex flex-col p-6 surface-card hover:shadow-float">
                <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  {s.category}
                </span>
                <h2 className="mt-4 text-lg font-bold">{s.name}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.description}</p>
                <p className="mt-5 font-display text-2xl font-extrabold text-primary-deep">
                  {formatPrice(s.price)}
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link to="/calendar" search={{ service: s.id }}>
                    Записаться
                  </Link>
                </Button>
              </article>
            ))}
      </div>
    </div>
  );
}
