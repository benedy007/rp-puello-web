import { srcSet, type ImageSet } from "@/lib/images";
import { cn } from "@/lib/utils";

export function ResponsiveImage({
  set,
  mobile,
  alt,
  sizes,
  className,
  priority = false,
}: {
  set: ImageSet;
  /** Recorte alternativo para pantallas < 640 px (dirección de arte). */
  mobile?: ImageSet;
  alt: string;
  sizes: string;
  className?: string;
  /** true solo para la imagen LCP de la página: carga inmediata y prioridad alta. */
  priority?: boolean;
}) {
  const fallbackWidth = set.widths[Math.min(1, set.widths.length - 1)];
  // <picture> usa `display: contents`; sin `hidden`, cada <source> vacío ocupaba
  // una celda en los contenedores grid (la foto se corría a la 2.ª columna).
  // `display: none` no afecta la elección de la fuente.
  return (
    <picture className="contents">
      {mobile?.avif ? (
        <source
          className="hidden"
          media="(max-width: 639px)"
          type="image/avif"
          srcSet={srcSet(mobile, "avif")}
          sizes="100vw"
          width={mobile.width}
          height={mobile.height}
        />
      ) : null}
      {mobile ? (
        <source
          className="hidden"
          media="(max-width: 639px)"
          type="image/webp"
          srcSet={srcSet(mobile, "webp")}
          sizes="100vw"
          width={mobile.width}
          height={mobile.height}
        />
      ) : null}
      {set.avif ? <source className="hidden" type="image/avif" srcSet={srcSet(set, "avif")} sizes={sizes} /> : null}
      <img
        src={`/images/${set.name}-${fallbackWidth}.webp`}
        srcSet={srcSet(set, "webp")}
        sizes={sizes}
        width={set.width}
        height={set.height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn(className)}
      />
    </picture>
  );
}
