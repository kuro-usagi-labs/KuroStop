# Design System — "Lembar" v2

KuroStop is a private discipline ledger. The interface should feel like a sheet of
cool paper and sumi ink: quiet, exact, and slightly severe. It should not look
like a habit tracker template, and it should never celebrate or punish
decoratively.

This document is the contract for anyone touching the UI. Tokens live in
`src/theme/tokens.ts`; primitives in `src/components/ui/`; the signature sheet in
`src/components/consequence/DaySheet.tsx`.

---

## 1. Principles

1. **One signal per colour.** Colour only means *consequence* or *status*
   (zone, money above/below baseline, on-time sleep). It is never decoration,
   never a category, never a mood.
2. **Never colour alone.** Every zone is also carried by a number, a label, or a
   shape (history uses circle / ring / square / diamond). Text legends accompany
   charts.
3. **Flat by default.** Cards are white sheets with a hairline edge. Elevation
   is reserved for the DaySheet and floating layers (toast). If everything
   floats, nothing is important.
4. **One ledger block, not four cards.** Related numbers share a single bordered
   block divided by hairlines (`StatGrid`, `Group`).
5. **Hierarchy has three levels.** Screen title (30), small-caps section label
   (11), body (17). Nothing else competes.
6. **Restraint in language.** No exclamation-mark confetti. Accountability copy
   is direct, never insulting. The user is an adult, not a child.

---

## 2. Colour

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#F1F1EC` | App background |
| `sheet` | `#FFFFFF` | Cards, sheets, tab bar |
| `ink` | `#14161A` | Primary text, primary button fill |
| `ink2` | `#454B54` | Secondary text |
| `ink3` | `#616873` | Tertiary text, metadata (5.6:1) |
| `ink4` | `#8C939D` | Decorative/disabled only — **never text** |
| `hair` | `#E2E3DE` | Hairline borders and dividers |
| `fill` | `#E9EAE5` | Neutral fills, chips, secondary button |
| `jade` | `#0B6B59` | Clear zone, verified success, on time |
| `amber` | `#8A5A00` | Warning zone, tolerance |
| `vermilion` | `#B93A26` | Danger zone, over-target |
| `crimson` | `#7C1129` | Critical zone accent (dark sheet) |
| `sumi` | `#1A1614` | Critical sheet background |

Rules:

- `ink4` on white is 3.2:1. It may draw a circle, never a word.
- Tints (`jadeTint`, `amberTint`, `vermilionTint`, `crimsonTint`) are for badges
  and small surfaces, never for large text backgrounds.
- Status text must use the solid tone (`jade`, `amber`, …), not the tint.

---

## 3. Type

System SF, weights capped at **700**. Negative tracking is used only at display
sizes.

| Variant | Size / weight | Use |
| --- | --- | --- |
| `hero` | 44 / 700 | One number per screen (savings, live timer) |
| `display` | 30 / 700 | Screen title |
| `title` | 23 / 700 | Card headline, sheet headline |
| `title2` | 18 / 600 | Sub-headline, stepper value |
| `headline` | 17 / 600 | Row title, button label |
| `body` | 17 / 400 | Reading text |
| `callout` | 16 / 400 | Intro paragraph |
| `subhead` | 15 / 400 | Supporting line |
| `footnote` | 13 / 400 | Metadata, helper text |
| `caption` | 12 / 500 | Badges, tight metadata |
| `eyebrow` | 11 / 700, uppercase, +0.9 | Section label, overline |
| `num` | 24 / 700, tabular | Metric value |

Dynamic Type caps: display/hero stop at 1.6×, everything else at 2.0×. Fix the
layout instead of lowering the cap.

Section headers are `eyebrow` labels with a hairline rule, not bold titles:
`Section` renders `TITLE —————————————`.

---

## 4. Space, radius, elevation

- Gutter: **20** (`gutter`) on every screen, including pushed stack screens.
- Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40.
- Radius: 6 / 10 / 14 / 18 / 22 / pill.
- Hit targets: minimum 44×44 (`HIT`). Icon buttons smaller than 44 get `hitSlop`.
- Shadow: `shadow.sheet` for the DaySheet, `shadow.float` for the toast. No
  other shadows.

Bottom padding for tab screens is `TAB_BAR_SPACE` (96) plus the safe area.

---

## 5. Components

### Primitives — `src/components/ui/primitives.tsx`

- `Txt` — always use this instead of raw `Text`; it applies the type scale,
  colour, tabular numerals, and the Dynamic Type cap.
