import { describe, expect, it } from 'vitest';
import { completeInput, History, parseInput } from './commands';

describe('parseInput', () => {
  it('accepts commands with and without a slash', () => {
    expect(parseInput('/help')).toEqual({ kind: 'command', name: 'help' });
    expect(parseInput('  ME  ')).toEqual({ kind: 'command', name: 'me' });
  });
  it('reports unknown words verbatim', () => {
    expect(parseInput('/foo bar')).toEqual({ kind: 'unknown', word: '/foo' });
  });
  it('treats blank input as empty', () => {
    expect(parseInput('   ')).toEqual({ kind: 'empty' });
  });
});

describe('completeInput', () => {
  it('completes a unique prefix', () => {
    expect(completeInput('/pr')).toBe('/projects');
    expect(completeInput('n')).toBe('/notes');
  });
  it('returns null when ambiguous or unmatched', () => {
    expect(completeInput('/p')).toBeNull();
    expect(completeInput('/x')).toBeNull();
  });
});

describe('History', () => {
  it('walks back and forward like a shell', () => {
    const history = new History();
    history.push('/help');
    history.push('/me');
    expect(history.previous()).toBe('/me');
    expect(history.previous()).toBe('/help');
    expect(history.previous()).toBe('/help');
    expect(history.next()).toBe('/me');
    expect(history.next()).toBe('');
  });
  it('skips blanks and consecutive duplicates', () => {
    const history = new History();
    history.push('/me');
    history.push('/me');
    history.push('  ');
    expect(history.previous()).toBe('/me');
    expect(history.previous()).toBe('/me');
  });
});
