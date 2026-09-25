import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const colors = {
  background: '#1a1110',
  panel: '#1f1614',
  border: '#4a372c',
  foam: '#eadbc8',
  crema: '#d9a066',
  latte: '#b89a80',
};

// Satori does not fall back between files that share a family name, so each fontsource subset
// is registered under its own name and listed as a font stack (see docs/research/og-images-and-sharing.raw.md).
const SUBSETS = ['latin', 'latin-ext', 'vietnamese'] as const;
const FONT_STACK = SUBSETS.map((subset) => `JBM ${subset}`).join(', ');

type FontOptions = NonNullable<Parameters<typeof satori>[1]>['fonts'];
let fonts: FontOptions | undefined;

function loadFonts(): FontOptions {
  if (fonts) return fonts;
  // Build runs from the project root; the endpoint is bundled, so resolve from cwd rather than import.meta.url.
  const dir = join(process.cwd(), 'node_modules/@fontsource/jetbrains-mono/files');
  fonts = SUBSETS.flatMap((subset) =>
    ([400, 700] as const).map((weight) => ({
      name: `JBM ${subset}`,
      weight,
      style: 'normal' as const,
      data: readFileSync(join(dir, `jetbrains-mono-${subset}-${weight}-normal.woff`)),
    })),
  );
  return fonts;
}

const logoDataUri = `data:image/svg+xml;base64,${readFileSync(join(process.cwd(), 'brand/logo.svg')).toString('base64')}`;

type Node = { type: string; props: Record<string, unknown> & { style?: Record<string, unknown>; children?: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}): Node => ({
  type,
  props: { ...props, style, children },
});

export interface OgCard {
  /** Small label above the title, e.g. `posts/`. */
  kicker: string;
  title: string;
  summary?: string;
  /** Bottom-left line, e.g. the date and tags. */
  meta?: string;
  /** Bottom-right line, e.g. the author. */
  byline: string;
  domain: string;
}

export async function renderOgPng(card: OgCard): Promise<Buffer> {
  const tree = el(
    'div',
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      background: colors.background,
      color: colors.foam,
      fontFamily: FONT_STACK,
      // X crops 1.91:1 images to 2:1 (about 15px top and bottom), so nothing sits near those edges.
      padding: '64px 72px',
    },
    [
      el('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
        el('img', { width: 56, height: 56 }, undefined, { src: logoDataUri, width: 56, height: 56 }),
        el('div', { fontSize: 30, fontWeight: 700, color: colors.crema }, card.domain),
        el('div', { fontSize: 26, color: colors.latte, marginLeft: 'auto' }, card.kicker),
      ]),
      el(
        'div',
        {
          display: 'block',
          marginTop: 56,
          fontSize: card.title.length > 60 ? 54 : 64,
          fontWeight: 700,
          lineHeight: 1.2,
          lineClamp: 3,
        },
        card.title,
      ),
      card.summary
        ? el('div', { display: 'block', marginTop: 24, fontSize: 28, lineHeight: 1.45, color: colors.latte, lineClamp: 2 }, card.summary)
        : null,
      el(
        'div',
        {
          display: 'flex',
          marginTop: 'auto',
          paddingTop: 24,
          borderTop: `2px solid ${colors.border}`,
          fontSize: 24,
          color: colors.latte,
        },
        [el('div', {}, card.meta ?? ''), el('div', { marginLeft: 'auto', color: colors.foam }, card.byline)],
      ),
    ].filter(Boolean),
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], { width: OG_WIDTH, height: OG_HEIGHT, fonts: loadFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
}
