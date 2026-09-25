// Owner-written content: shown as written, never passed through i18n.

export interface Work {
  /** One or two sentences shown above the stack. */
  intro: string;
  stack: { area: string; items: string[] }[];
  /** Printed after the stack. */
  stackNote: string;
  timeline: { period: string; text: string }[];
}

export const work: Work = {
  intro:
    'Full-stack web developer since 2014: React and Next.js in front, NestJS or Spring behind it, ' +
    'a database underneath, Docker and Jenkins to ship it, AWS to run it.',
  stack: [
    { area: 'How I work', items: ['AI First (Claude)', 'SDLC — built it, then followed it'] },
    { area: 'Frontend', items: ['React', 'Next.js', 'Vue', 'Angular', 'TypeScript', 'other JS-based frameworks'] },
    { area: 'Backend', items: ['NestJS', 'Java Spring Boot', 'Node.js'] },
    { area: 'Data', items: ['PostgreSQL', 'MySQL', 'Oracle', 'MongoDB', 'Redis'] },
    { area: 'Ship & run', items: ['Docker', 'Jenkins CI/CD', 'AWS'] },
  ],
  stackNote: 'and more — since Claude joined the team, “I have heard of it” turns into “it is in review” a lot faster.',
  timeline: [
    { period: '2013', text: 'Completed the Higher Diploma in Software Engineering of FPT Aptech' },
    { period: '2014', text: 'Worked as a Java Developer at VietSoftware' },
    { period: '2015', text: 'Worked as a Java Developer at FPT Software' },
    { period: '2017', text: 'Worked as a Web Developer at OneEmpower' },
    { period: '2019 to present', text: 'Working at FPT Software' },
    { period: '~', text: 'Working as a freelancer' },
  ],
};
