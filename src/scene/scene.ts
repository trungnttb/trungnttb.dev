import * as THREE from 'three';
import { coverDistance, easeInOutCubic } from './framing';
import { lightingAt, type LightingParams } from './lighting';
import { buildWorkspace } from './model';

export interface SceneHandle {
  /** 0 = overview of the desk, 1 = the laptop screen fills the viewport. */
  setProgress(progress: number): void;
  /** Stops rendering while the terminal covers the canvas. */
  setActive(active: boolean): void;
  dispose(): void;
}

export interface SceneOptions {
  reducedMotion: boolean;
  /** Source of the time of day; defaults to the viewer's clock. */
  clock?: () => Date;
  onBackground?: (color: string) => void;
}

const FOV = 40;
const LOOK_TARGET = new THREE.Vector3(0, 0.62, 0.2);
const START_OFFSET = new THREE.Vector3(3.5, 2.0, 1.6);
const VIA_POINT = new THREE.Vector3(1.0, 1.7, 1.2);
const INTRO_MS = 1600;
const LIGHTING_REFRESH_MS = 60_000;

export function mountScene(container: HTMLElement, options: SceneOptions): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100);

  const workspace = buildWorkspace();
  scene.add(workspace);
  workspace.updateMatrixWorld(true);

  const screen = workspace.getObjectByName('Screen') as THREE.Mesh;
  const mug = workspace.getObjectByName('Mug')!;
  const bulb = workspace.getObjectByName('Bulb') as THREE.Mesh | undefined;
  const lampLight = workspace.getObjectByName('LampLight') as THREE.PointLight | undefined;
  const hands = ['HandLeft', 'HandRight'].map((name) => workspace.getObjectByName(name)).filter(Boolean) as THREE.Object3D[];
  const steam = mug.children.filter((child) => child.name === 'Steam') as THREE.Mesh[];

  // Screen geometry in world space: centre, facing direction and size.
  screen.geometry.computeBoundingBox();
  const screenSize = screen.geometry.boundingBox!.getSize(new THREE.Vector3());
  const screenCenter = screen.getWorldPosition(new THREE.Vector3());
  const screenNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(screen.getWorldQuaternion(new THREE.Quaternion()));

  const ambient = new THREE.AmbientLight();
  const sun = new THREE.DirectionalLight();
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -2.2;
  sun.shadow.camera.right = 2.2;
  sun.shadow.camera.top = 2.2;
  sun.shadow.camera.bottom = -2.2;
  sun.shadow.bias = -0.0005;
  sun.target.position.copy(LOOK_TARGET);
  const screenLight = new THREE.PointLight('#ffb780', 0, 1.6, 1.5);
  screenLight.position.copy(screenCenter).addScaledVector(screenNormal, 0.25);
  scene.add(ambient, sun, sun.target, screenLight);

  function applyLighting(params: LightingParams): void {
    scene.background = new THREE.Color(params.background);
    ambient.color.set(params.ambientColor);
    ambient.intensity = params.ambientIntensity;
    sun.color.set(params.sunColor);
    sun.intensity = params.sunIntensity;
    sun.position.copy(LOOK_TARGET).add(new THREE.Vector3(...params.sunPosition));
    screenLight.intensity = params.screenGlow;
    if (lampLight) lampLight.intensity = params.lampIntensity;
    if (bulb) (bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = params.lampIntensity > 0.05 ? 1.5 : 0;
    options.onBackground?.(params.background);
  }
  const clock = options.clock ?? (() => new Date());
  applyLighting(lightingAt(clock()));
  const lightingTimer = window.setInterval(() => applyLighting(lightingAt(clock())), LIGHTING_REFRESH_MS);

  let endPosition = new THREE.Vector3();
  let startScale = 1;
  function resize(): void {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    endPosition = screenCenter
      .clone()
      .addScaledVector(screenNormal, coverDistance(screenSize.x, screenSize.y, FOV, camera.aspect));
    // Portrait viewports need the overview camera further back to keep the desk in frame.
    startScale = camera.aspect < 1 ? Math.min(2.2, 1 / camera.aspect) : 1;
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const pointer = new THREE.Vector2();
  function onPointerMove(event: PointerEvent): void {
    pointer.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
  }
  window.addEventListener('pointermove', onPointerMove);

  let progress = 0;
  let active = true;
  let frame = 0;
  const startedAt = performance.now();
  const path = new THREE.CatmullRomCurve3([new THREE.Vector3(), VIA_POINT.clone(), new THREE.Vector3()]);
  const lookAt = new THREE.Vector3();

  function updateCamera(now: number): void {
    const intro = options.reducedMotion ? 1 : Math.min(1, (now - startedAt) / INTRO_MS);
    const introEase = 1 - (1 - intro) ** 3;
    const overview = 1 - progress;
    const sway = options.reducedMotion ? 0 : Math.sin(now / 4000) * 0.12 * overview;
    const spin = (1 - introEase) * 1.2;

    const offset = START_OFFSET.clone()
      .multiplyScalar(startScale * (1 + (1 - introEase) * 0.6))
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), sway + spin + pointer.x * 0.08 * overview);
    offset.y += pointer.y * 0.15 * overview;
    const start = LOOK_TARGET.clone().add(offset);

    const t = easeInOutCubic(progress);
    path.points[0]!.copy(start);
    path.points[2]!.copy(endPosition);
    camera.position.copy(path.getPoint(t));
    lookAt.lerpVectors(LOOK_TARGET, screenCenter, easeInOutCubic(Math.min(1, progress * 1.4)));
    camera.lookAt(lookAt);
  }

  function animate(now: number): void {
    frame = requestAnimationFrame(animate);
    const seconds = now / 1000;
    if (!options.reducedMotion) {
      steam.forEach((puff, i) => {
        const phase = (seconds * 0.35 + (puff.userData.phase as number)) % 1;
        puff.position.set(Math.sin(phase * 6 + i) * 0.012, 0.11 + phase * 0.2, Math.cos(phase * 5 + i) * 0.008);
        (puff.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - phase);
      });
      hands.forEach((hand, i) => {
        hand.position.y = (hand.userData.baseY as number) + Math.max(0, Math.sin(seconds * 14 + i * 2.1)) * 0.006;
      });
    }
    updateCamera(now);
    renderer.render(scene, camera);
  }

  function start(): void {
    if (frame === 0) frame = requestAnimationFrame(animate);
  }
  function stop(): void {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  start();

  return {
    setProgress(value) {
      progress = Math.min(1, Math.max(0, value));
    },
    setActive(value) {
      active = value;
      if (active) start();
      else stop();
    },
    dispose() {
      stop();
      window.clearInterval(lightingTimer);
      window.removeEventListener('pointermove', onPointerMove);
      resizeObserver.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
