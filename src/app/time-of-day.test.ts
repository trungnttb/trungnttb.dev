import { describe, expect, it } from 'vitest';
import { nextSetting, parseSetting, timeFor } from './time-of-day';

const at = (h: number, m = 0) => new Date(2026, 8, 25, h, m);

describe('parseSetting', () => {
  it('accepts auto and the four presets', () => {
    expect(parseSetting('auto')).toBe('auto');
    expect(parseSetting('night')).toBe('night');
  });
  it('falls back to auto for missing or unknown values', () => {
    expect(parseSetting(null)).toBe('auto');
    expect(parseSetting('noon')).toBe('auto');
  });
});

describe('nextSetting', () => {
  it('from auto, moves past the preset lit right now', () => {
    expect(nextSetting('auto', at(10))).toBe('afternoon');
    expect(nextSetting('auto', at(22))).toBe('dawn');
  });
  it('cycles through the presets in order', () => {
    expect(nextSetting('dawn', at(10))).toBe('morning');
    expect(nextSetting('night', at(10))).toBe('dawn');
  });
});

describe('timeFor', () => {
  it('returns the real time in auto', () => {
    expect(timeFor('auto', at(13, 7))).toEqual(at(13, 7));
  });
  it('pins a preset to its clock time on the same day', () => {
    expect(timeFor('morning', at(22, 40))).toEqual(at(9, 30));
  });
});
