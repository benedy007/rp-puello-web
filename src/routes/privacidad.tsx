import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { WhatsAppLink } from "@/components/whatsapp-link";
import { fraudNotice, pageHead, privacyWaMessage, site } from "@/lib/site";

const description =
  "RP Puello & Asociados usa la cédula solo para depurar el crédito. No pedimos depósitos, claves ni códigos.";

export const Route = createFileRoute("/privacidad")({
  head: () =>
    pageHead("/privacidad", "Privacidad · RP Puello & Asociados", description),
  /** ?desde=solicitar: llegó desde la casilla de autorización del formulario. */
  validateSearch: (search: Record<string, unknown>): { desde?: "solicitar" } =>
    search.desde === "solicitar" ? { desde: "solicitar" } : {},
  component: PrivacidadPage,
});

/** Vuelve a /solicitar; el formulario restaura el borrador (sessionStorage) y el paso. */
function BackToForm({ className }: { className?: string }) {
  return (
    <Button asChild variant="outline" size="lg" className={className}>
      <Link to="/solicitar" hash="formulario">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al formulario
      </Link>
    </Button>
  );
}

function PrivacidadPage() {
  const { desde } = Route.useSearch();
  const fromForm = desde === "solicitar";
  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        {fromForm ? <BackToForm className="mb-8" /> : null}
        <SectionHeading
          as="h1"
          eyebrow="Privacidad"
          title="Tu información se queda en tu caso."
          lede={`${site.legal} · ${site.address} · ${site.phoneDisplay}`}
        />
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
          <p>
            Responsable de tus datos: {site.legal}, con oficina en{" "}
            {site.officeCity}, provincia {site.officeProvince}, República
            Dominicana.
            Teléfono y WhatsApp:{" "}
            <span className="whitespace-nowrap">{site.phoneDisplay}</span>.
          </p>
          <p>
            La cédula la pedimos solo para depurar el crédito. No la usamos para
            otra cosa y no la publicamos.
          </p>
          <p>
            El teléfono, la dirección, el trabajo y las referencias sirven para
            evaluarte y coordinar el pago. El mensaje se arma en tu teléfono y
            se envía por WhatsApp a{" "}
            <span className="whitespace-nowrap">{site.phoneDisplay}</span>.
          </p>
          <p>
            Al enviar la solicitud nos autorizas, de forma expresa, a tratar tus
            datos personales y a consultar tu historial en un buró de crédito
            solo para evaluar el préstamo (Ley 172-13 de protección de datos).
            Sin esa autorización no podemos evaluar la solicitud.
          </p>
          <p>
            Mientras llenas el formulario, los datos se guardan temporalmente
            en este navegador (no en un servidor de la web) para que no los
            pierdas si cambias de pantalla. Se borran al enviar la solicitud por
            WhatsApp o al cerrar la pestaña.
          </p>
          <p>
            Si compartes la ubicación de tu casa, el navegador envía solo esas
            coordenadas a OpenStreetMap (Nominatim) para llenar el pueblo, el
            sector y la calle. No se envía tu nombre ni otros datos.
          </p>
          <p>
            Para evaluar tu solicitud consultamos tu historial crediticio en un
            buró de crédito.
          </p>
          <p>
            Conservamos tus datos mientras el préstamo esté vigente, es decir,
            mientras exista la deuda.
          </p>
          <p>
            Puedes pedir acceso, corrección o eliminación de tus datos
            escribiéndonos por WhatsApp al{" "}
            <WhatsAppLink
              message={privacyWaMessage}
              className="font-medium text-brand underline underline-offset-2"
            >
              {site.phoneDisplay}
            </WhatsAppLink>
            . Te respondemos por el mismo medio.
          </p>
          <p>{fraudNotice}</p>
          <p>La aprobación está sujeta a evaluación.</p>
        </div>
        {fromForm ? (
          <div className="mt-10">
            <BackToForm />
            <p className="mt-3 text-sm text-muted">
              Lo que ya llenaste sigue guardado en este navegador.
            </p>
          </div>
        ) : null}
      </main>
    </SiteShell>
  );
}
