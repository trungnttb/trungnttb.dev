import { profile } from '../data/profile';

const SITE = `https://${profile.domain}/`;

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': `${SITE}#person`,
    name: profile.name,
    url: SITE,
    jobTitle: profile.role,
    sameAs: profile.links.filter((link) => link.url.startsWith('https://')).map((link) => link.url),
  };
}

export function homeSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      personSchema(),
      { '@type': 'WebSite', '@id': `${SITE}#website`, url: SITE, name: profile.domain, author: { '@id': `${SITE}#person` } },
    ],
  };
}

export interface EntrySchemaInput {
  kind: 'posts' | 'notes';
  url: string;
  title: string;
  description: string;
  published: Date;
  tags: string[];
  image: string;
}

export function entrySchema(entry: EntrySchemaInput) {
  return {
    '@context': 'https://schema.org',
    // Notes are code snippets kept for reference; schema.org's TechArticle fits them better than a blog post.
    '@type': entry.kind === 'posts' ? 'BlogPosting' : 'TechArticle',
    headline: entry.title,
    description: entry.description,
    datePublished: entry.published.toISOString(),
    url: entry.url,
    mainEntityOfPage: entry.url,
    image: entry.image,
    keywords: entry.tags.join(', '),
    author: personSchema(),
    publisher: { '@id': `${SITE}#person` },
  };
}
