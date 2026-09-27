/** Google typically truncates result titles past ~60 characters. */
export const TITLE_MAX = 60;
/** Social previews typically show ~125 characters of the description, fewer on mobile. */
export const DESCRIPTION_MAX = 125;

/** Appends the site suffix only when the whole title still fits. */
export function pageTitle(title: string | undefined, site: string, max = TITLE_MAX): string {
  if (!title) return site;
  const full = `${title} · ${site}`;
  return [...full].length <= max ? full : title;
}

/** Shortens at a word boundary and ends with an ellipsis; text already short enough is returned unchanged. */
export function clipText(text: string, max = DESCRIPTION_MAX): string {
  const chars = [...text];
  if (chars.length <= max) return text;
  const head = chars.slice(0, max - 1).join('');
  const cut = head.lastIndexOf(' ');
  return `${(cut > max / 2 ? head.slice(0, cut) : head).replace(/[\s,;:.–—-]+$/u, '')}…`;
}
