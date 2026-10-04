import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-medium tracking-wide transition-[background-color,color,border-color,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        primary: "bg-brand text-paper hover:bg-brand-deep",
        ink: "bg-ink text-paper hover:bg-ink-soft",
        outline:
          "border border-border-strong bg-transparent text-ink hover:bg-paper-2",
        ghost: "bg-transparent text-ink hover:bg-paper-2",
        cream: "bg-paper text-ink hover:bg-paper-2",
        whatsapp: "bg-whatsapp text-paper hover:bg-whatsapp-deep",
        red: "bg-red text-paper hover:bg-red-deep",
      },
      size: {
        sm: "h-10 rounded-sm px-4",
        md: "h-11 rounded-sm px-5",
        lg: "h-12 rounded-md px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
