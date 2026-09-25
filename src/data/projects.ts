// Owner-written content: shown as written, never passed through i18n.
// Placeholder values below — replace them with your own.

export interface Project {
  name: string;
  year: number;
  description: string;
  stack: string[];
  url?: string;
}

export const projects: Project[] = [
  {
    name: 'portfolio',
    year: 2026,
    description: 'This site: a voxel desk scene that zooms into a terminal.',
    stack: ['Astro', 'Three.js', 'Tailwind CSS', 'Shiki'],
  },
  {
    name: 'sample-project',
    year: 2025,
    description: 'Replace this entry with something you built.',
    stack: ['TypeScript'],
    url: 'https://example.com',
  },
];
