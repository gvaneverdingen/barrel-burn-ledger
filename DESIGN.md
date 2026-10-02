---
name: ARIGI
description: Whole-cask whisky, verified at source and recorded on-chain.
colors:
  midnight-navy: "hsl(222 38% 11%)"
  midnight-deep: "hsl(222 40% 7%)"
  ledger-card: "hsl(222 35% 14%)"
  champagne: "hsl(38 60% 68%)"
  bronze: "hsl(32 55% 60%)"
  slate-navy: "hsl(220 28% 22%)"
  muted-navy: "hsl(222 25% 18%)"
  rule-line: "hsl(222 25% 22%)"
  parchment-ink: "hsl(38 35% 92%)"
  aged-label: "hsl(38 15% 68%)"
  sealing-red: "hsl(8 65% 55%)"
  sidebar-navy: "hsl(220 40% 10%)"
  parchment: "hsl(38 30% 96%)"
  paper: "hsl(38 35% 99%)"
  old-gold: "hsl(34 62% 34%)"
  old-bronze: "hsl(28 50% 40%)"
  ledger-ink: "hsl(222 40% 12%)"
  faded-ink: "hsl(222 14% 36%)"
  vellum: "hsl(38 22% 90%)"
  deckle-line: "hsl(36 20% 82%)"
  success: "hsl(150 45% 58%)"
  warning: "hsl(24 85% 64%)"
  info: "hsl(210 70% 70%)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.25rem, 6vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.05
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "12px"
spacing:
  gutter-mobile: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "32px"
  section: "96px"
  section-mobile: "64px"
  card: "24px"
components:
  button-primary:
    backgroundColor: "{colors.champagne}"
    textColor: "{colors.midnight-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 32px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.parchment-ink}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 32px"
  card:
    backgroundColor: "{colors.ledger-card}"
    textColor: "{colors.parchment-ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card}"
  input:
    backgroundColor: "{colors.muted-navy}"
    textColor: "{colors.parchment-ink}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 12px"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.champagne}"
    typography: "{typography.label}"
    rounded: "9999px"
    padding: "2px 10px"
  nav-item-active:
    backgroundColor: "{colors.slate-navy}"
    textColor: "{colors.champagne}"
    rounded: "{rounded.lg}"
    height: "44px"
---

# Design System: ARIGI

## Overview

**Creative North Star: "The Bonded Ledger"**

ARIGI should feel like a bonded warehouse's ledger read by lamplight. The ground is deep midnight navy, the ink is warm parchment, and champagne gold is used the way a clerk uses a seal or a ruled line: to mark what has been verified, what is for sale and what to act on next. The luxury is in the precision. Every number, document hash, fill date and fee should read as clearly as a line in a ledger, because the product's promise is that everything can be checked.

The incumbent build leans more ornamental than this North Star: gold gradient text on most headings, gradient-filled buttons with a gold glow, and cards that lift on hover. This document keeps that vocabulary but rations it. Ornament belongs to a few hero moments. Working surfaces (marketplace, cask detail, dashboards, admin) stay flat, solid and tabular.

Dark navy is the primary world and the default for every visitor (`<html class="dark">`, applied before first paint). A light **parchment** theme is the opt-in alternative from the theme toggle: the same ledger, printed on paper by daylight, with champagne deepened to old gold so it stays legible. Both themes define the same colour roles in `src/index.css`; components reference roles, never hues.

**Key Characteristics:**
- Midnight navy ground, parchment ink, champagne as the single accent for verification and action.
- Playfair Display headlines over Inter body: a printed-register headline with modern, legible working text.
- Softly rounded containers (12px) with hairline navy borders; depth from tonal layering first, shadow second.
- Real photography of casks and warehouses carries the atmosphere, so the interface doesn't have to.
- Data (ABV, fill date, price, fees, CIDs, transaction IDs) is set plainly, aligned and never decorated.

## Colors

A two-temperature palette: cold, deep navies for every surface; warm parchment and champagne for everything a person reads or acts on.

### Primary
- **Ledger Champagne** (`{colors.champagne}`): the one accent. Primary buttons, active navigation, focus rings, verified/provenance badges, key figures in stat rows, links. In the dark theme it lifts to `hsl(38 60% 70%)`.

