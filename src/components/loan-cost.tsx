import { Info } from "lucide-react";
import { LATE_FEE_PERCENT, LOAN_CHARGE_PERCENT } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Costo y mora de RP Puello & Asociados. Ley 358-05, art. 53.
 * Cargo de 30% sobre el monto prestado en ambos plazos (total = 130%).
 * Mora: 5% del monto atrasado por cada semana de atraso.
 */
export function LoanCost({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-border-strong bg-paper-2 p-4 text-sm leading-relaxed text-ink",
        className,
      )}
    >
      <Info className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
      <div className="space-y-1">
        <p>
          <strong className="font-semibold">Costo del préstamo:</strong>{" "}
          {LOAN_CHARGE_PERCENT}% del monto prestado, a pagar en 10 o en 13 cuotas
          semanales.
        </p>
        <p>
          <strong className="font-semibold">Mora:</strong> {LATE_FEE_PERCENT}% del
          monto atrasado por cada semana de atraso.
        </p>
      </div>
    </div>
  );
}
