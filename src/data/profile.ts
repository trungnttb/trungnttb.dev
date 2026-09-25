// Owner-written content: shown as written, never passed through i18n.

export interface Profile {
  siteTitle: string;
  /** Engraved on the desk in the 3D scene. */
  domain: string;
  greeting: string;
  name: string;
  birthYear: number;
  email: string;
  role: string;
  bio: string[];
  shares: string[];
  links: { label: string; url: string }[];
}

export const profile: Profile = {
  siteTitle: 'trungnttb.dev',
  domain: 'trungnttb.dev',
  greeting: 'Hey, you found the terminal. The coffee on the desk is real; the bugs are mostly fixed.',
  name: 'Nguyễn Thành Trung',
  birthYear: 1993,
  email: 'trungnttb.dev@gmail.com',
  role: 'Full-stack Web Developer',
  bio: [
    'I write the query, the API, and the button that calls it, then the test that proves all three still agree.',
    'Right now: Tech Lead at FPT Software on a project for a large Japanese recruitment company, with side quests for clients in Korea, Singapore, India and the US.',
    'I work AI-first: Claude drafts a good share of the code, I write the requirements, read every diff, and keep the pager.',
  ],
  shares: [
    'The best SDLC is the one your team actually follows. I have built a few; the short ones survived.',
    'AI made the first draft cheap. Reading it carefully is still the job.',
    'RAG and LLM apps are my research sandbox, not a production claim. Yet.',
    'Freelance work lives under NDA, so the good stuff stays off GitHub. Sorry, curious reader.',
  ],
  links: [
    { label: 'GitHub', url: 'https://github.com/trungnttb' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/trungnttb/' },
    { label: 'Email', url: 'mailto:trungnttb.dev@gmail.com' },
  ],
};
