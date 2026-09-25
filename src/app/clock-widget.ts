import { t } from '../i18n';
import { loadSetting, nextSetting, saveSetting, timeFor, type TimeSetting } from './time-of-day';

export interface ClockWidgetElements {
  clock: HTMLButtonElement;
  hourHand: SVGElement;
  minuteHand: SVGElement;
  label: HTMLElement;
  auto: HTMLButtonElement;
}

export interface ClockWidget {
  /** Time the scene should be lit for, under the current setting. */
  now(): Date;
}

const TICK_MS = 30_000;

export function createClockWidget(el: ClockWidgetElements, onChange: (clock: () => Date) => void): ClockWidget {
  let setting: TimeSetting = loadSetting();
  const now = () => timeFor(setting, new Date());

  function render(): void {
    const time = now();
    const minutes = time.getMinutes();
    const hours = (time.getHours() % 12) + minutes / 60;
    el.hourHand.setAttribute('transform', `rotate(${hours * 30} 16 16)`);
    el.minuteHand.setAttribute('transform', `rotate(${minutes * 6} 16 16)`);
    const clockText = `${String(time.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const name = setting === 'auto' ? t('clock.auto') : t(`clock.preset.${setting}`);
    el.label.textContent = `${name} · ${clockText}`;
    el.auto.setAttribute('aria-pressed', setting === 'auto' ? 'true' : 'false');
  }

  function set(next: TimeSetting): void {
    setting = next;
    saveSetting(next);
    render();
    onChange(now);
  }

  el.clock.addEventListener('click', () => set(nextSetting(setting, new Date())));
  el.auto.addEventListener('click', () => set('auto'));
  window.setInterval(render, TICK_MS);
  render();

  return { now };
}
