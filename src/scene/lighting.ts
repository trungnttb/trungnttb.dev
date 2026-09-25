export type PresetName = 'dawn' | 'morning' | 'afternoon' | 'night';

export interface LightingParams {
  background: string;
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  /** Direction the sun shines from, relative to the desk centre. */
  sunPosition: [number, number, number];
  lampIntensity: number;
  screenGlow: number;
}

export const PRESETS: Record<PresetName, LightingParams> = {
  dawn: {
    background: '#e9b79a',
    ambientColor: '#ffd6bf',
    ambientIntensity: 0.9,
    sunColor: '#ffb27a',
    sunIntensity: 1.6,
    sunPosition: [5, 2, 3],
    lampIntensity: 0.4,
    screenGlow: 0.5,
  },
  morning: {
    background: '#cfe3ef',
    ambientColor: '#f4f1ea',
    ambientIntensity: 1.3,
    sunColor: '#fff3de',
    sunIntensity: 2.6,
    sunPosition: [3, 6, 4],
    lampIntensity: 0,
    screenGlow: 0.3,
  },
  afternoon: {
    background: '#f0d5a8',
    ambientColor: '#fbe7c6',
    ambientIntensity: 1.1,
    sunColor: '#ffd08a',
    sunIntensity: 2.2,
    sunPosition: [-4, 4, 3],
    lampIntensity: 0,
    screenGlow: 0.35,
  },
  night: {
    background: '#15101a',
    ambientColor: '#6a6fa3',
    ambientIntensity: 0.7,
    sunColor: '#8fa2ff',
    sunIntensity: 0.6,
    sunPosition: [-3, 5, -2],
    lampIntensity: 2.2,
    screenGlow: 1.6,
  },
};

const HOUR = 60;
/** Half of the 30-minute blend window around each boundary. */
export const BLEND_HALF_MINUTES = 15;

/** Local-clock boundaries (minutes since midnight) between presets, in order. */
export const BOUNDARIES: { at: number; from: PresetName; to: PresetName }[] = [
  { at: 5 * HOUR, from: 'night', to: 'dawn' },
  { at: 7 * HOUR, from: 'dawn', to: 'morning' },
  { at: 12 * HOUR, from: 'morning', to: 'afternoon' },
  { at: 18 * HOUR, from: 'afternoon', to: 'night' },
];

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function presetAt(minutes: number): PresetName {
  let current: PresetName = 'night';
  for (const boundary of BOUNDARIES) if (minutes >= boundary.at) current = boundary.to;
  return current;
}

/** Which presets are active at a time, and how far the blend from `from` to `to` has gone (0..1). */
export function blendAt(minutes: number): { from: PresetName; to: PresetName; t: number } {
  for (const boundary of BOUNDARIES) {
    const start = boundary.at - BLEND_HALF_MINUTES;
    const end = boundary.at + BLEND_HALF_MINUTES;
    if (minutes >= start && minutes < end) {
      return { from: boundary.from, to: boundary.to, t: smoothstep((minutes - start) / (end - start)) };
    }
  }
  const preset = presetAt(minutes);
  return { from: preset, to: preset, t: 0 };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpHex(a: string, b: string, t: number): string {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const channel = (shift: number) => Math.round(lerp((pa >> shift) & 255, (pb >> shift) & 255, t));
  const value = (channel(16) << 16) | (channel(8) << 8) | channel(0);
  return `#${value.toString(16).padStart(6, '0')}`;
}

export function lerpParams(a: LightingParams, b: LightingParams, t: number): LightingParams {
  return {
    background: lerpHex(a.background, b.background, t),
    ambientColor: lerpHex(a.ambientColor, b.ambientColor, t),
    ambientIntensity: lerp(a.ambientIntensity, b.ambientIntensity, t),
    sunColor: lerpHex(a.sunColor, b.sunColor, t),
    sunIntensity: lerp(a.sunIntensity, b.sunIntensity, t),
    sunPosition: [0, 1, 2].map((i) => lerp(a.sunPosition[i]!, b.sunPosition[i]!, t)) as [number, number, number],
    lampIntensity: lerp(a.lampIntensity, b.lampIntensity, t),
    screenGlow: lerp(a.screenGlow, b.screenGlow, t),
  };
}

export function lightingAt(date: Date): LightingParams {
  const minutes = date.getHours() * HOUR + date.getMinutes() + date.getSeconds() / 60;
  const { from, to, t } = blendAt(minutes);
  return lerpParams(PRESETS[from], PRESETS[to], t);
}
