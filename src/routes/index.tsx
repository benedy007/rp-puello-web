import { createFileRoute, Link } from "@tanstack/react-router";
import { ResponsiveImage } from "@/components/responsive-image";
import { halfColumnSizes, images } from "@/lib/images";
import { Clock, Shield, House, Handshake, MapPin, Table2 } from "lucide-react";
import { Requirements } from "@/components/requirements";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { WhatsAppLink } from "@/components/whatsapp-link";
import {
  benefits,
  cities,
  defaultWaMessage,
  formatRD,
  pageHead,
  plan10,
  site,
  steps,
} from "@/lib/site";

const icons = [Clock, Shield, House, Handshake];

const homeDescription =
  `Préstamos semanales de ${site.legal} en ${site.city}, ${site.province}. Cuota fija, garante requerido y pago en tu casa o por transferencia. WhatsApp ${site.phoneDisplay}.`;

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageHead("/", `Préstamos semanales · ${site.legal}`, homeDescription),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: site.legal,
          slogan: site.tagline,
          telephone: site.phoneE164,
          url: site.url,
          address: {
            "@type": "PostalAddress",
            addressLocality: site.officeCity,
            addressRegion: site.officeProvince,
            addressCountry: "DO",
          },
          areaServed: `${site.city}, ${site.province}`,
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  const from = formatRD(plan10[0].amount);
  const to = formatRD(plan10[plan10.length - 1].amount);

  return (
    <SiteShell>
      <main>
        <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
          <ResponsiveImage
            set={images.hero}
            mobile={images.heroMovil}
            sizes="100vw"
            priority
            alt="Asesoría de préstamo en una oficina"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/60" />
          <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-end px-5 pb-24 pt-24 sm:px-8 sm:pb-20">
            <div className="hero-copy max-w-2xl text-paper">
              <p className="text-kicker font-medium uppercase tracking-kicker text-paper/70">
                {site.legal} · Préstamos en {site.city}
              </p>
              <h1 className="mt-4 font-display text-display font-semibold leading-none tracking-display">
                Préstamos semanales, sin vueltas.
              </h1>
              <p className="mt-6 max-w-lg text-lede text-paper/80">
                {site.tagline}. De {from} a {to}. Aprobación rápida, total
                discreción y pago cómodo semana a semana.
              </p>
              <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
                <Button asChild variant="cream" size="lg">
                  <Link to="/solicitar">Llenar formulario</Link>
                </Button>
                <Button asChild variant="whatsapp" size="lg">
                  <WhatsAppLink message={defaultWaMessage}>
                    WhatsApp
                  </WhatsAppLink>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="h-auto min-h-12 gap-2 whitespace-normal border border-paper/50 bg-ink/30 px-3 py-2 text-center leading-tight text-paper hover:bg-paper/15"
                >
                  <Link to="/cobertura">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    Zona de cobertura
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="h-auto min-h-12 gap-2 whitespace-normal border border-paper/50 bg-ink/30 px-3 py-2 text-center leading-tight text-paper hover:bg-paper/15"
                >
                  <Link to="/planes">
                    <Table2 className="size-4 shrink-0" aria-hidden="true" />
                    Tabla de cuotas
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((item, i) => {
              const Icon = icons[i] ?? Clock;
              return (
                <article key={item.title}>
                  <span className="flex size-10 items-center justify-center rounded-sm bg-paper-2 text-brand">
                    <Icon className="size-4" />
                  </span>
                  <h2 className="mt-4 font-display text-xl font-semibold">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-muted">{item.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <Requirements />
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <SectionHeading
            eyebrow="Cómo funciona"
            title="Cuatro pasos. Paga a tu ritmo."
            lede="Rápido, fácil y sin complicaciones. Estamos para ayudarte."
          />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <li
                key={step.n}
                className="rounded-xl border border-border bg-paper p-6"
              >
                <p className="font-display text-sm font-semibold tabular-nums text-brand">
                  {step.n}
                </p>
                <h3 className="mt-3 font-display text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-paper-2">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2">
            <ResponsiveImage
              set={images.acuerdo}
              sizes={halfColumnSizes}
              alt="Apretón de manos al cerrar un acuerdo de préstamo"
              className="aspect-photo w-full rounded-xl object-cover shadow-soft"
            />
            <div>
              <SectionHeading
                eyebrow="Planes"
                title="Tablas claras. Cuota fija."
                lede="Elige 10 o 13 semanas. Ves el monto, la cuota semanal y el total antes de pedir. Sin letra chiquita escondida."
              />
              <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
                <Button asChild>
                  <Link to="/planes">Ver tablas</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/solicitar">Llenar solicitud</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <ResponsiveImage
            set={images.pueblo}
            mobile={images.puebloMovil}
            sizes="100vw"
            alt="Plaza de un pueblo dominicano"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/65" />
          <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8">
            <SectionHeading
              invert
              eyebrow="Cobertura"
              title={`Prestamos en ${site.city}.`}
              lede={`Por ahora prestamos solo en ${site.city}, provincia ${site.province}. Si vives cerca, escríbenos y te decimos claro si llegamos.`}
            />
            <div className="mt-8 flex flex-wrap gap-2">
              {cities.map((city) => (
                <a
                  key={city.name}
                  href={`/solicitar?ciudad=${encodeURIComponent(city.name)}`}
                  className="rounded-full border border-paper/30 px-3 py-1 text-sm text-paper hover:bg-paper hover:text-ink"
                >
                  {city.name}
                </a>
              ))}
            </div>
            <Button asChild variant="cream" className="mt-8">
              <Link to="/cobertura">Ver cobertura</Link>
            </Button>
          </div>
        </section>

        <section className="bg-brand">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="font-display text-3xl font-semibold tracking-display text-paper">
              ¿Necesitas un préstamo esta semana?
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="cream" size="lg">
                <Link to="/solicitar">Solicitar ahora</Link>
              </Button>
              <Button asChild variant="ink" size="lg">
                <WhatsAppLink message={defaultWaMessage}>Llamar / WhatsApp</WhatsAppLink>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
