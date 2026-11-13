import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils"

const inputVariants = cva(
  [
    "h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
  ],
  {
    variants: {
      variant: {
        default: "",
        search: "h-full border-0 bg-transparent px-0 py-0 text-xs shadow-none placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:ring-0 md:text-xs",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Input({
  className,
  type,
  variant = "default",
  ...props
}: ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        inputVariants({ variant }),
        className
      )}
      {...props}
    />
  )
}

export { Input }
