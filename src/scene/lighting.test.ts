import { describe, expect, it } from 'vitest';
import { blendAt, lerpHex, lightingAt, presetAt, PRESETS } from './lighting';

const at = (h: number, m = 0) => h * 60 + m;

describe('presetAt', () => {
  it('maps the four ranges', () => {
    expect(presetAt(at(4, 59))).toBe('night');
    expect(presetAt(at(5))).toBe('dawn');
    expect(presetAt(at(9))).toBe('morning');
    expect(presetAt(at(15))).toBe('afternoon');
    expect(presetAt(at(18))).toBe('night');
    expect(presetAt(at(23, 59))).toBe('night');
  });
});

describe('blendAt', () => {
  it('is a pure preset outside the 30-minute windows', () => {
    expect(blendAt(at(17, 44))).toEqual({ from: 'afternoon', to: 'afternoon', t: 0 });
    expect(blendAt(at(18, 15))).toEqual({ from: 'night', to: 'night', t: 0 });
  });
  it('starts at 17:45 and is halfway at 18:00', () => {
    expect(blendAt(at(17, 45))).toEqual({ from: 'afternoon', to: 'night', t: 0 });
    expect(blendAt(at(18))).toMatchObject({ from: 'afternoon', to: 'night', t: 0.5 });
  });
  it('rises monotonically through the window', () => {
    const ts = [46, 50, 55, 60, 65, 70, 74].map((m) => blendAt(at(17) + m).t);
    expect([...ts].sort((a, b) => a - b)).toEqual(ts);
  });
});

describe('lerpHex', () => {
  it('interpolates each channel', () => {
    expect(lerpHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(lerpHex('#ff0000', '#0000ff', 0)).toBe('#ff0000');
  });
});

describe('lightingAt', () => {
  it('returns the night preset at midnight', () => {
    expect(lightingAt(new Date(2026, 0, 1, 0, 0))).toEqual(PRESETS.night);
  });
  it('returns the morning preset mid-morning', () => {
    expect(lightingAt(new Date(2026, 0, 1, 9, 30))).toEqual(PRESETS.morning);
  });
});
