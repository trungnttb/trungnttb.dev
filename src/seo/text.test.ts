import { describe, expect, it } from 'vitest';
import { clipText, pageTitle } from './text';

describe('pageTitle', () => {
  it('keeps the suffix when it fits', () => {
    expect(pageTitle('Short title', 'trungnttb.dev')).toBe('Short title · trungnttb.dev');
  });
  it('drops the suffix when the result would pass 60 characters', () => {
    const title = 'Nguyễn Thành Trung — Full-stack Web Developer';
    expect(pageTitle(title, 'trungnttb.dev')).toBe(title);
  });
  it('falls back to the site name', () => {
    expect(pageTitle(undefined, 'trungnttb.dev')).toBe('trungnttb.dev');
  });
  it('counts Vietnamese characters, not UTF-16 units', () => {
    expect(pageTitle('ờ'.repeat(44), 'trungnttb.dev')).toBe(`${'ờ'.repeat(44)} · trungnttb.dev`);
  });
});

describe('clipText', () => {
  it('leaves short text alone', () => {
    expect(clipText('Hello there.')).toBe('Hello there.');
  });
  it('cuts at a word boundary and adds an ellipsis within the limit', () => {
    const text = 'Jev của TypeSafe AI nhận văn bản, trả về lựa chọn, điểm số và xác suất thay cho câu trả lời viết. Bài này tìm hiểu nó làm được gì.';
    const clipped = clipText(text, 60);
    expect([...clipped].length).toBeLessThanOrEqual(60);
    expect(clipped.endsWith('…')).toBe(true);
    expect(text.startsWith(clipped.slice(0, -1))).toBe(true);
    expect(clipped).not.toMatch(/[\s,]…$/u);
  });
});
