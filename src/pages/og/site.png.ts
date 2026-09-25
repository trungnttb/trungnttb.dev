import type { APIRoute } from 'astro';
import { profile } from '../../data/profile';
import { renderOgPng } from '../../og/card';

export const GET: APIRoute = async () => {
  const png = await renderOgPng({
    kicker: '~$',
    title: profile.name,
    summary: `${profile.role}. ${profile.bio[0] ?? ''}`,
    meta: '/help  /me  /work  /posts  /notes',
    byline: profile.domain,
    domain: profile.domain,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