### Secondary
- **Cask Bronze** (`{colors.bronze}`): the warm partner to champagne. Currently used as the second stop in gold gradients and for amber highlights. Use it for secondary emphasis, never as a competing call to action.

### Neutral
- **Midnight Navy** (`{colors.midnight-navy}`): page background in the default theme.
- **Midnight Deep** (`{colors.midnight-deep}`): page background in the `.dark` theme, and ink on champagne buttons.
- **Ledger Card** (`{colors.ledger-card}`): cards, popovers and dialogs, one tonal step above the page.
- **Slate Navy** (`{colors.slate-navy}`): secondary buttons and active sidebar items.
- **Muted Navy** (`{colors.muted-navy}`): input fills, muted panels and skeletons.
- **Rule Line** (`{colors.rule-line}`): borders and dividers, usually at 40–60% opacity.
- **Parchment Ink** (`{colors.parchment-ink}`): primary text.
- **Aged Label** (`{colors.aged-label}`): secondary text, captions and helper copy.
- **Sidebar Navy** (`{colors.sidebar-navy}`): the app sidebar, slightly deeper than the page.
- **Parchment** (`{colors.parchment}`): reserved as the ground of the planned light theme. Not used as a surface in the dark world.

### Semantic
Status is expressed only through these roles (`text-success`, `bg-warning/10`, `border-info/30`, …), each defined in both themes. Tints use the role at 10–15% opacity with the role itself as text; solid fills pair the role with its `-foreground`. Values below are the navy theme; the light theme deepens each to pass 4.5:1 on parchment.
- **Sealing-wax Red** (`hsl(8 68% 63%)`; light `hsl(6 65% 44%)`): destructive actions and errors.
- **Cellar Green** (`{colors.success}`; light `hsl(152 55% 28%)`): completed, verified-on-chain, online, positive change.
- **Copper Warning** (`{colors.warning}`; light `hsl(22 80% 38%)`): pending, needs attention. Deliberately pushed toward copper so it never reads as champagne ("verified").
- **Slate Blue** (`{colors.info}`; light `hsl(212 60% 38%)`): processing, informational.
- Star ratings use the primary role: a rating is a seal of approval, not a warning.

### Light theme (parchment)
The same roles, remapped for paper. Every text pair meets WCAG AA (4.5:1 or better).
- **Parchment** (`{colors.parchment}`): page background.
- **Paper** (`{colors.paper}`): cards, popovers and dialogs, a half-step brighter than the page.
- **Old Gold** (`{colors.old-gold}`): the primary role. Champagne cannot carry text on paper (1.8:1), so the seal deepens to old gold (5.2:1 on parchment); buttons use it as a fill with near-white ink (5.4:1).
- **Old Bronze** (`{colors.old-bronze}`): the accent role.
- **Ledger Ink** (`{colors.ledger-ink}`): primary text (16:1).
- **Faded Ink** (`{colors.faded-ink}`): secondary text (6.7:1).
- **Vellum** (`{colors.vellum}`): muted panels, secondary buttons, skeletons.
- **Deckle Line** (`{colors.deckle-line}`): borders and input strokes.

### Named Rules
**The One Seal Rule.** Champagne marks verification and the next action. If more than about 10% of a working screen is gold, something is decorated that should have been informational.

**The Solid Gold Rule.** On working surfaces, champagne is a solid fill or a solid text colour. The gold gradient (`--gradient-champagne`) is reserved for the single hero headline of a marketing page and at most one primary CTA per screen.

## Typography

**Display Font:** Playfair Display (with Georgia, serif)
**Body Font:** Inter (with system-ui, sans-serif)

**Character:** A high-contrast transitional serif for the voice of the register, paired with a neutral grotesque that keeps numbers, specs and forms precise. Every `h1`–`h6` is Playfair by default; everything else is Inter.

