# AGENTS.md

Personal portfolio site. A fullscreen 3D home scene (a developer at a desk with a MacBook and a coffee
mug, lit according to the viewer's local time) zooms into the laptop screen, which becomes a
CLI-style interface for `/help`, `/me`, `/projects`, `/posts`, `/notes`.

## Status

All three parts are implemented with a code-built placeholder model (D1 phase B). The design and every decision (D1–D8) live in `docs/design.md`; read it before starting
any part. Next: replace the placeholder model with a MagicaVoxel `.glb` (same node names) and real content.

## Stack

- Astro (static output), content collections for posts and notes
- TailwindCSS
- Three.js for the home scene
- Shiki for code blocks (Astro's built-in highlighter), plus a copy button on every block

## Architecture decisions (details in `docs/design.md`)

- **Build order:** CLI + content first (it must work without 3D and is the fallback for
  `prefers-reduced-motion` and weak devices), then the 3D scene + time-of-day lighting, then the
  scroll / `` ` `` transition that joins the two.
- **CLI is real DOM layered over the WebGL canvas.** The camera zooms until the `Screen` node fills
  the viewport, then the view crossfades to the DOM terminal. Never render the CLI as a WebGL
  texture: typing, text selection, copy, search and Shiki output all need the DOM.
- **Model contract:** scene code reads the model only through these node names: `Screen`, `Mug`,
  `Desk`. The first model is built in code (boxes / `InstancedMesh`); it is later replaced by a
  MagicaVoxel-made `.glb` that keeps the same node names.
- **Posts and notes share one UI** (Finder-style modal, search, detail page, Shiki + copy). They
  differ only in source folder and schema: `src/content/posts/` holds long articles,
  `src/content/notes/` holds short standalone scripts/snippets kept for reference. Write the modal
  and detail page once, parameterised by collection.
- **CLI input:** typing a command and clicking one in the first line both call the same command
  runner. An unknown command prints a terminal-style error (`command not found: /foo`, pointing to
  `/help`); the message text lives in the i18n dictionary.
- **Time-of-day lighting:** four presets by the viewer's local clock (05–07 dawn, 07–12 morning,
  12–18 afternoon, 18–05 night). Parameters interpolate over 30 minutes centred on each boundary;
  recompute once a minute.
- **3D ↔ CLI switch:** desktop scroll, mobile swipe-up, the backquote key (`` ` ``, below Esc, no
  Shift) and the on-screen keycap buttons all call the same zoom function. The key matches
  `event.key === '`'` without modifiers, so Shift+` (`~`) does nothing. It always toggles, even
  while the CLI input is focused, so `` ` `` cannot be typed into the input (no command uses it).
- **Time of day:** the clock widget (top right of the scene) cycles dawn → morning → afternoon →
  night; "Auto" follows the local clock. The choice lives in `localStorage` under
  `portfolio.timeOfDay` (absent = auto); lighting blends over 700 ms when it changes.
- **Scene interaction:** horizontal drag spins the overview; the spin fades to zero as the zoom
  progresses so the camera path never cuts through the model.
- **Articles:** a table of contents is generated when a post has 3+ `##` headings (sticky column
  ≥1200px, collapsible otherwise); TOC links scroll with JS and never set `#hash` (a hash change
  fires `popstate` with a null state, which the router treats as "close the finder"). Mermaid
  blocks are excluded from Shiki and rendered client-side from a lazy `mermaid` chunk; inline SVG
  and `.svg` images get the same diagram frame; any diagram opens full screen in a `<dialog>`.
- **Writing content:** use the project skill `.claude/skills/writing-posts` for new posts/notes.
- **Routes:** `/` is the 3D scene; `/posts/<slug>` and `/notes/<slug>` are statically generated
  detail pages. Opening one from the CLI updates the URL (Back returns to the list). Opening one
  directly shows the CLI with that entry open and never loads Three.js.

## Versions

- Node.js: latest **LTS** line (24.x at 2026-09-25; `.nvmrc` pins the major).
- Package manager: **pnpm** (12.6.0 at 2026-09-25), recorded in `package.json` `packageManager`.
  Never use npm or yarn to install.
- Tailwind: stay on the **4.3.x** line (owner's choice); ask before moving to 4.4.
- TypeScript: **6.x**, not 7 — `@astrojs/check` peers on `typescript ^5 || ^6`. Move to 7 when it does.
- Every other dependency: the npm `latest` dist-tag, i.e. newest stable. Never `alpha` / `beta` /
  `rc` / `next`, and never Tailwind's `v3-lts` tag (an old maintained branch, not the newest).
- Install with `pnpm add <pkg>@latest`, commit the lockfile. Major upgrades are their own change,
  never mixed with feature work. Versions observed at design time are in `docs/design.md` (D4).

## Conventions

- Source code, comments, commit messages and logs are English.
- Every UI string (CLI chrome, `/help` descriptions, button labels, search placeholder) goes into an
  i18n dictionary with English keys; code only references keys.
- Content the owner wrote (post titles, summaries, markdown bodies, bio text) is never translated;
  only the UI around it switches language.
- Comments record constraints the code cannot state by itself, not change history.

## Layout

```
src/
  app/          client code: main.ts (boot + 3D↔CLI controller), cli.ts, finder.ts, copy.ts,
                pure logic with tests (commands.ts, entries.ts), Shiki code-block transformer
  scene/        Three.js: scene.ts (lazy-loaded chunk), model.ts (placeholder workspace),
                lighting.ts + framing.ts (pure, tested)
  components/   AppShell.astro (all DOM for scene/CLI/finder), EntryArticle.astro
  pages/        index.astro, posts/[id].astro, notes/[id].astro
  content/      posts/*.md, notes/*.md (schemas in src/content.config.ts)
  data/         profile.ts, projects.ts — owner content shown by /me and /projects
brand/          logo SVG sources; `pnpm brand` renders public/brand/*.png, favicon.ico, apple-touch-icon
docs/research/  research write-ups (*.raw.md), e.g. OG images and share buttons
  i18n/         en.ts (source of keys), vi.ts; `locale` in index.ts picks the UI language
```

- `scene.ts` must only be reached through the dynamic `import()` in `main.ts`, so Three.js
  (~136 KB gzip) stays out of the initial bundle and out of directly opened entry pages.
- Model details that must not regress: every face overlay on the head sits ≥1 mm off the skull and
  its neighbours (coplanar faces z-fight and flicker); the desk engraving text is `profile.domain`.

## Commands

```sh
pnpm install     # pnpm version comes from package.json `packageManager`
pnpm dev         # dev server
pnpm test        # vitest: pure logic (commands, search, lighting, framing)
pnpm check       # astro check: types in .ts and .astro
pnpm build       # static build to dist/
pnpm brand       # re-render logo PNGs/ICO from brand/*.svg (uses sharp)
pnpm preview     # serve dist/
```
- pnpm blocks dependency build scripts unless listed under `allowBuilds` in `pnpm-workspace.yaml`.
  Only `esbuild` is allowed (Astro/Vite need its platform binary). Approve a new one with
  `pnpm approve-builds <pkg>` only after checking what its script does.
- Tailwind is wired through `@tailwindcss/vite` in `astro.config.mjs`; the entry stylesheet is
  `src/styles/global.css`.
