import type { APIRoute } from 'astro';
import { profile } from '../../data/profile';
import { work } from '../../data/work';
import { renderOgPng } from '../../og/card';

export const GET: APIRoute = async () => {
  const png = await renderOgPng({
    kicker: '~$',
    title: profile.name,
    // Frontend + backend items keep the line short enough for the card's two-line clamp.
    summary: `${profile.role} · ${work.stack.slice(0, 2).flatMap((group) => group.items).join(', ')} · AI-first`,
    meta: '/help  /me  /work  /posts  /notes',
    byline: profile.domain,
    domain: profile.domain,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
