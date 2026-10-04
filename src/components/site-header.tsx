import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mark } from "@/components/mark";
import { cn } from "@/lib/utils";
import { navItems, site } from "@/lib/site";

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:h-20 sm:px-8">
          <Link
            to="/"
            className="min-w-0 flex-1 text-ink transition-opacity duration-150 hover:opacity-70"
          >
            <span className="flex items-center gap-2.5">
              <Mark className="size-12 shrink-0 sm:size-14" />
              <span className="min-w-0 leading-tight">
                <span className="block font-display text-base font-semibold tracking-display sm:text-lg">
                  {site.name}
                </span>
                <span className="block truncate text-kicker uppercase tracking-wide text-muted sm:tracking-kicker">
                  {site.nameLine2}
                </span>
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Principal">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "text-sm tracking-wide transition-colors duration-150",
                  pathname === item.to ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Button asChild size="sm" className="shrink-0 sm:h-11 sm:px-5">
            <Link to="/solicitar">Llenar formulario</Link>
          </Button>

          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 bg-paper px-5 pt-24 pb-10 lg:hidden">
          <button
            type="button"
            className="absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-sm text-ink"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
          <nav className="mx-auto flex max-w-md flex-col gap-3" aria-label="Móvil">
            <Button asChild size="lg" className="w-full">
              <Link to="/">Inicio</Link>
            </Button>
            {navItems.map((item) => (
              <Button key={item.to} asChild size="lg" className="w-full">
                <Link to={item.to}>{item.label}</Link>
              </Button>
            ))}
            <Button asChild size="lg" className="w-full">
              <Link to="/solicitar">Llenar formulario</Link>
            </Button>
          </nav>
        </div>
      ) : null}
    </>
  );
}
