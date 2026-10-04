import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-sm border border-border bg-paper px-3 py-3 text-sm text-ink",
        "placeholder:text-subtle transition-[border-color,box-shadow] duration-150",
        "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
