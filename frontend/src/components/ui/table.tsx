import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils"

const rowVariants = cva(
  "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
  { variants: { variant: { default: "", listing: "bg-card text-card-foreground" } }, defaultVariants: { variant: "default" } }
)

const headVariants = cva(
  "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
  { variants: { variant: { default: "", listing: "type-micro h-8 px-4 font-medium text-muted-foreground" } }, defaultVariants: { variant: "default" } }
)

const cellVariants = cva(
  "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
  { variants: { variant: { default: "", listing: "px-4 py-3.5" } }, defaultVariants: { variant: "default" } }
)

const bodyVariants = cva(
  "[&_tr:last-child]:border-0",
  { variants: { variant: { default: "", listing: "[&_tr:last-child]:border-b" } }, defaultVariants: { variant: "default" } }
)

function Table({
  className,
  containerProps,
  ...props
}: ComponentProps<"table"> & { containerProps?: ComponentProps<"div"> }) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      {...containerProps}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({
  className,
  ...props
}: ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({
  className,
  variant = "default",
  ...props
}: ComponentProps<"tbody"> & VariantProps<typeof bodyVariants>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(bodyVariants({ variant }), className)}
      {...props}
    />
  )
}

function TableFooter({
  className,
  ...props
}: ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({
  className,
  variant = "default",
  ...props
}: ComponentProps<"tr"> & VariantProps<typeof rowVariants>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        rowVariants({ variant }),
        className
      )}
      {...props}
    />
  )
}

function TableHead({
  className,
  variant = "default",
  ...props
}: ComponentProps<"th"> & VariantProps<typeof headVariants>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        headVariants({ variant }),
        className
      )}
      {...props}
    />
  )
}

function TableCell({
  className,
  variant = "default",
  ...props
}: ComponentProps<"td"> & VariantProps<typeof cellVariants>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        cellVariants({ variant }),
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
