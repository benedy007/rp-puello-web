import { requirements } from "@/lib/site";

export function Requirements({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-display">
        Requisitos
      </h2>
      <ul className="mt-4 space-y-2 text-sm">
        {requirements.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-brand" aria-hidden>
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {!compact ? (
        <p className="mt-4 text-sm text-muted">
          Se requiere un garante y una referencia personal. La aprobación está
          sujeta a evaluación.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted">
          Se requiere un garante y una referencia personal. La aprobación está
          sujeta a evaluación.
        </p>
      )}
    </div>
  );
}
