import type { APIRoute } from 'astro';
import { profile } from '../../data/profile';
import { work } from '../../data/work';
import { t } from '../../i18n';
import { renderOgPng } from '../../og/card';

export const GET: APIRoute = async () => {
  const png = await renderOgPng({
    kicker: '~$',
    title: profile.name,
    // The first two items of each named area keep the line inside the card's two-line clamp.
    summary: `${profile.role} · ${['Frontend', 'Backend']
      .flatMap((area) => work.stack.find((group) => group.area === area)?.items.slice(0, 2) ?? [])
      .join(', ')} · AI-first`,
    meta: '/help  /me  /work  /posts  /notes',
    cta: t('og.cta.site'),
    domain: profile.domain,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
