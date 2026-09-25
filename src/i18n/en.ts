export const en = {
  'meta.description': 'Portfolio: a developer at a desk, and a terminal on the laptop screen.',

  'scene.hint.scroll': 'Scroll down',
  'scene.hint.swipe': 'Swipe up',
  'scene.hint.key': 'or press ~',
  'scene.loading': 'Loading scene…',
  'toggle.label': 'Switch between the desk and the terminal (~)',

  'cli.prompt': 'guest@portfolio:~$',
  'cli.inputLabel': 'Command input',
  'cli.commandsLabel': 'Commands',
  'cli.welcome': 'Welcome. Type a command, or click one in the bar above.',
  'cli.notFound': 'command not found: {cmd}',
  'cli.notFoundHint': 'Type /help to see available commands.',

  'cmd.help': 'List every command',
  'cmd.me': 'Who I am, what I do',
  'cmd.projects': 'Projects I have built',
  'cmd.posts': 'Long-form articles (opens a finder)',
  'cmd.notes': 'Standalone scripts and snippets (opens a finder)',

  'help.title': 'Available commands:',
  'help.tips': 'Tips: ~ switches between the desk and this terminal · ↑/↓ recall history · Tab completes.',

  'me.shares': 'Things I share:',
  'me.links': 'Find me at:',

  'projects.title': 'Projects:',
  'projects.empty': 'No projects yet.',

  'finder.opening': 'Opening {collection}…',
  'finder.title.posts': 'Posts',
  'finder.title.notes': 'Notes',
  'finder.search': 'Search {collection}',
  'finder.col.name': 'Name',
  'finder.col.date': 'Date',
  'finder.col.tags': 'Tags',
  'finder.count': '{n} items',
  'finder.empty': 'Nothing matches “{query}”.',
  'finder.close': 'Close',
  'finder.back': 'Back to list',
  'finder.loading': 'Loading…',
  'finder.loadError': 'Could not load this entry.',
  'finder.openPage': 'Open it as a page',

  'code.copy': 'Copy',
  'code.copied': 'Copied',
  'code.copyFailed': 'Copy failed',
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
