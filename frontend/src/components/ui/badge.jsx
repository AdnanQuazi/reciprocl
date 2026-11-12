import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-0.5 font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/30 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground text-xs [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground text-xs [a&]:hover:bg-secondary/90",
        success: "type-micro rounded-full border-0 bg-success text-success-foreground",
        info: "type-micro rounded-sm border-0 bg-info px-1.5 text-info-foreground",
        subtle: "type-micro border-0 px-0 py-0 text-muted-foreground",
        destructive:
          "bg-destructive text-destructive-foreground text-xs focus-visible:ring-destructive [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground text-xs [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "text-xs [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary text-xs underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
