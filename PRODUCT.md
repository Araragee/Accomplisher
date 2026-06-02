# PRODUCT.md — CBS DO IT

register: product

## Product purpose

A local-first desktop app (Tauri + React + SQLite) for an in-house government dev team to capture work accomplishments and keep performance targets honest. It replaces the twice-a-month scramble of writing payroll accomplishment reports from memory.

Three jobs:
1. **Accomplishment maker** for the two semi-monthly payroll cutoffs (11 to 25, 26 to 10) plus a custom date range for ad-hoc reports.
2. **WFH accomplishment maker** for daily remote-work output logged against IPCR commitment hours.
3. **Task T(h)inker**: suggests and tracks objectives for an individual and for the whole team, reasoning from each person's IPCR targets and recent logged work (lightweight on-device ML).

Everything lives on the machine. No server, no login. "Team" means a roster the lead manages locally, switching the active member to log on their behalf and rolling coverage up across the group.

## Users

- **Primary**: a front-end developer at the Philippine Statistics Authority (PSA) who must file accomplishments every cutoff and track IPCR coverage. Comfortable with tools, low patience for ceremony.
- **Secondary**: a team lead who wants a calm read on where each member stands against their targets without nagging.

Context: used on a 13 to 16 inch laptop, indoors, office or home, often late in the cutoff when the report is due. The mood to design for is "caught up and calm," not "behind and panicking."

## Tone and feel

Calm, unhurried, quietly competent. The interface should make a productive person feel they are on top of things, not buried. Generous whitespace, soft sage-tinted neutrals, one warm terracotta accent reserved for actions and current state. Flat surfaces, hairline borders, no glow, no glass, no neon. It should read like a well-kept paper planner, not a SaaS dashboard.

## Anti-references (what we are moving away from)

- The previous build: dark navy `#0c1324`, neon emerald `#4edea3`, glassmorphism blur, glowing gradient blobs. The generic "AI dashboard" look. Explicitly rejected.
- Hero-metric template (giant number, gradient accent, supporting stats).
- Identical icon-heading-text card grids.
- Any screen that announces it is powered by AI.

## Strategic principles

- **Honesty over hype.** Show real coverage, real deficits, real empty states. The Thinker suggests; it never pretends to have done the work.
- **The cutoff is the unit.** Periods (A, B, custom) frame everything. The current cutoff and days remaining are always in reach.
- **Calm density.** Show enough to act (what is logged, what is short) without crowding. Whitespace is a feature, not waste.
- **Local and durable.** Data survives offline. Nothing depends on a network call to be usable.
