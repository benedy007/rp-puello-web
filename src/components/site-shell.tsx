import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WaFloat } from "@/components/wa-float";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-paper text-ink">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <WaFloat />
    </div>
  );
}