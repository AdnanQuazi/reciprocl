# Frontend UI & Design System Guidelines

## Architecture & File Structure
- `src/components/ui/`: shadcn/ui primitives only. No business logic.
- `src/components/layout/`: app shell elements (Sidebar, TopNav, Header, PageContainer).
- `src/components/common/`: reusable, domain-agnostic components built by composing primitives.
- `src/features/[feature-name]/`: domain views, hooks, and logic. Feature components compose primitives and `common/` components and apply layout only.
- Do not edit `components/ui/*` except to (a) add or adjust a `cva` variant/size, or (b) fix a bug. Keep diffs small so shadcn upgrades stay easy.

## Single Source of Truth
All visual decisions (color, radius, typography, shadow) live in `globals.css` as CSS variables, and are exposed to Tailwind as semantic tokens (via `tailwind.config` or `@theme inline` in Tailwind v4). Changing the theme means editing `globals.css` only. Never touch feature components to re-theme.

## Semantic Theming (Zero Hardcoding)
FORBIDDEN in feature components, `common/`, `layout/`, and variants:
- Raw color values: hex, rgb(), hsl() literals, arbitrary values like `bg-[#121212]`, `text-[rgb(...)]`
- Palette steps: `bg-blue-600`, `text-slate-900`, `border-gray-200`, `text-white`, `bg-black`
- Arbitrary radius/shadow/font values: `rounded-[10px]`, `shadow-[...]`, `font-[...]`

ALWAYS use semantic tokens:
- Surfaces: `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-accent`, `bg-secondary`
- Text: `text-foreground`, `text-card-foreground`, `text-muted-foreground`, `text-primary-foreground`
- Borders/focus: `border-border`, `border-input`, `ring-ring`
- Brand: `bg-primary`, `text-primary`
- Status: `bg-success`, `bg-warning`, `bg-info`, `bg-destructive` (each with a matching `-foreground`)
- Charts: `chart-1` to `chart-5`
- Shape: `rounded-sm | rounded-md | rounded-lg` (derived from `--radius`)

## When a Needed Token Doesn't Exist
Do NOT improvise with a palette color, arbitrary value, or by misusing `bg-primary`. Instead:
1. Add a token pair (`--foo`, `--foo-foreground`) to `globals.css` for BOTH light (`:root`) and dark (`.dark`) themes.
2. Register it in the Tailwind theme (`tailwind.config` colors, or `@theme inline`).
3. Use it via the semantic class (`bg-foo`, `text-foo-foreground`).
Token names describe role, not appearance (`--success`, not `--green`).

## Styling Primitives (Button, Badge, Input, Card, etc.)
Decision order when styling a primitive. Stop at the first that applies:
1. **An existing variant/size fits:** use it via the prop (`<Button variant="destructive" size="sm">`).
2. **Only layout/spacing is needed:** pass it via `className`. Allowed: `w-full`, `flex-1`, `ml-auto`, `mt-4`, `self-end`, `shrink-0`, `hidden md:inline-flex`, `col-span-2`.
3. **A new appearance is needed:** add a named variant in the primitive's `cva` definition, then use `<Button variant="your-variant">` at the call site.

Never pass these through `className` on a primitive: color, background, border color/style, shadow, opacity-as-style, font family/size/weight, or hover/focus/active state styling. Those belong in variants.

Do not wrap primitives in extra `<div>`s to restyle them. Wrappers are for layout only.

## Variant Rules
- Name variants by intent, never by appearance: `success`, `subtle`, `brand`, `outline`, `ghost`. Never `green`, `emerald`, `big-blue`.
- Variants use semantic tokens only (`bg-primary`, `text-muted-foreground`, `border-border`), never palette steps or hex.
- Add a variant only when the look is reused (2+ places) or is clearly a system-level pattern. For a true one-off, reconsider whether an existing variant plus layout classes is enough before adding.
- Check existing variants first. Do not create near-duplicates.

## Components
- Use `lucide-react` for all icons; size via `size-4`/`size-5` or the primitive's icon sizing, not arbitrary pixels.
- Before building a new UI element, check `components/ui/` for a shadcn primitive and `components/common/` for an existing composition. Install missing shadcn primitives with the shadcn CLI rather than hand-writing them.
- Promote a component to `common/` once it's used in more than one feature.
- All components must work in both light and dark mode with no per-component dark-mode overrides. If you write `dark:` in a feature component, a token is missing.

## Spacing & Typography
- Use the Tailwind spacing scale only (`p-4`, `gap-6`); no arbitrary values like `p-[13px]` unless matching an external constraint.
- Use the defined type scale (`text-sm`, `text-base`, `text-lg`, etc.) and heading components/classes already in the project; don't invent sizes.

## Pre-Delivery Checklist (verify before finishing any UI change)
- [ ] No hex/rgb/hsl literals, no palette steps (`blue-600`, `slate-900`, `white`, `black`), no `bg-[...]`/`text-[...]` colors in changed files
- [ ] No color/background/border/shadow/typography classes passed into primitives via `className`
- [ ] Any new look is a semantically named `cva` variant using tokens only
- [ ] Any new color exists as a token pair in `globals.css` (light + dark) and is registered in the Tailwind theme
- [ ] No `dark:` overrides in feature components
- [ ] Files are in the correct directory per the architecture above

### Responsive Design & Layout Rules
1. **Mobile-First Layouts:**
   - Always structure layouts mobile-first using Tailwind's default breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
   - Use responsive grid and flex utilities (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) for multi-item displays.

2. **No Arbitrary Widths/Heights:**
   - STRICTLY FORBIDDEN: Fixed pixel dimensions on structural elements (e.g., `w-[420px]`, `h-[600px]`, `min-w-[800px]`).
   - Use relative/fluid sizing: `w-full`, `max-w-screen-xl`, `flex-1`, `min-h-screen`.

3. **Responsive Navigation & Tables:**
   - For desktop sidebars, collapse into a shadcn `<Sheet>` trigger on viewports below `md:`.
   - Wrap all `<Table>` components in an `overflow-x-auto` container to prevent mobile viewport blowout.
   - Scale padding responsively using standard tokens (e.g., `p-4 md:p-6 lg:p-8`).