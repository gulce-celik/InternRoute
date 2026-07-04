---
name: internroute-design
description: Guides InternRoute UI toward student-friendly, motion-rich, non-generic design. Use when editing frontend pages, CSS, layout, auth screens, dashboard, or when the user mentions design, UX, animations, or student appeal.
---

# InternRoute Design System

## Product feel

Target: **university students** tracking internships — energetic, honest, not corporate SaaS.

Avoid: purple-pink AI gradients, generic glassmorphism, Plus Jakarta Sans defaults.

Prefer: warm paper tones, bold borders, editorial serif headlines, playful motion.

## Visual tokens

| Token | Value | Use |
|-------|-------|-----|
| Paper | `#f3ede3` | Page background |
| Ink | `#14110f` | Text, borders |
| Accent | `#c84b31` | Primary actions |
| Forest | `#2f5d4a` | Auth hero, success |
| Mustard | `#e8b84a` | Highlights, interview status |
| Sky | `#7eb8c9` | Applied status |

Fonts: **Instrument Serif** (headlines), **DM Sans** (UI).

## Motion principles (2026 UX trends)

1. **Micro-interactions** — button lift, card hover, save confirmation (<400ms)
2. **Floating elements** — slow drift on background orbs and pinned cards
3. **Staggered entrance** — list items appear with `animation-delay`
4. **Pipeline/kanban cues** — application stages as horizontal flow (student trackers expect this)
5. **Always respect** `prefers-reduced-motion: reduce` — disable drift/float

## Reusable components

- `SceneBackdrop` — ambient floating shapes behind pages
- `AnimatedCard` — staggered slide-up wrapper
- `PipelineStrip` — visual stage tracker (Saved → Applied → Interview → Offer)
- `MotivationTicker` — subtle scrolling student quotes

## Copy tone

- Direct, student voice: "Pin every role", "Your pipeline", not "Leverage synergies"
- Empty states encourage first action, not corporate filler

## Checklist before shipping UI

- [ ] Works on mobile (375px)
- [ ] Loading + error states styled consistently
- [ ] Animations have reduced-motion fallback
- [ ] Placeholder pages match finished pages (no bare h1)
