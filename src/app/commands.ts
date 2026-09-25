export const COMMANDS = ['help', 'me', 'projects', 'posts', 'notes'] as const;
export type CommandName = (typeof COMMANDS)[number];

export type ParsedInput =
  | { kind: 'empty' }
  | { kind: 'command'; name: CommandName }
  | { kind: 'unknown'; word: string };

/** Accepts `/help` and `help`; anything after the first word is ignored. */
export function parseInput(raw: string): ParsedInput {
  const word = raw.trim().split(/\s+/)[0] ?? '';
  if (word === '') return { kind: 'empty' };
  const name = word.replace(/^\//, '').toLowerCase();
  return (COMMANDS as readonly string[]).includes(name)
    ? { kind: 'command', name: name as CommandName }
    : { kind: 'unknown', word };
}

/** Completes a unique command prefix; returns null when there is no single match. */
export function completeInput(raw: string): string | null {
  const prefix = raw.trim().replace(/^\//, '').toLowerCase();
  const matches = COMMANDS.filter((name) => name.startsWith(prefix));
  return matches.length === 1 ? `/${matches[0]}` : null;
}

/** Shell-style history: ↑ walks back, ↓ walks forward, past the newest returns to a blank line. */
export class History {
  private items: string[] = [];
  private cursor = 0;

  push(line: string): void {
    if (line.trim() !== '' && this.items.at(-1) !== line) this.items.push(line);
    this.cursor = this.items.length;
  }

  previous(): string | undefined {
    if (this.items.length === 0) return undefined;
    this.cursor = Math.max(0, this.cursor - 1);
    return this.items[this.cursor];
  }

  next(): string {
    this.cursor = Math.min(this.items.length, this.cursor + 1);
    return this.items[this.cursor] ?? '';
  }
}
