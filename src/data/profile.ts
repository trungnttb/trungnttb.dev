// Owner-written content: shown as written, never passed through i18n.
// Bio, shares and links below are still placeholders — replace them with your own.

export interface Profile {
  siteTitle: string;
  /** Engraved on the desk in the 3D scene. */
  domain: string;
  birthYear: number;
  email: string;
  greeting: string;
  name: string;
  role: string;
  bio: string[];
  shares: string[];
  links: { label: string; url: string }[];
}

export const profile: Profile = {
  siteTitle: 'trungnttb.dev',
  domain: 'trungnttb.dev',
  greeting: 'Hi there, thanks for stopping by.',
  name: 'Nguyễn Thành Trung',
  birthYear: 1993,
  email: 'trungnttb.dev@gmail.com',
  role: 'Full-stack Web Developer',
  bio: [
    'I build web applications end to end, from the database schema to the pixels.',
    'Most days that means TypeScript, a strong coffee, and a terminal like this one.',
  ],
  shares: [
    'Small tools beat big frameworks more often than you would think.',
    'Write the test that would have caught yesterday’s bug.',
  ],
  links: [
    { label: 'GitHub', url: 'https://github.com/' },
    { label: 'Email', url: 'mailto:trungnttb.dev@gmail.com' },
  ],
};
