import { profile } from '../data/profile';
import { projects } from '../data/projects';
import { t, type MessageKey } from '../i18n';
import { COMMANDS, completeInput, History, parseInput, type CommandName } from './commands';
import { h } from './dom';
import type { CollectionName } from './entries';

export interface CliOptions {
  root: HTMLElement;
  scroller: HTMLElement;
  output: HTMLElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
  commandBar: HTMLElement;
  onOpenCollection: (collection: CollectionName) => void;
}

export interface Cli {
  run(raw: string): void;
  focus(): void;
}

const describeKey = (name: CommandName) => `cmd.${name}` as MessageKey;

export function createCli(options: CliOptions): Cli {
  const { root, scroller, output, form, input, commandBar, onOpenCollection } = options;
  const history = new History();

  function print(...lines: HTMLElement[]): void {
    output.append(...lines);
    scroller.scrollTop = scroller.scrollHeight;
  }

  const line = (className: string, ...children: (Node | string)[]) => h('div', { class: `cli-line ${className}` }, ...children);
  const commandButton = (name: CommandName) =>
    h('button', { type: 'button', class: 'cli-cmd', 'data-command': `/${name}` }, `/${name}`);

  const handlers: Record<CommandName, () => void> = {
    help() {
      print(line('cli-accent', t('help.title')));
      for (const name of COMMANDS) {
        print(line('cli-help-row', commandButton(name), h('span', { class: 'cli-dim' }, t(describeKey(name)))));
      }
      print(line('cli-dim cli-gap', t('help.tips')));
    },
    me() {
      print(
        line('cli-accent', profile.greeting),
        line('cli-name', profile.name),
        line('cli-role', profile.role),
        ...profile.bio.map((text) => line('cli-gap-top', text)),
        line('cli-accent cli-gap-top', t('me.shares')),
        ...profile.shares.map((text) => line('cli-bullet', text)),
        line('cli-accent cli-gap-top', t('me.links')),
        line(
          'cli-links',
          ...profile.links.map((link) => h('a', { href: link.url, target: '_blank', rel: 'noopener noreferrer' }, link.label)),
        ),
      );
    },
    projects() {
      if (projects.length === 0) return print(line('cli-dim', t('projects.empty')));
      print(line('cli-accent', t('projects.title')));
      for (const project of projects) {
        const title = project.url
          ? h('a', { href: project.url, target: '_blank', rel: 'noopener noreferrer' }, project.name)
          : h('span', {}, project.name);
        print(
          line('cli-project cli-gap-top', title, h('span', { class: 'cli-dim' }, ` (${project.year})`)),
          line('cli-indent', project.description),
          line('cli-indent cli-dim', project.stack.join(' · ')),
        );
      }
    },
    posts: () => openCollection('posts'),
    notes: () => openCollection('notes'),
  };

  function openCollection(collection: CollectionName): void {
    print(line('cli-dim', t('finder.opening', { collection: t(`finder.title.${collection}`) })));
    onOpenCollection(collection);
  }

  function run(raw: string): void {
    print(line('cli-echo', h('span', { class: 'cli-prompt' }, t('cli.prompt')), ` ${raw}`));
    history.push(raw);
    const parsed = parseInput(raw);
    if (parsed.kind === 'command') handlers[parsed.name]();
    else if (parsed.kind === 'unknown') {
      print(line('cli-error', t('cli.notFound', { cmd: parsed.word })), line('cli-dim', t('cli.notFoundHint')));
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = input.value;
    input.value = '';
    run(raw);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const previous = history.previous();
      if (previous !== undefined) input.value = previous;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      input.value = history.next();
    } else if (event.key === 'Tab') {
      const completed = completeInput(input.value);
      if (input.value.trim() !== '') event.preventDefault();
      if (completed) input.value = completed;
    }
  });

  // Clicking a command anywhere (the bar or /help output) behaves as if it had been typed.
  root.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-command]');
    if (button) {
      run(button.dataset.command!);
      // Commands like /posts move focus into the finder; only reclaim it if nothing else took it.
      if (document.activeElement === button || document.activeElement === document.body) focus();
      return;
    }
    if ((event.target as HTMLElement).closest('a, button')) return;
    if (window.getSelection()?.isCollapsed ?? true) focus();
  });

  for (const name of COMMANDS) {
    const button = commandButton(name);
    button.title = t(describeKey(name));
    commandBar.append(button);
  }

  print(line('cli-dim', t('cli.welcome')));

  function focus(): void {
    input.focus({ preventScroll: true });
  }

  return { run, focus };
}
