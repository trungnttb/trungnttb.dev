import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { profile } from '../../../data/profile';
import { locale } from '../../../i18n';
import { renderOgPng } from '../../../og/card';

const visible = ({ data }: { data: { draft: boolean } }) => import.meta.env.DEV || !data.draft;

export const getStaticPaths = (async () => {
  const posts = (await getCollection('posts', visible)).map((entry) => ({
    params: { collection: 'posts', id: entry.id },
    props: { title: entry.data.title, summary: entry.data.summary, date: entry.data.date, tags: entry.data.tags },
  }));
  const notes = (await getCollection('notes', visible)).map((entry) => ({
    params: { collection: 'notes', id: entry.id },
    props: { title: entry.data.title, summary: entry.data.description, date: entry.data.date, tags: [entry.data.lang, ...entry.data.tags] },
  }));
  return [...posts, ...notes];
}) satisfies GetStaticPaths;

type Props = { title: string; summary: string; date: Date; tags: string[] };

const dateFormat = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

export const GET: APIRoute<Props> = async ({ params, props }) => {
  const png = await renderOgPng({
    kicker: `${params.collection}/`,
    title: props.title,
    summary: props.summary,
    meta: [dateFormat.format(props.date), props.tags.map((tag) => `#${tag}`).join(' ')].filter(Boolean).join('  ·  '),
    byline: profile.name,
    domain: profile.domain,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
