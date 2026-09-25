import type { APIRoute } from 'astro';
import { profile } from '../data/profile';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: profile.domain,
      short_name: profile.siteTitle,
      start_url: '/',
      display: 'standalone',
      background_color: '#1b1411',
      theme_color: '#1b1411',
      icons: [
        { src: '/brand/logo-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/brand/logo-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/brand/logo-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
