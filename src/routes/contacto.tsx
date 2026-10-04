import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveImage } from "@/components/responsive-image";
import { halfColumnSizes, images } from "@/lib/images";
import { Building2, Clock, Facebook, MapPin, Phone } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { LoanForm } from "@/components/loan-form";
import { WhatsAppLink } from "@/components/whatsapp-link";
import { defaultWaMessage, pageHead, site } from "@/lib/site";

export const Route = createFileRoute("/contacto")({
  head: () =>
    pageHead(
      "/contacto",
      `Contacto · ${site.legal}`,
      `Escríbele a ${site.legal} por WhatsApp ${site.phoneDisplay}. Oficina en ${site.address}. Préstamos semanales solo en ${site.city}.`,
    ),
  component: ContactoPage,
});

function ContactoPage() {
  return (
    <SiteShell>
      <main className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
        <div>
          <SectionHeading
            as="h1"
            eyebrow="Contacto"
            title="Escríbenos. Te respondemos."
            lede="WhatsApp es el camino más rápido. También puedes llenar la solicitud y te llega el mensaje armado."
          />

          <ul className="mt-10 space-y-5">
            <li>
              <WhatsAppLink
                message={defaultWaMessage}
                className="flex items-start gap-4 hover:opacity-80"
              >
                <span className="flex size-10 items-center justify-center rounded-sm bg-paper-2 text-brand">
                  <Phone className="size-4" />
                </span>
                <span>
                  <span className="block text-kicker font-medium uppercase tracking-kicker text-muted">
                    WhatsApp
                  </span>
                  <span className="text-ink">{site.phoneDisplay}</span>
                </span>
              </WhatsAppLink>
            </li>
            <li>
              <a
                href={site.facebookHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 hover:opacity-80"
              >
                <span className="flex size-10 items-center justify-center rounded-sm bg-paper-2 text-brand">
                  <Facebook className="size-4" />
                </span>
                <span>
                  <span className="block text-kicker font-medium uppercase tracking-kicker text-muted">
                    Facebook
                  </span>
                  <span className="text-ink underline underline-offset-2">{site.facebookName}</span>
                </span>
              </a>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex size-10 items-center justify-center rounded-sm bg-paper-2 text-brand">
                <Building2 className="size-4" />
              </span>
              <span>
                <span className="block text-kicker font-medium uppercase tracking-kicker text-muted">
                  Oficina
                </span>
                <span className="text-ink">{site.address}</span>
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex size-10 items-center justify-center rounded-sm bg-paper-2 text-brand">
                <MapPin className="size-4" />
              </span>
              <span>
                <span className="block text-kicker font-medium uppercase tracking-kicker text-muted">
                  Prestamos en
                </span>
                <span className="text-ink">
                  Solo {site.city}, provincia {site.province} (por ahora)
                </span>
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex size-10 items-center justify-center rounded-sm bg-paper-2 text-brand">
                <Clock className="size-4" />
              </span>
              <span>
                <span className="block text-kicker font-medium uppercase tracking-kicker text-muted">
                  Atención
                </span>
                <span className="text-ink">Lunes a sábado · WhatsApp todo el día</span>
              </span>
            </li>
          </ul>

          <ResponsiveImage
            set={images.local}
            sizes={halfColumnSizes}
            alt="Calle de un pueblo dominicano"
            className="mt-10 aspect-wide w-full rounded-xl object-cover"
          />
        </div>

        <div>
          <LoanForm />
        </div>
      </main>
    </SiteShell>
  );
}
