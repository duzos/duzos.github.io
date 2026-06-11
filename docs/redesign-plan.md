# Portfolio Redesign Plan — "Phantom" (Persona-inspired)

Date: 2026-06-11
Scope: main portfolio page only (`index.html`, `style.css`, `script/`). Everything under `sites/` is untouched.

---

## 1. Design Direction

**"Phantom"** — a Persona 5-inspired maximalist UI: black/red/off-white tri-tone, hard
diagonal cuts, jagged clip-path panels, halftone textures, hard offset shadows (no blur),
marquee text strips, and slightly rotated "paper collage" cards.

Why this direction:
- It's *personal*. The site already features the Persona cat and a Persona Minecraft mod —
  the aesthetic is part of duzo's identity, not a borrowed trend.
- It's the strongest possible contrast to the current "Terminal Luxe" emerald/dark theme,
  so the redesign reads as a true redesign.
- P5's UI language (diagonals, calling cards, all-out-attack splash) maps naturally onto
  portfolio furniture: featured project = boss card, spotlight = calling card,
  contact = "send a calling card".

The one thing visitors will remember: a huge rotated **DUZO** wordmark with layered
red/black/white hard-offset shadows over a halftone starburst, and project cards that
feel like punk collage cutouts.

### Alternatives considered (not chosen)
1. **"Type 40"** — Doctor Who/TARDIS retro-futurism (deep space navy, brass, roundels,
   vortex gradients). Fits the AIT/TARDIS Refined/K9 mod catalogue; runner-up.
2. **"Blueprint"** — light engineering-editorial (graph paper, technical annotations,
   mono labels). Safest and most "professional", least memorable.

---

## 2. Design System

### Palette (CSS variables, same `data-theme` mechanism as today)

Dark theme — default, "Metaverse":

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0b0b0d` | page background |
| `--ink-2` | `#141416` | raised surfaces |
| `--paper` | `#f7f3e8` | primary text, card faces |
| `--crimson` | `#e1062c` | primary accent, CTAs, links |
| `--crimson-deep` | `#8f0419` | shadows, hover-deepen |
| `--gold` | `#ffd400` | rare highlight (featured badge only) |
| `--shadow-hard` | `#000` | hard offset shadows, `box-shadow: 6px 6px 0` |

Light theme — "Daylight": `--ink` becomes paper (`#f2ede1`), text near-black (`#161616`),
crimson stays, shadows soften to `4px 4px 0 rgba(0,0,0,.85)`. Tri-tone is preserved in
both themes; only figure/ground flips.

### Typography (Google Fonts)
- **Anton** — display. Towering condensed caps for the wordmark, section titles, counters.
  Always uppercase, often rotated −2° to −4°, letter-spacing tightened.
- **Archivo** (variable) — body and UI. Wide weights (`wdth` 110–125) for subheads/nav,
  regular for prose.
- **JetBrains Mono** — kept, demoted to "stamp" duty: section numbers, stat labels,
  `// hello world`, captions. Maintains the dev identity inside the new skin.

### Shape & texture language
- Diagonal section dividers via `clip-path: polygon(...)` (one consistent angle: −3°).
- Jagged polygon frames (clip-path) for avatar and featured-project logo.
- Halftone dot texture (inline SVG data-URI, like the current noise overlay) on hero and
  section backgrounds; keep the existing noise overlay at low opacity on top.
- Cards: off-white `--paper` faces on `--ink`, 2px black border, hard offset shadow,
  alternating ±1.5° rotation. Hover: rotation snaps to 0, shadow grows, 80ms.
- Star/spike SVG accents pinned to card corners (decorative, `aria-hidden`).

### Motion language
- Easing: `cubic-bezier(0.9, 0, 0.1, 1)` — hard, snappy cuts. Durations 150–350ms.
- Page load: hero layers slam in along the −3° diagonal with stagger (reuse the existing
  `.animate-hero` delay mechanism).
- Scroll reveals: keep `animations.js` IntersectionObserver + `.animate-on-scroll`;
  change the CSS so entries slide along the diagonal with a slight skew settle.
