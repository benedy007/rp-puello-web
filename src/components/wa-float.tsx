import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { WhatsAppLink } from "@/components/whatsapp-link";
import { defaultWaMessage } from "@/lib/site";

/** Páginas con el formulario: no se muestra nada fijo para no tapar campos. */
const FORM_PAGES = new Set(["/solicitar", "/contacto"]);

/**
 * Móvil: una sola barra inferior fija «Solicitar | WhatsApp» (antes 4 píldoras
 * flotantes que tapaban contenido). Un espaciador del mismo alto evita que la
 * barra cubra el final de la página.
 * Escritorio: un botón discreto de WhatsApp en la esquina.
 * Contraste: texto paper sobre brand 5,5:1 y sobre whatsapp 5,7:1.
 */
export function WaFloat() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (FORM_PAGES.has(path)) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(4.5rem+env(safe-area-inset-bottom))] bg-ink lg:hidden"
      />
      <nav
        aria-label="Acciones rápidas"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-paper/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <Link
            to="/solicitar"
            className="inline-flex h-12 items-center justify-center rounded-md bg-brand px-4 text-base font-semibold text-paper transition-colors duration-150 hover:bg-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Solicitar
          </Link>
          <WhatsAppLink
            message={defaultWaMessage}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-whatsapp px-4 text-base font-semibold text-paper transition-colors duration-150 hover:bg-whatsapp-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            WhatsApp
          </WhatsAppLink>
        </div>
      </nav>
      <WhatsAppLink
        message={defaultWaMessage}
        className="fixed right-6 bottom-6 z-30 hidden h-11 items-center gap-2 rounded-full bg-whatsapp px-5 text-sm font-medium text-paper shadow-soft transition-colors duration-150 hover:bg-whatsapp-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        WhatsApp
      </WhatsAppLink>
    </>
  );
}
