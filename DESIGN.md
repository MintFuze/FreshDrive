# Reference lock
Dock spacing audit: measured uneven 5–7px upper vs 13px lower content space. Center each icon/label group explicitly; use a 24px icon, 3px gap, 13px label line and 8px upper/lower space in a 56px target. Outer dock is 68px with 5px inset plus 1px border. Remove active-icon vertical offset and nested selection border. Preserve readable single-word labels and equal-width action slot. Apple HIG tab-bars/materials informed icon-label hierarchy and restrained translucent navigation only; this remains a web adaptation, not native Liquid Glass. Sources: https://developer.apple.com/design/human-interface-guidelines/tab-bars and https://developer.apple.com/design/human-interface-guidelines/materials .
Dock refinement: Arc Search (e06542b3-5064-4f59-b703-cb116408facd) informs the translucent toolbar and contained create action; Gizmo (7d27be22-c040-4cff-b4ec-588463d8f3a7) informs restrained active/inactive hierarchy only. Preserve four equal slots and the user's lime create button. Keep navigation DOM stable so the shared pill transitions continuously (300ms), with small icon emphasis (240ms) and press feedback. No loops or fabricated reference motion claims; timing comes from the bundled Refero motion guide. Reduced motion removes movement. Persistent buttons also retain keyboard focus and expose aria-current.
Motion: follow Refero's bundled motion craft guide, preserving the existing Linear/Tripsy direction. Page entry uses a 220ms fade with 8px travel; full-screen order entry/exit uses only opacity (240/140ms), keeping fixed headers and save controls anchored. Control feedback is 100–160ms. Skip animation under prefers-reduced-motion; navigation is immediate and running page animations are cancellable.
Mobile navigation refinement: four equal-width slots, including the add action, per user screenshot/request. Keep the lime action fill and use the same pill silhouette as the other items. Refero Arc Search toolbar (e06542b3-5064-4f59-b703-cb116408facd) supports a contained add action in a translucent bottom bar; slot equality is the user's explicit constraint.
Primary: Linear (Refero 554b801c-3b31-4086-a7e5-ae613cdd618b): layered graphite surfaces, precise typography, thin borders, sparse primary accent. Adapt canvas to pure OLED black per user. Use offline system sans-serif instead of network fonts.
Secondary: Linear changelog (11d3e58a-87d7-4a9a-bbf5-720f4fd3ffc6): restrained date labels and separated history. Exante (282f6ff5-41e7-48d1-ad18-96c32d56e44c): financial alignment and hairline structure.
Patterns: Dime (39ebc1ed-8eb1-4710-bc27-5933c3a70574) daily groups and bottom navigation; Copilot (ae027eb7-a9b3-47eb-9003-e81d4865f693) transportation totals and weekly bars.
Tokens: #000 canvas; #101111 surfaces; #262828 borders; #f3f4f3 primary text; #969b97 secondary text; #c5f277 primary action/active navigation. 4px spacing base, 44px minimum controls, 9–12px corners. No bitmap or remote assets required.
Decisions: mobile bottom navigation from Dime; desktop sidebar from Linear product layouts; no maps because user requires offline operation; historical consumption and price snapshots because accounting must remain stable; zero initial records because no real trip data supplied.
Navigation correction: preserve the existing OLED/glass direction and accent roles. Following the Refero icon craft reference, use a consistent 24px outline SVG canvas, 2px strokes, currentColor and centered fixed-size icon slots rather than platform-dependent font glyphs. Existing button touch areas remain at least 44px.

Order workflow reference lock: Linear remains primary (revisited through Refero); Tripsy itinerary/expense summaries (accd8ac4-3e90-4243-b53b-7ad49f0ccb42, adf7dd30-d741-4f2b-841f-21f3d7aa3043) inform only the stacked route and cost sections. Preserve OLED canvas, graphite surfaces, thin borders and system fonts. No photography or maps required.

| Decision | Source | Role | Purpose |
|---|---|---|---|
| Read-only order card before editing | User request, Tripsy itinerary | Route and costs in separate sections | Inspect without accidentally editing |
| Route cards with segments and total distance | User request, Tripsy itinerary | Travel information | Make direction and return distance visible |
| Neutral planned badge, green completed badge | Existing palette, Linear status rules | Status only | Separate planning from completed totals |
| Collapsed fuel-price control | User request | Secondary adjustment | Keep the common path short and historical prices stable |
| Customer input and filters | User request | Selection and retrieval | Reuse names and inspect one customer's orders |

Selection/calendar refinement: preserve the locked Linear surfaces and typography. Tripsy calendar (947b06d4-b3e7-455b-b05e-9a7862487ac0) supplies the seven-column layout and clear selected-day state; adapt to Monday-first weeks and inline expansion rather than a modal. Omio vehicle selection (d8adf998-de13-4079-a521-4b5932b75d30) supplies visible radio choices with secondary details; use the existing graphite/lime palette, not Omio's navy/pink colors.

| Decision | Source | Role | Purpose |
|---|---|---|---|
| Four clearly named form sections | User request, craft form hierarchy | Form structure | Reduce scanning and explain the sequence |
| Radio cards and customer chips | Omio selection, user request | Selection only | Compare choices without opening system menus |
| Inline calendar with today/tomorrow shortcuts | Tripsy calendar, user request | Date selection | Keep context and avoid platform date-picker differences |
| Single fixed total/save bar | Existing floating controls, user request for clarity | Primary action | Keep the total and save action reachable |
| Full-row order cards | Existing order summary | Navigation | Make the whole order easy to tap |
