// Owner-written content: shown as written, never passed through i18n.

export interface Work {
  /** One or two sentences shown above the stack. */
  intro: string;
  stack: string[];
  /** Printed after the stack list. */
  stackNote: string;
  timeline: { period: string; text: string }[];
}

export const work: Work = {
  intro:
    'Full-stack web developer since 2014: I take a feature from requirements and database design, ' +
    'through the backend, to the interface people use, and keep it running after release.',
  stack: ['AI First', 'SDLC', 'JavaScript', 'Java', 'Databases'],
  stackNote: 'and more',
  timeline: [
    { period: '2013', text: 'Completed the Higher Diplomacy in Software Engineering of FPT Aptech' },
    { period: '2014', text: 'Worked as a Java Developer at VietSoftware' },
    { period: '2015', text: 'Worked as a Java Developer at FPT Software' },
    { period: '2017', text: 'Worked as a Web Developer at OneEmpower' },
    { period: '2019 to present', text: 'Working at FPT Software' },
    { period: '~', text: 'Working as a freelancer' },
  ],
};
