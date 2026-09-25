---
name: writing-posts
description: Writes a new post or note for this Astro portfolio from a topic or a request — researches the subject from primary sources, writes the markdown with correct frontmatter into src/content/posts or src/content/notes, uses the site's supported blocks (Shiki code, tables, Mermaid, inline SVG diagrams), and verifies it builds and reads well. Use when the user says "viết bài về X", "viết post", "viết một bài dài về", "tạo note", "lưu snippet này thành note", "nghiên cứu X rồi viết bài", "write a post about", "draft an article", "add a note for this script". Not for editing the site's UI, layouts or components, and not for research that should end as a docs/ file rather than a published post.
---

# writing-posts — a post or note that holds up when someone checks it

The site shows two collections through the same finder UI. The job is one markdown file that
builds, renders every block correctly, and whose claims can be traced to a source.

## 1. Decide the collection and the file

| | `posts` | `notes` |
|---|---|---|
| What it is | long-form article: explains, compares, argues | a standalone script or snippet kept for reuse, plus a few lines of context |
| Folder | `src/content/posts/` | `src/content/notes/` |
| Typical length | 1,000–3,000 words, several `##` sections | 1 code block + 1–5 sentences |

The file name is the URL id: `src/content/posts/<id>.md` → `/posts/<id>/`. Use lowercase ASCII
kebab-case (`jev-system-one-model`, not `jev-mô-hình`), because the id appears in shared links.

If the request does not say which, a request to *explain* something is a post; a request to *keep*
a command or function is a note. Ask only if it is genuinely both.

## 2. Frontmatter — the build fails on anything else

Schemas live in `src/content.config.ts`; these are their fields today:

```yaml
# posts
title: "…"            # quote it when it contains a colon
summary: …           # 1–2 sentences, shown in the list and as the meta description
date: 2026-09-25     # publication date, YYYY-MM-DD
tags: [ai, llm]      # lowercase
draft: false         # optional; true hides it from production builds

# notes
title: …
description: …       # one sentence
lang: bash           # main language of the snippet, shown in the list
date: 2026-09-25
tags: [git]
draft: false         # optional
```

Re-read `src/content.config.ts` before writing if you suspect the schema changed.

## 3. Research — from the primary source, before a single paragraph

For anything factual (a product, a library, an event), collect sources first and write second.

- **Primary first:** the vendor's docs, changelog, API reference, press release, repository. Secondary
  articles are for leads, not facts; they get names and dates wrong (a summary spelled a founder
  "Diego"; the company's own post said "Diogo").
- **Cross-check every number and name** across at least two sources. When sources disagree, say so
  in the text with each figure and its source rather than picking one silently.
- **Company-reported numbers are labelled as such** in the prose ("TypeSafe tự công bố", "theo trang
  chủ của họ"), and say when no third party has measured them.
- **Recompute what can be recomputed.** If the docs give a formula and an example, check the example
  against the formula and mention the result.
- **Code comes from the docs or from something you ran.** If you assemble an example yourself (types,
  a wrapper), say so in the sentence before it. Never invent an SDK name or a flag.
- End the post with `## Nguồn` (or `## Sources` in an English post): a list of links, primary first.
- Add a short blockquote near the top stating the as-of date and whether you ran anything.
- Add a `## Còn những gì chưa rõ` section when real gaps remain; it is more useful than guessing.

## 4. Writing

- **Language:** write in the language the user asked in (default Vietnamese for this site). Code,
  identifiers, code comments and API field names stay in English. The English sample entries that
  shipped with the site are placeholders; they do not set the house language.
- **Vietnamese register:** say what happens, in the words a developer would use with a colleague.
  Translate meaning, never word by word. No image words standing in for behaviour — *sống, chết,
  nuốt, đè, rơi, bám, trần, sàn* — write "lỗi bị bỏ qua", not "lỗi bị nuốt"; "tối đa 60s", not
  "trần 60s". Where Vietnamese has no natural term keep the English keyword whole (`confidence`,
  `prompt injection`, `idempotent`).
- **Headings must make sense alone**, because they become the table of contents. A heading built
  around a product term also says what the term is: "Noul: câu hỏi đúng/sai", not "Noul: đúng hay
  sai".
- **Structure:** `##` for sections, `###` for sub-sections. Do not write an `#` heading: the page
  renders the title from frontmatter.
- **Title and summary** are what the finder list and link previews show: concrete, no clickbait.

## 5. Blocks the site renders

Details and copy-ready examples are in `references/blocks.md` — read it before using any of these.

- Fenced code blocks with a language get Shiki highlighting and a Copy button automatically.
- GFM tables work and scroll horizontally on narrow screens.
- A table of contents is generated automatically when the post has **3 or more `##` headings**;
  nothing to write by hand.
- ` ```mermaid ` blocks render as diagrams in the browser, with a full-screen button.
- Inline `<svg>` inside `<figure>` (or a standalone `![](…svg)` image) gets the same diagram frame and
  full-screen button. Colour it with the site tokens (`var(--color-crema)` …), not hex values.

## 6. Verify — every item, in order

1. `pnpm check` → `0 errors`. A schema mistake in frontmatter fails here.
2. `pnpm build` → the new route appears in the "generating static routes" list.
3. Open `/posts/<id>/` (or `/notes/<id>/`) in the dev server. If the dev server started before the
   file existed and answers 404, run `pnpm astro dev stop` and start it again — its content store
   does not always pick up new files.
4. On the page, check: each Mermaid block became a diagram (no raw ` ```mermaid ` text and no red
   "could not render" line), each SVG sits in a frame with a full-screen button, code blocks show
   Copy, the TOC lists the sections you expect.
5. **Restate check (anything written in Vietnamese, posts and notes):** give only the title,
   summary or description, every heading, and every figure caption — without the article or the sources — to a fresh subagent, and ask it to restate
   each line in its own words and flag anything unclear or unnatural. Rewrite every line it restates
   wrongly or cannot restate, then re-run the check on the changed lines.
6. Report to the user: the file path, the sources used, which numbers are company-reported, what you
   ran, and what remains unverified.

## Scale the ceremony

- A note from a snippet the user pasted or a command you write: skip source research, but confirm the
  command works — run it in a throwaway directory when it is safe, including an edge case (for a
  destructive command, show the preview command first). Write 1–5 sentences, then run verify steps
  1–3 and 5 (for a note, step 5 covers only the title and description).
- A long post on an external subject: the full workflow, including the restate check.