- `Button` — variants `primary` (ink), `secondary` (fill), `ghost` (outlined),
  `accent`, `inverse`, `danger`. Sizes `lg` 52 / `md` 46 / `sm` 40, flexible
  height, two-line labels allowed. One primary button per view is the default.
- `IconButton` — circular; `tone="fill"` for neutral actions, `tone="ink"` for
  the single strong action.
- `Card` — flat white sheet, hairline border, 18 radius. `padded={false}` when
  children draw their own dividers.
- `Chip` — 40 pt tall, for optional filters/triggers.
- `Badge` — status pill, 12 pt.
- `Icon` — decorative only, hidden from assistive tech.

### Layout — `src/components/ui/layout.tsx`

- `Screen` — tab screens with their own title, eyebrow, safe areas, tab clearance.
- `StackScroll` — pushed screens that use the native header.
- `Section` — eyebrow + hairline rule + content. Use `index` for staggered entry.
- `Group` — one bordered block containing `Row`s separated by inset hairlines.
- `Row` — title / subtitle / value / icon / chevron / stacked control.
- `StatGrid` — one block, two columns, hairline-divided cells.
- `EmptyState` — icon, honest headline, one sentence, optional action.
- `TextLink` — quiet text action, used as a `Section` action.

### Signature — `src/components/consequence/DaySheet.tsx`

The DaySheet is the only elevated surface. It carries the zone stamp, the
accountability headline, ink marks for today's events, and a footer of quick
metrics. One per app, on Today only.

---

## 6. Screen anatomy

**Today** — DaySheet → actions (log, urge) → demo simulator (demo only) → one
summary ledger → streaks → seven-day ledger → text legend.

**Trackers (Rokok / PMO / Tidur)** — header add button → privacy/status note →
hero number → one or two `StatGrid` blocks → grouped recent activity → "see all"
link.

**Log** — segmented habit switch → the single fastest action first → custom
quantity → trigger chips (optional) → time adjuster → running total. The purchase
tab is labelled "Beli" so four tabs fit at any text size.

**Urge** — one decision at a time. While a tool runs, the rest of the screen
disappears. "Gue Tahan" is primary; "Catat Kejadian" is neutral ghost, because
an urge is not a failure.

**Money** — saved-this-month hero → "Catat Pembelian" → supporting metrics →
clearly-labelled hypothetical projection → purchase ledger.

**History** — 7-day strip (shape encodes zone) → legend → selected day summary →
day entries → 30-day summary. Seven days never wrap to a second row.

**Onboarding** — welcome → habits with check states → targets → baseline and
cost → accountability intensity and demo data. Content scrolls; the primary
action sits at the end of each step.

---

## 7. Accessibility

- Every interactive element has a label; icons are hidden from screen readers.
- Charts and calendars expose a single readable summary
  (`accessibilityLabel`) rather than dozens of unlabelled shapes.
- State is announced (`accessibilityState={{ selected }}`), not implied by
  colour.
- Body text is 17 pt minimum; no text below 11 pt anywhere.
- Contrast: all text is at least 5.4:1 on white. `ink3` is the lightest text
  tone permitted.
- Respect Reduce Motion: springs and entering animations collapse; the breathing
  exercise shows a static ring.

---

## 8. Voice

- Indonesian, informal "lo", short sentences.
- Name the action, not the emotion: "Catat 1 Batang", not "Yuk jaga kesehatan!".
- Accountability lines may be sharp, never degrading.
- No promises in finance copy. Projections are labelled "Hipotetis".

---

## 9. Deferred

- **Dark mode.** The app is intentionally light (`userInterfaceStyle: "light"`).
  A real dark theme needs semantic colour tokens (`surface`, `textPrimary`, …)
  rather than the current literal palette; half-done dark mode is worse than
  none.
- **Custom typography.** System SF is used deliberately; the ledger character
  comes from spacing and rules, not from a novelty typeface.

---

## 10. Checklist for a new screen

1. Use `Screen` (tab) or `StackScroll` (pushed) — never a bare `ScrollView`.
2. One `display` title, `eyebrow` section labels, body at 17.
3. Metrics in a single `StatGrid`; lists in `Group`.
4. Colour only for status; add a text or shape cue alongside it.
5. Buttons: one primary, the rest secondary/ghost.
6. Verify with `npx tsc --noEmit`, `npm test`, `npx expo lint`.
