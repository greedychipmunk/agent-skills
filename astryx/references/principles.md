# Principles Reference

## Design Philosophy

A design system that prioritizes consistency, adaptability, and developer experience. Every decision flows from core ideas:

- **Components over primitives:** use components for everything they cover before reaching for raw HTML
- **Semantic tokens over hardcoded values:** colors, spacing, and radii are named by purpose, not appearance
- **Theme-agnostic code:** app code never references specific colors or measurements, so themes and dark mode work automatically
- **Open internals:** every primitive is exported and composable, so you can build on top of it without fighting it

## Rules

1. Use components for everything they cover
2. Page layout is frame-first: pick the shell and budget regions before writing content
3. Dense data renders as rows (Table, List/Item), edge-to-edge with dividers; Card is for widgets, galleries, and settings groups
4. StyleX or Tailwind for custom styling; both are first-class
5. Semantic tokens, not hardcoded values
6. CSS custom properties for colors, not hex values
7. Form inputs are controlled (value + onChange)
8. Use `useLinkComponent()` for navigation so consumers can plug in their framework router via `LinkProvider`

## Styling Approach

Every component accepts an `xstyle` prop for StyleX style overrides via `stylex.create()`. For layout and wrapper styling outside of components, use StyleX or Tailwind utilities; both resolve to the same design tokens.

## Anti-Patterns

| Guidance | Practices |
| --- | --- |
| Don't | Inline styles on raw elements. Use `xstyle` on components |
| Don't | Hardcoded colors (`#fff`). Use `var(--color-*)` or Tailwind semantic classes (`text-primary`, `bg-surface`) |
| Don't | Hardcoded spacing (`16px`). Use spacing tokens or Tailwind spacing utilities |
| Don't | Hardcoded elements. Use `useLinkComponent()` so consumers can swap in their framework router via `LinkProvider` |
| Don't | Wrapping every list item or page section in a Card. Decide the frame first; dense data renders as rows |
| Don't | Badge as decoration. Reserve Badge for counts and enumerated states; use `StatusDot` or `Token` for status |
| Don't | Inventing props. Read component docs first |

## Design Tokens

The system provides semantic design tokens for spacing, color, radius, shadow, typography, and size. Tokens adapt to the active theme and color mode. Run `astryx docs tokens` for the full reference with all values.
