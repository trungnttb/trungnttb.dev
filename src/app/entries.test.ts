import { describe, expect, it } from 'vitest';
import { entryUrl, fold, searchEntries, type EntrySummary } from './entries';

const entries: EntrySummary[] = [
  { collection: 'posts', id: 'a', title: 'Hello terminal', summary: 'Tiếng Việt có dấu', date: '2026-01-01', tags: ['astro'] },
  { collection: 'notes', id: 'b', title: 'Typed debounce', summary: 'utility', date: '2026-01-02', tags: ['typescript'], lang: 'ts' },
];

describe('fold', () => {
  it('strips Vietnamese diacritics including đ', () => {
    expect(fold('Đường Tiếng Việt')).toBe('duong tieng viet');
  });
});

describe('searchEntries', () => {
  it('returns everything for a blank query', () => {
    expect(searchEntries(entries, '   ')).toHaveLength(2);
  });
  it('matches without diacritics', () => {
    expect(searchEntries(entries, 'tieng viet').map((e) => e.id)).toEqual(['a']);
  });
  it('requires every term', () => {
    expect(searchEntries(entries, 'hello debounce')).toEqual([]);
  });
  it('matches tags and lang', () => {
    expect(searchEntries(entries, 'ASTRO').map((e) => e.id)).toEqual(['a']);
    expect(searchEntries(entries, 'ts').map((e) => e.id)).toEqual(['b']);
  });
});

describe('entryUrl', () => {
  it('builds a trailing-slash path', () => {
    expect(entryUrl({ collection: 'notes', id: 'b' })).toBe('/notes/b/');
  });
});