### Hierarchy
- **Display** (700, `clamp(2.25rem, 6vw, 4.5rem)`, 1.05): marketing hero headlines only ("Own a piece of liquid history.").
- **Headline** (700, `clamp(1.875rem, 4vw, 3rem)`, 1.15): section headings on marketing and story pages, page titles in the app.
- **Title** (600, 1.25rem, 1.3): card titles, cask names, dialog titles.
- **Body** (400, 1rem–1.125rem, 1.625): running copy, capped at roughly 65–75ch (`max-w-2xl`/`max-w-3xl`).
- **Label** (600, 0.75rem): badges, eyebrow tags, sidebar group headings (uppercase, tracked) and table headers.
- **Stat figures** use Playfair at 1.5–2rem in champagne. Reserve them for the few headline numbers on a screen.

### Named Rules
**The Serif Speaks, the Sans Works Rule.** Playfair is for statements and names. Prices, ABV, volumes, dates, hashes and form fields are always Inter, set with tabular figures where they align in columns.

**The Plain Data Rule.** Never apply gradient text to a number or a document identifier.

## Layout

- **Shell:** a collapsible left sidebar (navigation + support groups) beside a top bar holding the logo, theme toggle, currency selector and sign-in. On mobile the sidebar gives way to a bottom navigation bar with 44–48px touch targets and safe-area padding.
- **Container:** centred, `max-width: 80rem` (`max-w-7xl`), side gutters of 16px / 24px / 32px at mobile / `sm` / `lg`.
- **Section rhythm:** marketing sections use 64px vertical padding on mobile and 96px from `sm`; hero sections up to 160px. App pages are denser: 24–32px between blocks.
- **Grids:** content grids go 1 → 2 → 3 columns (`sm`, `lg`) with 16–24px gaps. Long-form copy is held to a single measured column (`max-w-3xl`), even on wide screens.
- **Breakpoints:** Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1400 container).

## Elevation & Depth

Depth is primarily **tonal**: page → card → popover step up through slightly lighter navies, separated by hairline borders. Shadows are navy-tinted and soft. A champagne glow exists but should be rare.

### Shadow Vocabulary
- **Elegant** (`0 4px 16px -4px hsl(222 45% 8% / 0.12)`): resting cards.
- **Heritage** (`0 12px 24px -6px hsl(220 35% 18% / 0.25)`): hovered or raised cards, popovers.
- **Luxury** (`0 20px 40px -12px hsl(222 45% 8% / 0.35)`): dialogs and hovered hero CTAs.
- **Champagne glow** (`0 8px 32px -8px hsl(38 55% 60% / 0.35)`): the single hero CTA only.

### Named Rules
**The Still Ledger Rule.** Cards in lists and tables do not lift or glow on hover; change the border to champagne at ~40% instead. Translate-on-hover is reserved for marketing cards and the hero CTA.

## Shapes

Gently rounded throughout. The base radius is 12px (`--radius: 0.75rem`): cards and hero buttons use 12px, standard buttons and inputs 10px, small controls 8px. Badges and eyebrow tags are full pills. Icon tiles are 40–48px rounded squares with a champagne tint at 10% and a champagne border at 20%. Imagery is cropped to firm aspect ratios (4:3 for cask cards) with the same 12px corners.

## Components

### Buttons
Confident and quiet; the label carries the weight, not the effects.
- **Shape:** 10px corners (12px for large hero buttons), 40px default height, 48px for large and mobile.
- **Primary:** solid champagne with deep navy ink, 500 weight (`heritage-button` or the default variant). Hover darkens the fill; no lift, no glow.
- **Hero (`heritage-button-hero`):** the one ornamented CTA, with the gold gradient, champagne glow and a 1px lift on hover. Home-page hero only.
- **Outline / secondary:** transparent with a champagne border at 40%, parchment text, champagne tint at 10% on hover.
- **Ghost / link:** champagne text and an arrow icon that nudges right on hover.
- **Focus:** a 2px champagne ring offset from the button. Never remove it.
- **Buy (`heritage-button-buy`):** a slightly deeper gold (`--action-buy`, `hsl(38 60% 60%)`) for the purchase action on cask pages.

### Badges / Chips
- **Style:** pill-shaped, champagne text and border at 30–40% opacity, champagne tint at 5–10%. Used for eyebrows ("Blockchain-verified provenance", "Featured", "Our story") and status.
- **Status:** destructive uses sealing-wax red; avoid inventing extra status hues without adding tokens.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** ledger card, optionally a faint diagonal gradient into muted navy (`heritage-card`).
- **Shadow Strategy:** elegant at rest; see the Still Ledger Rule for hover.
- **Border:** hairline rule line at 50–60% opacity.
- **Internal Padding:** 20–24px; 32–64px for feature/CTA panels.

