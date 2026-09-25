import * as THREE from 'three';

/**
 * Placeholder workspace built from boxes (design D1, phase B). A MagicaVoxel `.glb` replaces it
 * later; the scene only relies on these node names:
 * - `Screen`: a flat mesh whose local +Z faces the viewer; its bounding box gives the screen size.
 * - `Mug`: the coffee cup group (steam is attached here).
 * - `Desk`: receives shadows.
 * - `Lamp` (optional): holds the night lamp's PointLight.
 */

export const SCREEN_COLOR = '#1b1411';

const palette = {
  floor: '#6b4a36',
  rug: '#8c3b2f',
  desk: '#a0673f',
  deskLeg: '#5a3a26',
  laptop: '#c9ccd1',
  keyboard: '#2b2d31',
  mug: '#efe4d2',
  coffee: '#3b2418',
  chair: '#2f2f35',
  skin: '#e2b48f',
  hair: '#2b1d16',
  hoodie: '#3f6e73',
  pants: '#2c3440',
  shoe: '#1e1e22',
  lampBody: '#d9a066',
  bulb: '#fff1c9',
  plantPot: '#b5653f',
  plant: '#5f8f4e',
};

const materials = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string): THREE.MeshStandardMaterial {
  let material = materials.get(color);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true });
    materials.set(color, material);
  }
  return material;
}

function box(w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A box stretched between two points, for arms and legs. */
function limb(from: THREE.Vector3, to: THREE.Vector3, thickness: number, color: string): THREE.Mesh {
  const length = from.distanceTo(to);
  const mesh = box(thickness, length, thickness, color);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  return mesh;
}

const DESK_TOP = 0.78;

function buildDesk(): THREE.Group {
  const desk = new THREE.Group();
  desk.name = 'Desk';
  desk.add(box(1.6, 0.06, 0.8, palette.desk, 0, DESK_TOP - 0.03, 0));
  for (const x of [-0.74, 0.74]) {
    for (const z of [-0.34, 0.34]) desk.add(box(0.06, DESK_TOP - 0.06, 0.06, palette.deskLeg, x, (DESK_TOP - 0.06) / 2, z));
  }
  return desk;
}

function screenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = SCREEN_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Abstract "terminal lines" so the screen reads as a CLI from afar without any text to translate.
  const lineColors = ['#d9a066', '#eadbc8', '#9c8573', '#9fbf7f'];
  let y = 34;
  for (let i = 0; y < canvas.height - 20; i++) {
    ctx.fillStyle = lineColors[i % lineColors.length]!;
    ctx.globalAlpha = 0.55;
    const indent = i % 3 === 0 ? 24 : 48;
    ctx.fillRect(indent, y, 60 + ((i * 97) % 280), 9);
    y += 24;
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildLaptop(): THREE.Group {
  const laptop = new THREE.Group();
  laptop.name = 'Laptop';
  laptop.position.set(0, DESK_TOP, -0.12);
  laptop.add(box(0.36, 0.018, 0.25, palette.laptop, 0, 0.009, 0));
  laptop.add(box(0.31, 0.004, 0.11, palette.keyboard, 0, 0.019, -0.03));

  const lid = new THREE.Group();
  lid.position.set(0, 0.018, -0.125);
  lid.rotation.x = -0.26;
  lid.add(box(0.36, 0.24, 0.01, palette.laptop, 0, 0.12, -0.005));

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.33, 0.21),
    // Unlit and not tone-mapped so its colour matches the DOM terminal it cross-fades into.
    new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false }),
  );
  screen.name = 'Screen';
  screen.position.set(0, 0.125, 0.0006);
  lid.add(screen);

  laptop.add(lid);
  return laptop;
}

function buildMug(): THREE.Group {
  const mug = new THREE.Group();
  mug.name = 'Mug';
  mug.position.set(0.34, DESK_TOP, -0.02);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 10), mat(palette.mug));
  cup.position.y = 0.05;
  cup.castShadow = true;
  mug.add(cup);
  const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.005, 10), mat(palette.coffee));
  coffee.position.y = 0.092;
  mug.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 6, 10), mat(palette.mug));
  handle.position.set(0.05, 0.05, 0);
  mug.add(handle);

  const steamMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false });
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.018), steamMaterial.clone());
    puff.name = 'Steam';
    puff.userData.phase = i / 3;
    mug.add(puff);
  }
  return mug;
}

