import { describe, expect, it } from 'vitest';
import { coverDistance } from './framing';

describe('coverDistance', () => {
  it('is limited by width on a wide viewport', () => {
    // 90° fov → tan(45°) = 1; a 2×1 screen on a 4:1 viewport must fit width/2 / aspect.
    expect(coverDistance(2, 1, 90, 4)).toBeCloseTo(0.25 * 0.97);
  });
  it('is limited by height on a tall viewport', () => {
    expect(coverDistance(2, 1, 90, 0.5)).toBeCloseTo(0.5 * 0.97);
  });
});