### Inputs / Fields
- **Style:** muted navy fill, rule-line border, 10px corners, 40px height.
- **Focus:** 2px champagne ring.
- **Error:** sealing-wax red helper text in 0.75rem beneath the field. Validation is inline and immediate (e.g. IPFS CID fields).
- **Helper text:** aged-label colour, one sentence explaining the field.

### Navigation
- **Sidebar:** sidebar navy, uppercase tracked group labels, 44px rows with icon + label. The active row gets a 10% primary tint and primary text; no side stripe, no glow.
- **Top bar:** the winged-cask mark plus the ARIGI wordmark in solid primary Playfair at left; theme toggle, currency selector and sign-in at right.

### Logo mark
`src/assets/arigi-mark.png` is an alpha mask (white on transparent) cut from the Angel Share artwork, without its lettering. It renders through `<ArigiMark />`, which fills it with the primary role, so it is champagne on navy and old gold on parchment. Never place the original black-square PNGs on a themed surface, and never animate the mark.
- **Mobile:** bottom navigation bar, sticky blurred header, 44–48px targets.

### Stat Row (signature)
A bordered panel split into equal cells, each holding a large champagne Playfair figure over an Inter caption (e.g. "16 Casks listed · 4 Distilleries · 0 Trades settled"). Show the real numbers, including zeros.

### Explainers (tooltips)
Every icon-only control and every trade action (buy, offer, accept, decline, sell, cancel listing, mint, price alert) carries a hover/focus explainer via `<Explain text="…">` (`src/components/Explain.tsx`): popover surface, 12px text, max 260px wide, 300ms delay. Copy is one or two plain sentences saying what happens and what doesn't ("Take your resale listing off the marketplace. You keep the cask."); never repeat the button label, never promise anything the code doesn't do. Self-explanatory buttons ("Sign In", "Browse Marketplace") get none. Icon-only controls also need an `aria-label`; the explainer is not a substitute. Touch screens have no hover, so nothing essential may live only in an explainer.

### Ledger List (signature)
Lists of claims, problems or principles are ruled rows, not cards: hairline rule-line dividers top, bottom and between rows, a bare 20px primary icon, then a bold parchment lead-in followed by muted body text in the same paragraph. Rows sit in the same `max-w-3xl` column as surrounding prose. Never box each item in its own card or put icons in tinted tiles.

### Provenance Timeline (signature)
A vertical sequence of custody events (fill, regauge, warehouse transfer, sale, bottling) with document hashes and block-explorer links. This is where the North Star lives: dates, parties and identifiers set plainly in Inter, with champagne marking the verified steps.

## Do's and Don'ts

### Do:
- **Do** keep champagne to verification, the primary action and active state (the One Seal Rule).
- **Do** set every number, date, ABV, price, fee and hash in Inter, in solid parchment or champagne, never gradient text.
- **Do** let real cask and warehouse photography provide the warmth; keep the UI around it flat and quiet.
- **Do** show fees, status and on-chain links as visible, labelled data rather than hiding them behind tooltips.
- **Do** keep 44px minimum touch targets and the 2px champagne focus ring on every interactive element.
- **Do** add any new colour as a role in both `:root` (parchment) and `.dark` (navy) in `src/index.css`, and check it in both themes before shipping.

### Don't:
- **Don't** use the gold gradient on more than one headline and one CTA per screen (the Solid Gold Rule).
- **Don't** lift, scale or glow cards in marketplace lists, tables or dashboards (the Still Ledger Rule).
- **Don't** animate content in on working surfaces. A marketing page gets one entrance (the hero's `fade-in`); lists, cards and tabs are simply there. No staggered delays, no shimmer, no looping animation.
- **Don't** use page-wide tinted gradients as backgrounds; grounds are the flat background role.
- **Don't** introduce new accent hues for decoration; extend semantic roles (success, warning) as named tokens first.
- **Don't** use Tailwind palette colours (`text-green-600`, `bg-amber-100`, `dark:…` overrides) or literal hues in components; use a role. `text-white` and `bg-black/…` are allowed only over photography.
