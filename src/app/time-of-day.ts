import { presetAt, type PresetName } from '../scene/lighting';

/** `auto` follows the viewer's clock; a preset pins the scene to that part of the day. */
export type TimeSetting = 'auto' | PresetName;

export const PRESET_ORDER: PresetName[] = ['dawn', 'morning', 'afternoon', 'night'];

/** Time shown on the clock (and used for lighting) when a preset is pinned. */
export const PRESET_TIME: Record<PresetName, [hours: number, minutes: number]> = {
  dawn: [6, 0],
  morning: [9, 30],
  afternoon: [15, 0],
  night: [21, 0],
};

export const STORAGE_KEY = 'portfolio.timeOfDay';

export function parseSetting(raw: string | null): TimeSetting {
  return raw === 'auto' || (PRESET_ORDER as string[]).includes(raw ?? '') ? (raw as TimeSetting) : 'auto';
}

/** Clicking the clock moves to the preset after the one currently lit. */
export function nextSetting(current: TimeSetting, now: Date): PresetName {
  const lit = current === 'auto' ? presetAt(now.getHours() * 60 + now.getMinutes()) : current;
  return PRESET_ORDER[(PRESET_ORDER.indexOf(lit) + 1) % PRESET_ORDER.length]!;
}

export function timeFor(setting: TimeSetting, now: Date): Date {
  if (setting === 'auto') return now;
  const date = new Date(now);
  const [hours, minutes] = PRESET_TIME[setting];
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function loadSetting(): TimeSetting {
  try {
    return parseSetting(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'auto';
  }
}

export function saveSetting(setting: TimeSetting): void {
  try {
    if (setting === 'auto') window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, setting);
  } catch {
    // Storage can be blocked (private mode, site data disabled); the choice then lasts for this page only.
  }
}