function buildLamp(): THREE.Group {
  const lamp = new THREE.Group();
  lamp.name = 'Lamp';
  lamp.position.set(-0.58, DESK_TOP, -0.22);
  lamp.add(box(0.14, 0.02, 0.14, palette.lampBody, 0, 0.01, 0));
  lamp.add(limb(new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0.05, 0.32, 0.02), 0.02, palette.lampBody));
  lamp.add(limb(new THREE.Vector3(0.05, 0.32, 0.02), new THREE.Vector3(0.18, 0.36, 0.1), 0.02, palette.lampBody));
  lamp.add(box(0.12, 0.07, 0.12, palette.lampBody, 0.2, 0.33, 0.12));
  const bulb = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.02, 0.05),
    new THREE.MeshStandardMaterial({ color: palette.bulb, emissive: palette.bulb, emissiveIntensity: 0 }),
  );
  bulb.name = 'Bulb';
  bulb.position.set(0.2, 0.29, 0.12);
  lamp.add(bulb);
  const light = new THREE.PointLight('#ffc98a', 0, 2.2, 1.6);
  light.name = 'LampLight';
  light.position.set(0.2, 0.26, 0.12);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  lamp.add(light);
  return lamp;
}

function buildPlant(): THREE.Group {
  const plant = new THREE.Group();
  plant.position.set(0.62, DESK_TOP, -0.26);
  plant.add(box(0.1, 0.1, 0.1, palette.plantPot, 0, 0.05, 0));
  plant.add(box(0.06, 0.12, 0.06, palette.plant, 0, 0.16, 0));
  plant.add(box(0.1, 0.06, 0.04, palette.plant, 0.03, 0.2, 0.02));
  plant.add(box(0.04, 0.08, 0.1, palette.plant, -0.03, 0.24, -0.01));
  return plant;
}

function buildChair(): THREE.Group {
  const chair = new THREE.Group();
  chair.position.set(0, 0, 0.62);
  chair.add(box(0.46, 0.05, 0.44, palette.chair, 0, 0.46, 0));
  chair.add(box(0.46, 0.55, 0.05, palette.chair, 0, 0.76, 0.22));
  chair.add(box(0.05, 0.44, 0.05, palette.chair, 0, 0.22, 0));
  chair.add(box(0.5, 0.03, 0.06, palette.chair, 0, 0.02, 0));
  chair.add(box(0.06, 0.03, 0.5, palette.chair, 0, 0.02, 0));
  return chair;
}

function buildPerson(): THREE.Group {
  const person = new THREE.Group();
  person.name = 'Person';
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  for (const side of [-1, 1]) {
    const x = side * 0.09;
    person.add(limb(v(x, 0.53, 0.66), v(x, 0.53, 0.32), 0.13, palette.pants));
    person.add(limb(v(x, 0.53, 0.32), v(x, 0.06, 0.3), 0.11, palette.pants));
    person.add(box(0.11, 0.06, 0.18, palette.shoe, x, 0.03, 0.26));
  }

  person.add(box(0.38, 0.5, 0.22, palette.hoodie, 0, 0.82, 0.66));
  person.add(box(0.2, 0.06, 0.2, palette.skin, 0, 1.09, 0.66));

  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(0, 1.23, 0.64);
  head.add(box(0.22, 0.24, 0.22, palette.skin));
  head.add(box(0.24, 0.08, 0.24, palette.hair, 0, 0.1, 0.01));
  head.add(box(0.24, 0.2, 0.06, palette.hair, 0, 0.02, 0.1));
  head.add(box(0.03, 0.14, 0.2, palette.hair, -0.12, 0.02, 0.03));
  head.add(box(0.03, 0.14, 0.2, palette.hair, 0.12, 0.02, 0.03));
  person.add(head);

  for (const side of [-1, 1]) {
    const shoulder = v(side * 0.22, 1.0, 0.64);
    const elbow = v(side * 0.24, 0.84, 0.42);
    const wrist = v(side * 0.09, DESK_TOP + 0.04, 0.06);
    person.add(limb(shoulder, elbow, 0.09, palette.hoodie));
    person.add(limb(elbow, wrist, 0.08, palette.hoodie));
    const hand = box(0.07, 0.035, 0.09, palette.skin, wrist.x, wrist.y - 0.005, wrist.z - 0.07);
    hand.name = side < 0 ? 'HandLeft' : 'HandRight';
    hand.userData.baseY = hand.position.y;
    person.add(hand);
  }
  return person;
}

export function buildWorkspace(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Workspace';

  // A small diorama base, so the scene reads as an object floating on the time-of-day colour.
  const base = box(2.6, 0.12, 2.3, palette.floor, 0, -0.06, 0.2);
  root.add(base);
  const rug = box(1.9, 0.01, 1.5, palette.rug, 0, 0.005, 0.25);
  rug.castShadow = false;
  root.add(rug);

  root.add(buildDesk(), buildLaptop(), buildMug(), buildLamp(), buildPlant(), buildChair(), buildPerson());
  return root;
}
