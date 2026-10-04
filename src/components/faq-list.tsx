import { useState } from "react";
import { faqs } from "@/lib/site";

export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-paper">
      {faqs.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : index)}
            >
              {item.q}
              <span className="text-muted">{isOpen ? "–" : "+"}</span>
            </button>
            {isOpen ? (
              <p className="px-5 pb-4 text-sm leading-relaxed text-muted">
                {item.a}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
