import { profile } from '../data/profile';
import type { SceneHandle } from '../scene/scene';
import { createCli } from './cli';
import { createClockWidget } from './clock-widget';
import { installCopyButtons } from './copy';
import { byId, finePointer, prefersReducedMotion } from './dom';
import type { CollectionName, EntrySummary } from './entries';
import { createFinder, type HistoryState } from './finder';

type Mode = 'scene' | 'cli';

const ENTER_MS = 1300;
const LEAVE_MS = 1000;
const FADE_MS = 280;
const SNAP_IDLE_MS = 450;
const SNAP_THRESHOLD = 0.3;
const WHEEL_GAIN = 0.0012;
const TOUCH_GAIN = 0.0035;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function boot(): void {
  const app = byId('app');
  const entries = JSON.parse(byId('entries-data').textContent ?? '[]') as EntrySummary[];
  const reducedMotion = prefersReducedMotion();
  const sceneContainer = byId('scene');
  const loading = byId('scene-loading');
  const hint = byId('scene-hint');
  const toggleButton = byId<HTMLButtonElement>('toggle');

  installCopyButtons();

  const clockWidget = createClockWidget(
    {
      clock: byId<HTMLButtonElement>('clock'),
      hourHand: document.getElementById('clock-hour') as unknown as SVGElement,
      minuteHand: document.getElementById('clock-minute') as unknown as SVGElement,
      label: byId('clock-label'),
      auto: byId<HTMLButtonElement>('clock-auto'),
    },
    (clock) => scene?.setClock(clock),
  );

  let mode: Mode = 'scene';
  let scene: SceneHandle | null = null;
  let sceneFailed = false;
  let progress = 0;
  let target = 0;
  let tween: { from: number; to: number; start: number; duration: number; done: () => void } | null = null;
  let snapTimer = 0;
  let frame = 0;

  const finder = createFinder({
    elements: {
      root: byId('finder'),
      title: byId('finder-title'),
      search: byId<HTMLInputElement>('finder-search'),
      back: byId<HTMLButtonElement>('finder-back'),
      close: byId<HTMLButtonElement>('finder-close'),
      maximize: byId<HTMLButtonElement>('finder-maximize'),
      listView: byId('finder-list-view'),
      rows: byId('finder-rows'),
      count: byId('finder-count'),
      detailView: byId('finder-detail-view'),
      detail: byId('finder-detail'),
    },
    entries,
    siteTitle: profile.siteTitle,
    onClosed: () => cli.focus(),
  });

  const cli = createCli({
    root: byId('cli'),
    scroller: byId('cli-scroll'),
    output: byId('cli-output'),
    form: byId<HTMLFormElement>('cli-form'),
    input: byId<HTMLInputElement>('cli-input'),
    commandBar: byId('cli-commands'),
    onOpenCollection: (collection: CollectionName) => finder.openList(collection),
  });

  function render(): void {
    scene?.setProgress(progress);
    hint.style.opacity = String(Math.max(0, 1 - progress * 3));
  }

  function loop(now: number): void {
    frame = 0;
    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.duration);
      progress = tween.from + (tween.to - tween.from) * easeInOut(t);
      target = progress;
      if (t >= 1) {
        const done = tween.done;
        tween = null;
        done();
      }
    } else {
      progress += (target - progress) * 0.12;
      if (Math.abs(target - progress) < 0.001) progress = target;
      if (progress >= 1 && mode === 'scene') enterCli();
    }
    render();
    if (tween || progress !== target) frame = requestAnimationFrame(loop);
  }

  function kick(): void {
    if (frame === 0) frame = requestAnimationFrame(loop);
  }

  function animateTo(to: number, duration: number, done: () => void): void {
    if (reducedMotion) {
      progress = target = to;
      render();
      done();
      return;
    }
    tween = { from: progress, to, start: performance.now(), duration: Math.max(1, duration * Math.abs(to - progress)), done };
    kick();
  }

  function enterCli(): void {
    if (mode === 'cli') return;
    mode = 'cli';
    progress = target = 1;
    tween = null;
    app.dataset.mode = 'cli';
    window.setTimeout(() => {
      if (mode === 'cli') scene?.setActive(false);
    }, FADE_MS);
    if (finePointer() && !finder.isOpen()) cli.focus();
  }

  async function ensureScene(): Promise<boolean> {
    if (scene) return true;
    if (sceneFailed) return false;
    loading.hidden = false;
    try {
      const { mountScene } = await import('../scene/scene');
      scene = mountScene(sceneContainer, {
        reducedMotion,
        engraving: profile.domain,
        clock: clockWidget.now,
        onBackground: (color) => document.documentElement.style.setProperty('--scene-bg', color),
      });
      render();
      return true;
    } catch (error) {
      console.error('[scene] could not start, staying in the terminal', error);
      sceneFailed = true;
      toggleButton.hidden = true;
      return false;
    } finally {
      loading.hidden = true;
    }
  }

  async function leaveCli(): Promise<void> {
    if (mode !== 'cli') return;
    if (!(await ensureScene())) return;
    finder.close();
    document.querySelectorAll('dialog[open]').forEach((dialog) => (dialog as HTMLDialogElement).close());
    (document.activeElement as HTMLElement | null)?.blur();
    mode = 'scene';
    progress = target = 1;
    scene!.setActive(true);
    render();
    app.dataset.mode = 'scene';
    animateTo(0, LEAVE_MS, () => undefined);
  }

  function toggle(): void {
    if (mode === 'cli') void leaveCli();
    else if (!tween) animateTo(1, ENTER_MS, enterCli);
  }

  function nudge(delta: number): void {
    if (mode !== 'scene' || tween) return;
    target = Math.min(1, Math.max(0, target + delta));
    kick();
    window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(() => {
      if (mode !== 'scene' || tween) return;
      if (target > SNAP_THRESHOLD) animateTo(1, ENTER_MS, enterCli);
      else {
        target = 0;
        kick();
      }
    }, SNAP_IDLE_MS);
  }

  window.addEventListener(
    'wheel',
    (event) => {
      if (mode !== 'scene') return;
      event.preventDefault();
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      nudge(event.deltaY * scale * WHEEL_GAIN);
    },
    { passive: false },
  );

  let touchY: number | null = null;
  window.addEventListener('touchstart', (event) => {
    if (mode === 'scene') touchY = event.touches[0]?.clientY ?? null;
  });
  window.addEventListener(
    'touchmove',
    (event) => {
      if (mode !== 'scene' || touchY === null) return;
      event.preventDefault();
      const y = event.touches[0]!.clientY;
      nudge((touchY - y) * TOUCH_GAIN);
      touchY = y;
    },
    { passive: false },
  );
  window.addEventListener('touchend', () => {
    touchY = null;
  });

  // The backquote key (below Esc, no Shift) always switches views, even while typing (design D8).
  window.addEventListener('keydown', (event) => {
    if (event.isComposing) return;
    if (event.key === '`' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      toggle();
      return;
    }
    if (mode === 'scene' && ['ArrowDown', 'PageDown', ' ', 'Enter'].includes(event.key) && event.target === document.body) {
      event.preventDefault();
      toggle();
    }
  });
  toggleButton.addEventListener('click', toggle);
  byId('hint-key').addEventListener('click', toggle);

  window.addEventListener('popstate', (event) => {
    const state = event.state as HistoryState | null;
    if (state && state.view !== 'cli' && mode === 'scene') enterCli();
    finder.restore(state);
  });

  const entryCollection = app.dataset.entryCollection as CollectionName | undefined;
  const entryId = app.dataset.entryId;

  if (entryCollection && entryId) {
    // Direct link to an entry: terminal with the entry open, and no Three.js until asked for.
    enterCli();
    finder.adoptEntry(entryCollection, entryId);
  } else {
    history.replaceState({ view: 'cli' } satisfies HistoryState, '', location.pathname);
    if (reducedMotion) enterCli();
    else void ensureScene().then((ok) => ok || enterCli());
  }
  app.dataset.ready = 'true';
}
