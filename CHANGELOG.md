# Changelog — pdsview

What changed for someone using the deployed viewer. It deploys from `main` (Pages), so
landing *is* releasing: sections are months, each entry dated by its landing. Per
`CroftC/.claude/CHANGELOGS.md`, the branch that changes something a user runs adds its entry
here before it lands. Started 2026-08-29; earlier history is in `git log`.

## 2026-08

- 2026-08-26 Accessibility and mobile-fit gates, pinned to the canonical axe version — every
  page scanned hermetically, tap targets at the 44px floor, no horizontal overflow at
  320/360/390.
- 2026-08-25 One gate: `npm run gate` mirrors CI exactly (CI-PATTERN alignment).
