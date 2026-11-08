import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Sparkles, ShieldCheck, HeartPulse, Microscope, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-abstract.jpg";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CLINIC, doctorsQuery } from "@/lib/clinic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Стоматология — частный стоматолог в Луганске" },
      {
        name: "description",
        content:
          "Стоматолог-терапевт и ортопед. 10 лет практики. Онлайн-запись на приём в Луганске.",
      },
      { property: "og:title", content: "Стоматология — частный стоматолог в Луганске" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "10 лет практики, безболезненное лечение и гарантия на работы. Запишитесь онлайн.",
      },
    ],
  }),
  component: Index,
});

const advantages = [
  {
    icon: Microscope,
    title: "Современное оборудование",
    text: "Цифровая диагностика, микроскоп и оптика для точного лечения каналов.",
  },
  {
    icon: HeartPulse,
    title: "Безболезненное лечение",
    text: "Многоступенчатая анестезия и щадящие протоколы без стресса для пациента.",
  },
  {
    icon: ShieldCheck,
    title: "Гарантия на работы",
    text: "Письменная гарантия на пломбы, коронки и имплантацию с наблюдением.",
  },
  {
    icon: Sparkles,
    title: "Стерильность",
    text: "Одноразовые наборы и контроль обработки инструментов по каждому приёму.",
  },
];

function Index() {
  return (
    <>
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <p className="animate-rise text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Частная практика в Луганске
          </p>
          <h1 className="animate-rise mt-4 text-4xl font-extrabold text-primary-deep sm:text-5xl lg:text-6xl">
            {CLINIC.name}
          </h1>
          <p className="animate-rise mt-4 text-lg font-medium text-primary-deep">
            {CLINIC.role}
          </p>
          <p className="animate-rise mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            10 лет практики. Индивидуальный подход к каждому.
          </p>
          <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/calendar">Записаться на прием</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <Link to="/services">Услуги и цены</Link>
            </Button>
          </div>
        </div>
      </section>

      <Specialists />

      <section className="bg-soft-gradient">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="surface-card mx-auto flex max-w-md items-start gap-3 p-5">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Адрес кабинета</p>
              <p className="mt-1 text-sm text-muted-foreground">{CLINIC.address}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Почему пациенты возвращаются</h2>
          <p className="mt-3 text-muted-foreground">
            Спокойная клиника без конвейера: один врач ведёт лечение от диагностики до контрольного
            осмотра.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((a) => (
            <article key={a.title} className="surface-card p-6 hover:shadow-float">
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-mint text-mint-foreground">
                <a.icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{a.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Свободное время уже видно в календаре
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Выберите дату, час и услугу — запись займёт меньше минуты.
          </p>
          <Button asChild size="lg">
            <Link to="/calendar">Открыть календарь записи</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Specialists() {
  const { data: doctors = [], isLoading } = useQuery(doctorsQuery);
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Наши специалисты</h2>
        <p className="mt-3 text-muted-foreground">Выберите врача и запишитесь на удобное время.</p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 1 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
          : doctors.map((d) => (
              <article key={d.id} className="flex flex-col p-6 surface-card hover:shadow-float">
                <div className="flex items-center gap-4">
                  <span className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-mint text-mint-foreground">
                    {d.photo_url ? (
                      <img src={d.photo_url} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <Stethoscope className="size-7" />
                    )}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{d.specialization}</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold text-primary">Стаж {d.experience_years} лет</p>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{d.bio}</p>
                <Button asChild className="mt-5 w-full">
                  <Link to="/calendar" search={{ doctor: d.id }}>Записаться</Link>
                </Button>
              </article>
            ))}
      </div>
    </section>
  );
}
