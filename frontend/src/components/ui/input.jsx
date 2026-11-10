import { cva } from "class-variance-authority";
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
        search: "md:text-xs",
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
}) {
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
