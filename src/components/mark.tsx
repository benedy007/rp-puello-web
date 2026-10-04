import { cn } from "@/lib/utils";
import { images } from "@/lib/images";

const logo = images.logo;

export function Mark({ className }: { className?: string }) {
  return (
    <img
      src={`/images/${logo.name}-128.webp`}
      srcSet={logo.widths.map((w) => `/images/${logo.name}-${w}.webp ${w}w`).join(", ")}
      sizes="56px"
      width={logo.width}
      height={logo.height}
      alt="Logo de RP Puello & Asociados"
      decoding="async"
      className={cn("size-12 object-contain", className)}
    />
  );
}
