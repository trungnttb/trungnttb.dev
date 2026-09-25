// Owner-written content: shown as written, never passed through i18n.
// Placeholder values below — replace them with your own.

export interface Profile {
  siteTitle: string;
  greeting: string;
  name: string;
  role: string;
  bio: string[];
  shares: string[];
  links: { label: string; url: string }[];
}

export const profile: Profile = {
  siteTitle: 'portfolio',
  greeting: 'Hi there, thanks for stopping by.',
  name: 'Your Name',
  role: 'Software Engineer',
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
    { label: 'Email', url: 'mailto:you@example.com' },
  ],
};
