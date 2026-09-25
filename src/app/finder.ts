import { locale, t } from '../i18n';
import { h } from './dom';
import { entryUrl, searchEntries, type CollectionName, type EntrySummary } from './entries';

export type HistoryState =
  | { view: 'cli' }
  | { view: 'list'; collection: CollectionName }
  | { view: 'entry'; collection: CollectionName; id: string };

export interface FinderElements {
  root: HTMLElement;
  title: HTMLElement;
  search: HTMLInputElement;
  back: HTMLButtonElement;
  close: HTMLButtonElement;
  maximize: HTMLButtonElement;
  listView: HTMLElement;
  rows: HTMLElement;
  count: HTMLElement;
  detailView: HTMLElement;
  detail: HTMLElement;
}

export interface Finder {
  openList(collection: CollectionName): void;
  /** Adopts the server-rendered entry on a directly opened detail page. */
  adoptEntry(collection: CollectionName, id: string): void;
  close(): void;
  isOpen(): boolean;
  /** Re-renders the view a history entry points to, without touching history. */
  restore(state: HistoryState | null): void;
}

export interface FinderOptions {
  elements: FinderElements;
  entries: EntrySummary[];
  siteTitle: string;
  onClosed: () => void;
}

const dateFormat = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' });

function navigate(state: HistoryState, url: string): void {
  const same = location.pathname === url && JSON.stringify(history.state) === JSON.stringify(state);
  if (same) history.replaceState(state, '', url);
  else history.pushState(state, '', url);
}

