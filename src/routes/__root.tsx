import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "RP Puello & Asociados";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "RP Puello & Asociados. Préstamos semanales en Cotuí (Sánchez Ramírez). Oficina en Nagua. Rápidos, fáciles y sin complicaciones. WhatsApp 809-753-5335.",
      },
      { name: "theme-color", content: "#C8102E" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      // Fuentes autoalojadas en public/fonts (antes: CSS bloqueante de Google Fonts).
      // Se precarga solo el subconjunto latin, que cubre el español.
      {
        rel: "preload",
        href: "/fonts/manrope-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/outfit-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
