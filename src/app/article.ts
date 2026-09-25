import { t } from '../i18n';
import { h } from './dom';

const ACTIVE_OFFSET_PX = 96;

let teardown: AbortController | null = null;

/**
 * Wires an article shown in the finder: table-of-contents scrolling and highlighting, Mermaid
 * rendering, and the full-screen button on diagrams. Safe to call again for the next article.
 */
export function enhanceArticle(container: HTMLElement, scrollRoot: HTMLElement): void {
  teardown?.abort();
  teardown = new AbortController();
  const { signal } = teardown;
  const article = container.querySelector<HTMLElement>('[data-entry-article]');
  if (!article) return;

  setUpToc(article, scrollRoot, signal);
  wrapSvgDiagrams(article);
  void renderMermaid(article);
}

function setUpToc(article: HTMLElement, scrollRoot: HTMLElement, signal: AbortSignal): void {
  const links = [...article.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')];
  if (links.length === 0) return;
  const headings = [...new Set(links.map((link) => link.dataset.tocLink!))]
    .map((slug) => article.querySelector<HTMLElement>(`#${CSS.escape(slug)}`))
    .filter((heading): heading is HTMLElement => heading !== null);

  // Plain #hash links would fire popstate with a null state, which the router reads as "close".
  article.addEventListener(
    'click',
    (event) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-toc-link]');
      if (!link) return;
      event.preventDefault();
      const heading = article.querySelector<HTMLElement>(`#${CSS.escape(link.dataset.tocLink!)}`);
      if (!heading) return;
      const top = heading.getBoundingClientRect().top - scrollRoot.getBoundingClientRect().top + scrollRoot.scrollTop;
      scrollRoot.scrollTo({ top: top - 16, behavior: 'smooth' });
      link.closest('details')?.removeAttribute('open');
    },
    { signal },
  );

  let frame = 0;
  const highlight = () => {
    frame = 0;
    const rootTop = scrollRoot.getBoundingClientRect().top;
    let current = headings[0]?.id;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top - rootTop <= ACTIVE_OFFSET_PX) current = heading.id;
      else break;
    }
    for (const link of links) link.setAttribute('aria-current', String(link.dataset.tocLink === current));
  };
  scrollRoot.addEventListener(
    'scroll',
    () => {
      if (frame === 0) frame = requestAnimationFrame(highlight);
    },
    { signal, passive: true },
  );
  highlight();
}

function diagramFrame(content: Element, source: 'svg' | 'mermaid'): HTMLElement {
  const expand = h(
    'button',
    { type: 'button', class: 'diagram-expand', 'aria-label': t('diagram.expand'), title: t('diagram.expand') },
  );
  expand.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/></svg>';
  const frame = h('figure', { class: 'diagram', 'data-diagram': source });
  frame.append(content, expand);
  expand.addEventListener('click', () => openFullscreen(frame));
  return frame;
}

/** Hand-authored SVG: inline `<svg>` blocks and `.svg` images at the top level of the body. */
function wrapSvgDiagrams(article: HTMLElement): void {
  const body = article.querySelector('.entry-body');
  if (!body) return;
  const candidates = body.querySelectorAll<Element>(
    ':scope > svg, :scope > figure > svg, :scope > p > img[src$=".svg"], :scope > figure > img[src$=".svg"]',
  );
  for (const node of candidates) {
    if (node.closest('.diagram')) continue;
    const parent = node.parentElement!;
    // The frame replaces the <figure> (keeping its caption) or a <p> holding only the image.
    const host = parent.tagName === 'FIGURE' || (parent.tagName === 'P' && parent.childElementCount === 1) ? parent : node;
    const caption = host.tagName === 'FIGURE' ? host.querySelector(':scope > figcaption') : null;
    const placeholder = document.createComment('diagram');
    host.before(placeholder);
    const frame = diagramFrame(node, 'svg');
    if (caption) frame.append(caption);
    if (host !== node) host.remove();
    placeholder.replaceWith(frame);
  }
}

let mermaidReady: Promise<typeof import('mermaid').default> | null = null;
let diagramCount = 0;

function loadMermaid() {
  mermaidReady ??= import('mermaid').then(({ default: mermaid }) => {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim();
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: token('--font-mono'),
      themeVariables: {
        background: token('--color-coffee-900'),
        primaryColor: token('--color-coffee-800'),
        primaryTextColor: token('--color-foam'),
        primaryBorderColor: token('--color-crema'),
        secondaryColor: token('--color-coffee-850'),
        tertiaryColor: token('--color-coffee-900'),
        lineColor: token('--color-latte'),
        textColor: token('--color-foam'),
        noteBkgColor: token('--color-coffee-700'),
        noteTextColor: token('--color-foam'),
      },
    });
    return mermaid;
  });
  return mermaidReady;
}

async function renderMermaid(article: HTMLElement): Promise<void> {
  const blocks = [...article.querySelectorAll<HTMLElement>('pre > code.language-mermaid')];
  if (blocks.length === 0) return;
  const mermaid = await loadMermaid();
  for (const code of blocks) {
    const pre = code.parentElement!;
    if (!pre.isConnected) continue;
    try {
      const { svg } = await mermaid.render(`mermaid-${++diagramCount}`, code.textContent ?? '');
      const holder = h('div', { class: 'diagram-canvas' });
      holder.innerHTML = svg;
      pre.replaceWith(diagramFrame(holder, 'mermaid'));
    } catch (error) {
      console.error('[mermaid] render failed', error);
      pre.before(h('p', { class: 'diagram-error' }, t('diagram.renderError')));
    }
  }
}

function openFullscreen(frame: HTMLElement): void {
  document.querySelectorAll<HTMLDialogElement>('dialog.diagram-dialog:not([open])').forEach((stale) => stale.remove());
  const content = frame.querySelector('.diagram-canvas, :scope > svg, :scope > img')?.cloneNode(true);
  if (!content) return;
  const close = h('button', { type: 'button', class: 'diagram-dialog-close', 'aria-label': t('diagram.close'), title: t('diagram.close') }, '×');
  const dialog = h('dialog', { class: 'diagram-dialog', 'aria-label': t('diagram.expand') }, h('div', { class: 'diagram-dialog-body' }, content), close);
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}
