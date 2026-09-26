# trungnttb.dev

Personal site of **Nguyễn Thành Trung**, full-stack web developer.

A voxel desk scene lit by the visitor's local time. Scroll, swipe, or press `` ` `` and the camera
flies into the laptop screen, which becomes a terminal: `/help`, `/me`, `/work`, `/posts`, `/notes`.
Posts and notes open in a Finder-style window with search, each at its own static URL.

**Live:** https://trungnttb.dev

## Stack

| Layer | Tools |
|---|---|
| Site | [Astro](https://astro.build) 7 (static output), TypeScript |
| Styling | Tailwind CSS 4.3 |
| 3D | Three.js (loaded only when the scene is shown) |
| Content | Markdown content collections, Shiki highlighting, Mermaid and SVG diagrams |
| Link previews | Open Graph images rendered at build time with satori + resvg |
| Tests | Vitest |
| Deploy | GitHub Actions → GitHub Pages |

Runtime: Node.js 24 LTS (`.nvmrc`), pnpm 12 (pinned in `package.json` → `packageManager`).

## Getting started

```sh
nvm use            # Node 24
corepack enable    # uses the pnpm version from package.json
pnpm install
pnpm dev           # http://localhost:4321
```

| Command | What it does |
|---|---|
| `pnpm dev` | dev server with hot reload |
| `pnpm build` | static build into `dist/`, including OG images |
| `pnpm preview` | serve `dist/` locally |
| `pnpm test` | unit tests (commands, search, lighting, framing, time-of-day) |
| `pnpm check` | type-check `.ts` and `.astro` files |
| `pnpm brand` | re-render logo PNGs / `favicon.ico` from `brand/*.svg` |

## Project layout

```
src/
  app/          client code: 3D ↔ terminal controller, CLI, finder, article enhancements
  scene/        Three.js scene, placeholder model, time-of-day lighting
  og/           Open Graph card renderer (satori + resvg)
  components/   AppShell (scene, terminal, finder), EntryArticle
  pages/        routes: /, /posts/[id], /notes/[id], /og/*.png, /site.webmanifest
  content/      posts/*.md and notes/*.md
  data/         profile.ts (/me) and work.ts (/work)
  i18n/         UI strings, en + vi
brand/          logo sources
docs/           design decisions, research, deploy guide
```

## Writing a post or note

Add a markdown file to `src/content/posts/` (long-form) or `src/content/notes/` (snippets). The file
name becomes the URL: `src/content/posts/my-post.md` → `/posts/my-post/`.

```yaml
---
title: "My post"
summary: One or two sentences for the list and link previews.
date: 2026-09-26
tags: [astro]
---
```

Notes use `description` instead of `summary` and add `lang` (the snippet's main language). Code
blocks, tables, ` ```mermaid ` diagrams and inline `<svg>` figures are all supported; the post
[`hello-terminal`](src/content/posts/hello-terminal.md) shows every block. With
[Claude Code](https://claude.com/claude-code), the project skill `.claude/skills/writing-posts`
writes and checks a post from a topic.

## Personal details

Name, bio, links and the work timeline live in `src/data/profile.ts` and `src/data/work.ts`.
UI strings live in `src/i18n/en.ts` and `src/i18n/vi.ts`; `locale` in `src/i18n/index.ts` picks the
language.

## Deploy

Every push to `main` runs the tests, builds, and publishes to GitHub Pages. First-time setup and the
custom domain are covered step by step in [docs/deploy-github-pages.md](docs/deploy-github-pages.md).

## Docs

- [docs/design.md](docs/design.md) — decisions and why they were made
- [docs/deploy-github-pages.md](docs/deploy-github-pages.md) — deploy and domain setup
- [docs/research/og-images-and-sharing.raw.md](docs/research/og-images-and-sharing.raw.md) — OG image research
- [AGENTS.md](AGENTS.md) — conventions for coding agents working in this repo
