import type { ReactNode } from "react";
import { track, withUtm } from "@/lib/analytics";
import { waLink } from "@/lib/site";

export function WhatsAppLink({
  message,
  children,
  className,
  event = "whatsapp_click",
}: {
  message: string;
  children: ReactNode;
  className?: string;
  event?: string;
}) {
  return (
    <a
      href={withUtm(waLink(message))}
      className={className}
      onClick={() => track(event, { page_path: window.location.pathname })}
    >
      {children}
    </a>
  );
}
