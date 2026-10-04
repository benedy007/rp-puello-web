import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know the custom theme tokens declared in `src/styles.css`
 * (`@theme`). Without this, `text-section` / `text-kicker` / `text-lede` are
 * treated as text *colors* and silently dropped when combined with a color
 * class such as `text-ink` or `text-muted`, flattening the heading hierarchy.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["kicker", "body", "lede", "section", "display"],
      tracking: ["kicker", "display"],
      shadow: ["soft"],
      aspect: ["photo", "portrait", "wide", "land"],
      ease: ["out"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