- Marquee strips: repeated "DUZO ★ JAVA DEVELOPER ★ MINECRAFT MODDER ★" CSS-only loops —
  one under the hero, one as footer.
- `prefers-reduced-motion`: disable marquees, vinyl spin, auto-scroll carousel
  (set `scrollSpeed = 0` and pause loops), and entrance animations. **New — the current
  site doesn't honour it.**

---

## 3. Section-by-Section

### Nav (`#navbar`)
- Black angled bar (bottom edge clipped −1°), brand **DUZO** in Anton with red offset shadow.
- Links: uppercase wide Archivo; hover = red slash underline sweeping in from the left.
- Keep: all IDs (`navbar`, `navLinks`, `navToggle`, `themeToggle`, `themeIcon`),
  `toggleNav()`/`toggleTheme()` inline handlers, scrolled-state class.
- Mobile: full-screen black takeover, giant staggered link entrances (very P5).

### Hero
- Full-viewport. Layers back-to-front: halftone starburst → diagonal red panel sweep →
  giant **DUZO** (Anton, ~16vw, white fill, red hard shadow at +8px, black echo at −8px,
  −4° rotation) → ticket-strip tagline → CTAs.
- `// hello world` stays, restyled as a mono "stamp" above the wordmark.
- Tagline ("Java Developer / Minecraft Modder / Creator") becomes a ticket-stub strip;
  separators become ★.
- CTAs: parallelogram (skewed) buttons — solid red "VIEW PROJECTS", paper-outline
  "GET IN TOUCH".
- Scroll indicator: animated chevrons replacing the pulse line.
- Replaces: grid lines + emerald glow-pulse (delete `.hero-grid-lines`, `glow-pulse`).

### About (`#about`)
- Collage layout. Bio card: paper face, −1° rotation, red corner slash, greeting set in
  mixed sizes ("hello, my name is **JAMES**" with the name in Anton red).