export function createFinder({ elements: el, entries, siteTitle, onClosed }: FinderOptions): Finder {
  let collection: CollectionName = 'posts';
  let visible: EntrySummary[] = [];
  let selected = 0;
  let loadToken = 0;
  const cache = new Map<string, Element>();

  const find = (c: CollectionName, id: string) => entries.find((e) => e.collection === c && e.id === id);

  function show(): void {
    el.root.hidden = false;
    document.documentElement.classList.add('finder-open');
  }

  function renderRows(): void {
    const query = el.search.value;
    visible = searchEntries(
      entries.filter((e) => e.collection === collection),
      query,
    );
    selected = Math.min(selected, Math.max(0, visible.length - 1));
    el.rows.replaceChildren(
      ...visible.map((entry, index) =>
        h(
          'li',
          { role: 'option', 'aria-selected': index === selected ? 'true' : 'false', class: 'finder-row', 'data-index': String(index) },
          h(
            'span',
            { class: 'finder-name' },
            h('span', { class: `finder-icon finder-icon-${entry.collection}`, 'aria-hidden': 'true' }),
            h('span', { class: 'finder-title' }, entry.title),
            h('span', { class: 'finder-summary' }, entry.summary),
          ),
          h('span', { class: 'finder-date' }, dateFormat.format(new Date(entry.date))),
          h('span', { class: 'finder-tags' }, [entry.lang, ...entry.tags].filter(Boolean).join(', ')),
        ),
      ),
    );
    if (visible.length === 0 && query.trim() !== '') {
      el.rows.append(h('li', { class: 'finder-empty' }, t('finder.empty', { query })));
    }
    el.count.textContent = t('finder.count', { n: visible.length });
  }

  function select(index: number): void {
    if (visible.length === 0) return;
    selected = (index + visible.length) % visible.length;
    el.rows.querySelectorAll<HTMLElement>('.finder-row').forEach((row, i) => {
      row.setAttribute('aria-selected', i === selected ? 'true' : 'false');
      if (i === selected) row.scrollIntoView({ block: 'nearest' });
    });
  }

  function showList(next: CollectionName, { resetSearch }: { resetSearch: boolean }): void {
    if (next !== collection || resetSearch) {
      el.search.value = '';
      selected = 0;
    }
    collection = next;
    const name = t(`finder.title.${collection}`);
    el.title.textContent = name;
    el.search.placeholder = t('finder.search', { collection: name });
    el.back.hidden = true;
    el.search.hidden = false;
    el.listView.hidden = false;
    el.detailView.hidden = true;
    document.title = `${name} · ${siteTitle}`;
    renderRows();
    show();
    el.search.focus({ preventScroll: true });
  }

  async function showEntry(entry: EntrySummary): Promise<void> {
    collection = entry.collection;
    el.title.textContent = t(`finder.title.${collection}`);
    el.back.hidden = false;
    el.search.hidden = true;
    el.listView.hidden = true;
    el.detailView.hidden = false;
    document.title = `${entry.title} · ${siteTitle}`;
    show();

    const url = entryUrl(entry);
    const token = ++loadToken;
    const cached = cache.get(url);
    if (cached) {
      el.detail.replaceChildren(cached.cloneNode(true));
    } else {
      el.detail.replaceChildren(h('p', { class: 'finder-status' }, t('finder.loading')));
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const page = new DOMParser().parseFromString(await response.text(), 'text/html');
        const article = page.querySelector('[data-entry-article]');
        if (!article) throw new Error('No [data-entry-article] in page');
        cache.set(url, article);
        if (token === loadToken) el.detail.replaceChildren(document.importNode(article, true));
      } catch (error) {
        console.error('[finder] failed to load entry', url, error);
        if (token === loadToken) {
          el.detail.replaceChildren(
            h('p', { class: 'finder-status' }, t('finder.loadError'), ' ', h('a', { href: url }, t('finder.openPage'))),
          );
        }
      }
    }
    el.detailView.scrollTop = 0;
    el.back.focus({ preventScroll: true });
  }

  function hide(): void {
    el.root.hidden = true;
    document.documentElement.classList.remove('finder-open');
    document.title = siteTitle;
  }

  function openEntry(entry: EntrySummary): void {
    navigate({ view: 'entry', collection: entry.collection, id: entry.id }, entryUrl(entry));
    void showEntry(entry);
  }

  function backToList(): void {
    navigate({ view: 'list', collection }, '/');
    showList(collection, { resetSearch: false });
  }

  function close(): void {
    if (el.root.hidden) return;
    navigate({ view: 'cli' }, '/');
    hide();
    onClosed();
  }

  el.search.addEventListener('input', () => {
    selected = 0;
    renderRows();
  });
  el.search.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      select(selected + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      select(selected - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const entry = visible[selected];
      if (entry) openEntry(entry);
    }
  });
  el.rows.addEventListener('click', (event) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('.finder-row');
    const entry = row ? visible[Number(row.dataset.index)] : undefined;
    if (entry) openEntry(entry);
  });
  el.back.addEventListener('click', backToList);
  el.close.addEventListener('click', close);
  el.maximize.addEventListener('click', () => {
    const maximized = el.root.toggleAttribute('data-maximized');
    el.maximize.setAttribute('aria-pressed', String(maximized));
  });
  el.root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (!el.detailView.hidden) backToList();
    else close();
  });

  return {
    openList(next) {
      navigate({ view: 'list', collection: next }, '/');
      showList(next, { resetSearch: true });
    },
    adoptEntry(c, id) {
      const entry = find(c, id);
      if (!entry) return;
      history.replaceState({ view: 'entry', collection: c, id } satisfies HistoryState, '', entryUrl(entry));
      const article = el.detail.querySelector('[data-entry-article]');
      if (article) cache.set(entryUrl(entry), article.cloneNode(true) as Element);
      collection = c;
      el.title.textContent = t(`finder.title.${c}`);
      el.back.hidden = false;
      el.search.hidden = true;
      el.listView.hidden = true;
      el.detailView.hidden = false;
      show();
    },
    close,
    isOpen: () => !el.root.hidden,
    restore(state) {
      if (!state || state.view === 'cli') {
        if (!el.root.hidden) {
          hide();
          onClosed();
        }
        return;
      }
      if (state.view === 'list') showList(state.collection, { resetSearch: false });
      else {
        const entry = find(state.collection, state.id);
        if (entry) void showEntry(entry);
      }
    },
  };
}
