import { createFileRoute, Link } from "@tanstack/react-router";
import { LoanCost } from "@/components/loan-cost";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  formatRD,
  pageHead,
  plan10,
  plan13,
  site,
  totalPay,
  type LoanOption,
  type PlanId,
} from "@/lib/site";

export const Route = createFileRoute("/planes")({
  head: () =>
    pageHead(
      "/planes",
      `Tabla de cuotas · ${site.legal}`,
      "Tabla vigente de préstamos semanales en Cotuí: 10 semanas desde RD$ 5,000 y 13 semanas desde RD$ 50,000. Cargo de 30%, cuota fija.",
    ),
  component: PlanesPage,
});

function PlanesPage() {
  return (
    <SiteShell>
      <main>
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-14 sm:px-8">
          <SectionHeading
            as="h1"
            eyebrow="Planes"
            title="Paga cómodo, semana a semana."
            lede="Dos plazos. Elige el monto, mira la cuota y solicita. Las cifras son las de nuestra tabla vigente."
          />
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 sm:px-8 lg:grid-cols-2">
          <PlanTable
            weeks={10}
            title="Préstamos de 10 semanas"
            accent="brand"
            rows={plan10}
          />
          <PlanTable
            weeks={13}
            title="Préstamos de 13 semanas"
            accent="ink"
            rows={plan13}
          />
          <LoanCost className="lg:col-span-2" />
        </section>

        <section className="border-t border-border bg-paper-2">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-5 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="max-w-xl text-muted">
              ¿Ya viste el monto? Llena la solicitud y te contactamos por
              WhatsApp. La aprobación está sujeta a evaluación.
            </p>
            <Button asChild size="lg">
              <Link to="/solicitar">Solicitar este plan</Link>
            </Button>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

function PlanTable({
  weeks,
  title,
  rows,
  accent,
}: {
  weeks: PlanId;
  title: string;
  rows: LoanOption[];
  accent: "brand" | "ink";
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-paper shadow-soft">
      <div
        className={
          accent === "brand"
            ? "bg-brand px-6 py-5 text-paper"
            : "bg-ink px-6 py-5 text-paper"
        }
      >
        <p className="text-kicker font-medium uppercase tracking-kicker text-paper/70">
          {weeks} semanas
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-80 text-sm">
          <thead>
            <tr className="border-b border-border text-left text-kicker font-medium uppercase tracking-kicker text-muted">
              <th className="px-4 py-3 sm:px-6">Monto</th>
              <th className="px-4 py-3 sm:px-6">Cuota</th>
              <th className="px-4 py-3 sm:px-6">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.amount}
                className={i % 2 ? "bg-paper-2/60" : "bg-paper"}
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums sm:px-6">
                  {formatRD(row.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted sm:px-6">
                  {formatRD(row.weekly)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted sm:px-6">
                  {formatRD(totalPay(row.weekly, weeks))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
