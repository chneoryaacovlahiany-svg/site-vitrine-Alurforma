// Procedural, articulated device models: the lid, the screen and the phone
// are independent meshes, so each can be animated on its own.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const ALU = () =>
  new THREE.MeshPhysicalMaterial({
    color: 0x2b3140,
    metalness: 0.85,
    roughness: 0.32,
    clearcoat: 0.4,
    clearcoatRoughness: 0.25,
  });

function keyboardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 420;
  const x = c.getContext('2d')!;
  x.fillStyle = '#1a1e28';
  x.fillRect(0, 0, c.width, c.height);
  const rows = [14, 14, 13, 12, 11];
  const kh = 62;
  rows.forEach((n, r) => {
    const kw = (c.width - 40 - (n - 1) * 8) / n;
    for (let i = 0; i < n; i++) {
      const w = r === 4 && i === 5 ? kw * 3.2 : kw;
      const off = r === 4 && i > 5 ? kw * 2.2 + 8 * 2 : 0;
      if (r === 4 && i > n - 3) continue;
      x.fillStyle = '#0c0f16';
      x.beginPath();
      x.roundRect(20 + i * (kw + 8) + off, 20 + r * (kh + 12), w, kh, 8);
      x.fill();
    }
  });
  // Arrow cluster
  x.fillStyle = '#0c0f16';
  x.fillRect(c.width - 190, 20 + 4 * 74 + 30, 50, 32);
  x.fillRect(c.width - 134, 20 + 4 * 74, 50, 30);
  x.fillRect(c.width - 134, 20 + 4 * 74 + 34, 50, 28);
  x.fillRect(c.width - 78, 20 + 4 * 74 + 30, 50, 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface Laptop {
  group: THREE.Group;
  lid: THREE.Group;
  screenMat: THREE.MeshBasicMaterial;
  screen: THREE.Mesh;
  glow: THREE.Mesh;
}

export function createLaptop(screenTex: THREE.Texture): Laptop {
  const W = 3.2;
  const D = 2.2;
  const BH = 0.1;
  const group = new THREE.Group();

  const base = new THREE.Mesh(new RoundedBoxGeometry(W, BH, D, 4, 0.045), ALU());
  base.position.y = BH / 2;
  group.add(base);

  const kb = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.86, D * 0.36),
    new THREE.MeshStandardMaterial({ map: keyboardTexture(), roughness: 0.8, metalness: 0.1 }),
  );
  kb.rotation.x = -Math.PI / 2;
  kb.position.set(0, BH + 0.001, -D * 0.16);
  group.add(kb);

  const pad = new THREE.Mesh(
    new RoundedBoxGeometry(W * 0.36, 0.004, D * 0.3, 2, 0.002),
    new THREE.MeshPhysicalMaterial({ color: 0x323949, metalness: 0.6, roughness: 0.22, clearcoat: 1 }),
  );
  pad.position.set(0, BH, D * 0.27);
  group.add(pad);

  // Lid pivots on the hinge (back edge of the base).
  const lid = new THREE.Group();
  lid.position.set(0, BH, -D / 2 + 0.03);
  group.add(lid);

  const LH = D - 0.06;
  const shell = new THREE.Mesh(new RoundedBoxGeometry(W, LH, 0.06, 4, 0.028), ALU());
  shell.position.set(0, LH / 2, -0.03);
  lid.add(shell);

  const bezel = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.04, LH - 0.04),
    new THREE.MeshPhysicalMaterial({ color: 0x05070c, roughness: 0.08, metalness: 0.2, clearcoat: 1 }),
  );
  bezel.position.set(0, LH / 2, 0.0015);
  lid.add(bezel);

  const sw = W - 0.2;
  const sh = sw / 1.6;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), screenMat);
  screen.position.set(0, LH / 2 + 0.03, 0.003);
  lid.add(screen);

  // Soft light spill in front of the screen once lit.
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(sw * 1.5, sh * 1.5),
    new THREE.MeshBasicMaterial({ map: radialTexture('rgba(90,130,255,1)'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  glow.position.set(0, LH / 2, -0.08);
  lid.add(glow);

  // Hinge cylinder
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, W * 0.9, 24), ALU());
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, BH, -D / 2 + 0.03);
  group.add(hinge);

  return { group, lid, screenMat, screen, glow };
}

export interface Phone {
  group: THREE.Group;
  screenMat: THREE.MeshBasicMaterial;
}

export function createPhone(screenTex: THREE.Texture): Phone {
  const group = new THREE.Group();
  const W = 0.8;
  const H = W * (1688 / 780) + 0.06;
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(W, H, 0.085, 6, 0.1),
    new THREE.MeshPhysicalMaterial({ color: 0x1b2440, metalness: 0.9, roughness: 0.28, clearcoat: 0.6 }),
  );
  group.add(body);
  const glass = new THREE.Mesh(
    new RoundedBoxGeometry(W - 0.02, H - 0.02, 0.004, 4, 0.002),
    new THREE.MeshPhysicalMaterial({ color: 0x020305, roughness: 0.05, clearcoat: 1 }),
  );
  glass.position.z = 0.043;
  group.add(glass);
  const sw = W - 0.06;
  const sh = sw * (1688 / 780);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, alphaMap: roundedMask(), transparent: true });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), screenMat);
  screen.position.z = 0.0462;
  group.add(screen);
  // Camera module on the back
  const bump = new THREE.Mesh(
    new RoundedBoxGeometry(0.3, 0.3, 0.03, 4, 0.06),
    new THREE.MeshPhysicalMaterial({ color: 0x232c4a, metalness: 0.8, roughness: 0.3 }),
  );
  bump.position.set(-W / 2 + 0.22, H / 2 - 0.22, -0.055);
  group.add(bump);
  for (let i = 0; i < 3; i++) {
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.02, 24),
      new THREE.MeshPhysicalMaterial({ color: 0x05060a, metalness: 0.5, roughness: 0.05, clearcoat: 1 }),
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(-W / 2 + 0.16 + (i % 2) * 0.12, H / 2 - 0.16 - Math.floor(i / 2) * 0.12, -0.075);
    group.add(lens);
  }
  return { group, screenMat };
}

export interface Paper {
  group: THREE.Group;
  mat: THREE.MeshBasicMaterial;
}

export function createPaper(tex: THREE.Texture): Paper {
  const group = new THREE.Group();
  const W = 1.1;
  const H = W * 1.414;
  const geo = new THREE.PlaneGeometry(W, H, 16, 1);
  // Gentle curl so the sheet reads as paper, not a card.
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, -Math.pow(x / (W / 2), 2) * 0.035);
  }
  geo.computeVertexNormals();
  // Unlit so the document stays crisp and legible whatever the lighting.
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide, transparent: true });
  group.add(new THREE.Mesh(geo, mat));
  return { group, mat };
}

export function radialTexture(color: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Contact shadow: a blurred dark ellipse lying on the "floor". */
export function createShadow(w: number, d: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,1)'), transparent: true, opacity: 0.55, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

function roundedMask(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 390;
  c.height = 844;
  const x = c.getContext('2d')!;
  x.fillStyle = '#000';
  x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#fff';
  x.beginPath();
  x.roundRect(0, 0, c.width, c.height, 52);
  x.fill();
  return new THREE.CanvasTexture(c);
}