- A-level tags → ticket stubs (perforated dashed left edge, mono text).
- Avatar: **switch to a local image** (`img/self.jpg` or `img/me.gif`) — the current
  Discord CDN URL is signed and will eventually 404. Jagged polygon frame, star pin.
  Keep the online status dot (it's charming).
- Cat card → taped polaroid: white border, +3° rotation, two "tape" pseudo-elements.
- Spotify widget → "NOW SPINNING" record sleeve: album art rendered as a vinyl disc that
  rotates while `.playing` (CSS only), equalizer badge stays.
  Keep IDs: `spotifyWidget`, `nowPlayingBadge`, `spotify-song`, `spotify-album-cover`,
  `spotify-album-info` and the `.playing` class contract — `spotify.js` unchanged.

### Skills (`#skills`)
- Scattered "card stock" chips: paper face, 2px border, hard shadow, alternating tilt,
  icon + uppercase name. Hover: flips to red face, white icon, snaps straight.
- Keep `<a>` wrappers and Font Awesome icons; pure CSS re-skin.

### Projects (`#projects`)
- Section header: huge outlined "PROJECTS" ghost text behind the title (Anton, stroke only).
- Stats: scoreboard treatment — Anton numerals in red, mono labels. Keep `statProjects`/
  `statDownloads` IDs (the animated counters in `projects.js` keep working).
- GitHub stats cards: update the URL theme params only —
  `bg_color=0b0b0d`, `title_color=e1062c`, `text_color=f7f3e8`, `border_color=2a2a2e`.
- Featured project → **"ALL-OUT" boss card**: full-width diagonal red/black split,
  logo in jagged frame, name in Anton, gold `--gold` featured badge. Skeleton states keep
  their classes. Keep `featuredProject`/`featuredContent` IDs.
- Spotlight panel → **calling card**: red card, jagged white inner border, name set large.
  Keep all `spotlight*` IDs, `.visible` class, and the `.spotlight-hint`/`.spotlight-inner`
  display contract used by `carousel.js`.
- Carousel: mechanics untouched. Tiles re-skinned as tilted paper cutouts; `.active` ring
  becomes a red sketchy double-border; `.locked` gets a wax-seal star badge.
- Native chips: generated as `.chip` anchors with Font Awesome icons and download counts
  where local API data is available.

### Contact (`#contact`)
- Heading: "SEND A CALLING CARD." in Anton with red underline slash.
- Link grid → sticker/stamp wall: each link a stamp with perforated border and random
  ±2° tilt; hover straightens and pops red.
- Persona cat: framed, caption stays ("persona cat lol" is the brand).
- Credits + a new footer marquee strip ("THANK YOU FOR VISITING ★ DUZO ★ …").
- Ko-fi widget: update the two hardcoded hex colors in `index.html` to
  `#0b0b0d` / `#e1062c`.

---

## 4. Contracts That Must Not Break

IDs referenced by JS (keep verbatim):
`navbar, navLinks, navToggle, themeToggle, themeIcon, spotifyWidget, nowPlayingBadge,
spotify-song, spotify-album-cover, spotify-album-info, statProjects, statDownloads,
featuredProject, featuredContent, projectSpotlight, spotlightLogo, spotlightName,
spotlightDesc, spotlightLinks, carouselTrack, projectCarousel, toggleProjects`

Classes generated or toggled by JS (keep verbatim, restyle freely):
`section-window, project-logo, links, link-img, svg, carousel-slide, clone, loading-tile,
featured-logo, featured-info, featured-name, featured-desc, featured-links,
spotlight-icon-link, spotlight-badge-link, spotlight-hint, spotlight-inner,
active, locked, expanded, visible, playing, animate-on-scroll, animate-hero, scrolled`

Other contracts:
- `data-theme="dark|light"` on `<html>` + localStorage key `theme`.
- `carousel.js` computes slide width with a hardcoded `+ 14` gap — if the CSS gap
  changes, update that constant to match (or read the computed gap).
- Plausible analytics script, FA kit, CNAME, and all of `sites/` stay as-is.

---

## 5. File-Level Changes

| File | Change |
|---|---|
| `index.html` | Restructure markup per §3; keep all IDs/handlers; local avatar; Ko-fi + GitHub-stats colors; add halftone/marquee elements; `loading="lazy"` on below-fold imgs |
| `style.css` | Full rewrite under the Phantom design system (same single-file organisation, section-banner comments) |
| `script/projects.js` | Badge URL color params only |
| `script/carousel.js` | Gap constant if needed; respect `prefers-reduced-motion` (skip auto-scroll) |
| `script/animations.js` | Unchanged (CSS handles the new reveal look) |
| `script/windows.js` | **Delete** — `updateScreen()` is dead code; remove the `<script>` tag |
| `script/spotify.js` | Unchanged |

---

## 6. Implementation Phases

1. **Foundation** — fonts, design tokens, base/reset, halftone + noise overlays, both themes.
2. **Nav + Hero** — wordmark composition, marquee strip, CTAs, mobile takeover menu.
3. **About + Skills** — collage cards, vinyl Spotify widget, ticket stubs, skill chips.
4. **Projects** — boss card, calling-card spotlight, carousel re-skin, scoreboard stats,
   badge/stats-image recolors.
5. **Contact + Footer** — stamp wall, footer marquee, Ko-fi recolor, credits.
6. **Themes + Responsive + A11y** — light theme pass, 768px/480px breakpoints,
   `prefers-reduced-motion`, contrast check (body text is paper-on-ink in dark, ink-on-paper
   in light; red reserved for large display text and accents).
7. **Verification + cleanup** — local preview: console clean, Modrinth/Lanyard flows work,
   carousel hover/lock/expand, theme toggle both ways, 380px width has no horizontal
   overflow from rotated elements; screenshots; delete `windows.js`.

## 7. Risks / Notes

- Rotated + clip-path elements are the main overflow-x risk on mobile — every rotated
  card sits inside an `overflow: clip` wrapper.
- shields.io and github-readme-stats theming is URL-param-only — no code risk, verify
  rendered colors visually.
- The Discord CDN avatar swap is a content fix bundled into the redesign (signed URL rot).
- Project order is randomly shuffled per load today; kept as-is (feels alive), the
  featured card is deterministic anyway.
