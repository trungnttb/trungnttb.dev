export type CollectionName = 'posts' | 'notes';

export interface EntrySummary {
  collection: CollectionName;
  id: string;
  title: string;
  /** Post summary or note description. */
  summary: string;
  /** ISO date string. */
  date: string;
  tags: string[];
  lang?: string;
}

export function entryUrl(entry: Pick<EntrySummary, 'collection' | 'id'>): string {
  return `/${entry.collection}/${entry.id}/`;
}

/** Lowercase and strip diacritics, so "tieng viet" matches "Tiếng Việt". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Every whitespace-separated term must appear in the title, summary, tags or lang. */
export function searchEntries(entries: EntrySummary[], query: string): EntrySummary[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return entries;
  return entries.filter((entry) => {
    const haystack = fold([entry.title, entry.summary, entry.tags.join(' '), entry.lang ?? ''].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
}
