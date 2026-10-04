import { createFileRoute } from "@tanstack/react-router";
import { FaqList } from "@/components/faq-list";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { faqs, pageHead } from "@/lib/site";

const description =
  "Preguntas sobre préstamos semanales de RP Puello & Asociados: montos, cuotas, costo, mora, garante, pago y cobertura en Cotuí.";

export const Route = createFileRoute("/preguntas")({
  head: () => ({
    ...pageHead("/preguntas", "Preguntas · RP Puello & Asociados", description),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
    ],
  }),
  component: PreguntasPage,
});

function PreguntasPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        <SectionHeading
          as="h1"
          eyebrow="Preguntas"
          title="Lo que más nos preguntan."
          lede="Respuestas cortas. Si te queda una duda, escríbenos por WhatsApp."
        />
        <div className="mt-10">
          <FaqList />
        </div>
      </main>
    </SiteShell>
  );
}
