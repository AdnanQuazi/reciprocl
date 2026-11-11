import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive",
        outline:
          "border border-input bg-card text-card-foreground shadow-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-75",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground disabled:opacity-75",
        navigation:
          "justify-start text-xs font-medium text-secondary-foreground hover:bg-muted hover:text-foreground disabled:opacity-90",
        filter:
          "border-b-2 border-transparent text-muted-foreground aria-pressed:border-foreground aria-pressed:font-semibold aria-pressed:text-foreground disabled:opacity-100",
        view:
          "text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground aria-pressed:disabled:opacity-100",
        page:
          "text-muted-foreground hover:bg-muted aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:disabled:opacity-100",
        supporting:
          "flex-col items-start justify-start border border-dashed border-border bg-card/50 text-left font-normal whitespace-normal text-card-foreground disabled:opacity-100",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        compact: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5 md:h-auto md:px-3 md:py-1.5 md:text-xs md:has-[>svg]:px-3",
        filter: "h-auto rounded-none px-0 pt-0 pb-2 text-xs",
        page: "size-8 md:size-7 md:text-xs",
        pagination: "h-8 gap-1 px-2.5 md:h-7 md:text-xs",
        tile: "h-auto gap-3 rounded-lg p-5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
