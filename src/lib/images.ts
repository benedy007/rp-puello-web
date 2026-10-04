/**
 * Variantes generadas en `public/images/<name>-<width>.{avif,webp}`
 * (fotos heredadas de la plantilla; el logo se genera con scripts/make-brand-assets.py).
 */
export type ImageSet = {
  name: string;
  widths: number[];
  /** Dimensiones intrínsecas de la variante más grande (evita saltos de layout). */
  width: number;
  height: number;
  /** Si existen variantes AVIF además de WebP. */
  avif?: boolean;
};

export const srcSet = (set: ImageSet, ext: "avif" | "webp") =>
  set.widths.map((w) => `/images/${set.name}-${w}.${ext} ${w}w`).join(", ");

export const images = {
  hero: { name: "hero", widths: [960, 1280, 1792], width: 1792, height: 1008, avif: true },
  heroMovil: { name: "hero-movil", widths: [420, 560], width: 560, height: 1008, avif: true },
  pueblo: { name: "pueblo", widths: [960, 1280, 1792], width: 1792, height: 1008, avif: true },
  puebloMovil: { name: "pueblo-movil", widths: [420, 604], width: 604, height: 1008, avif: true },
  acuerdo: { name: "acuerdo", widths: [480, 800, 1200], width: 1200, height: 900, avif: true },
  asesora: { name: "asesora", widths: [480, 720, 960], width: 960, height: 1280, avif: true },
  local: { name: "local", widths: [480, 800, 1200], width: 1200, height: 675, avif: true },
  logo: { name: "logo", widths: [64, 128, 192], width: 192, height: 192 },
} satisfies Record<string, ImageSet>;

/** Ancho de columna típico: media pantalla en escritorio, ancho completo menos márgenes en móvil. */
export const halfColumnSizes =
  "(min-width: 1152px) 536px, (min-width: 1024px) 45vw, calc(100vw - 40px)";
