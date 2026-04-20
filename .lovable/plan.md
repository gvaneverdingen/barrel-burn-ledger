# Dark Luxury Color Refresh

**Direction:** Deep midnight navy backgrounds, soft champagne/cream accents, subtle warm bronze highlights. Editorial, premium, auction-house feel. Distinct dark-mode identity (richer, deeper) rather than a simple mirror.

## 1. New Palette (HSL semantic tokens)

### Light mode
- `--background` 38 30% 96%  — warm cream parchment
- `--foreground` 220 35% 12% — midnight ink
- `--card` 38 35% 98%
- `--primary` 38 55% 65%      — champagne
- `--primary-foreground` 220 35% 12%
- `--secondary` 220 35% 18%   — deep navy
- `--secondary-foreground` 38 30% 96%
- `--accent` 32 50% 55%       — warm bronze
- `--muted` 38 15% 88%
- `--border` 38 15% 82%
- `--ring` 38 55% 65%
- Sidebar: deep navy `220 40% 10%` with champagne text

### Dark mode (distinct identity)
- `--background` 222 40% 7%   — midnight
- `--foreground` 38 35% 94%   — champagne white
- `--card` 222 35% 10%
- `--primary` 38 60% 72%      — brighter champagne
- `--secondary` 220 30% 22%
- `--accent` 32 55% 62%
- `--muted` 222 25% 16%
- `--border` 222 25% 18%
- Sidebar: deepest navy `222 45% 5%`

### Gradients & shadows
- `--gradient-luxury`: midnight navy → deep indigo (hero/sidebar)
- `--gradient-champagne`: champagne → warm bronze (replaces gradient-gold)
- `--gradient-parchment`: cream → warm sand
- `--shadow-luxury`: soft navy glow
- `--shadow-champagne`: champagne aura (replaces shadow-gold)

## 2. Files to update

1. **`src/index.css`** — rewrite `:root` + `.dark` tokens, gradients, shadows, and `.heritage-*` utility classes.
2. **`tailwind.config.ts`** — add `champagne` aliases; keep existing `gold`/`luxury` keys mapped to new vars for back-compat.
3. **`src/components/Layout.tsx`** — replace hardcoded role colors with semantic tokens.
4. **Component sweep** — search `src/**` for hardcoded Tailwind colors (`text-white|black`, `bg-black|white`, `text-blue-*`, `text-emerald-*`, `bg-amber-*`, `from-*-500`, etc.). Replace with semantic tokens. Priority files:
   - `AppSidebar`, `MobileBottomNav`, `NotificationsBell`
   - `PortfolioSummaryCards`, `PortfolioValueChart`, `NftStatusCard`
   - `MarketplaceAnalytics`, `MarketPriceTracker`
   - admin pages and distillery dashboard cards
5. Retune `heritage-button-buy` emerald to harmonize with the new palette.

## 3. Out of scope
- No layout, copy, business-logic, or component-structure changes.
- No new components or pages.
- Email templates untouched.
- Logo asset unchanged (only contrast checked).

## 4. Verification
- Visual scan: Marketplace, Cask Details, Portfolio, Settings, Admin Dashboard.
- Both light & dark mode, mobile (393px) and desktop.
- Contrast check on primary buttons, sidebar, badges, chips.

---

Reply **approve** to proceed, or tell me what to tweak (palette tones, scope, files to skip).
