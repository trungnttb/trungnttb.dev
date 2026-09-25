import { en, type MessageKey, type Messages } from './en';
import { vi } from './vi';

export type Locale = 'en' | 'vi';

const tables: Record<Locale, Messages> = { en, vi };

/** Site-wide UI language. Content the owner wrote is never translated, whatever this is set to. */
export const locale: Locale = 'en';

export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  const template = tables[locale][key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export type { MessageKey };
