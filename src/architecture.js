import * as THREE from 'three';
import { getTerrainHeight, getCentralBridgeY, getRightBridgeY, WATER_LEVEL } from './terrain.js?v=20261126b';

function createRoofTileTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2d373d';
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    ctx.fillStyle = x % 32 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.22)';
    ctx.fillRect(x, 0, 5, 256);
  }
  for (let y = 0; y < 256; y += 24) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, y, 256, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWoodTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 4) {
    ctx.fillStyle = y % 16 === 0 ? 'rgba(25,14,6,0.35)' : 'rgba(255,235,210,0.05)';
    ctx.fillRect(0, y, 128, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const roofTileTex = createRoofTileTexture();
const woodTex = createWoodTexture();

const mats = {
  timber: new THREE.MeshStandardMaterial({ map: woodTex, bumpMap: woodTex, bumpScale: 0.04, roughness: 0.82 }),
  darkTimber: new THREE.MeshStandardMaterial({ color: '#382416', roughness: 0.88 }),
  vermilion: new THREE.MeshStandardMaterial({ color: '#a33324', roughness: 0.65 }),
  wall: new THREE.MeshStandardMaterial({ color: '#ebe2cc', roughness: 0.9 }),
  windowGlow: new THREE.MeshStandardMaterial({
    color: '#f5d48e',
    emissive: '#d99b38',
    emissiveIntensity: 0.55,
    roughness: 0.55,
  }),
  roofDark: new THREE.MeshStandardMaterial({ map: roofTileTex, bumpMap: roofTileTex, bumpScale: 0.08, roughness: 0.68 }),
  thatch: new THREE.MeshStandardMaterial({ color: '#ad9458', roughness: 0.92 }),
  stone: new THREE.MeshStandardMaterial({ color: '#827e73', roughness: 0.9 }),
  gold: new THREE.MeshStandardMaterial({ color: '#c9a145', roughness: 0.45, metalness: 0.4 }),
  pineTrunk: new THREE.MeshStandardMaterial({ color: '#453122', roughness: 0.92 }),
  pineNeedle: new THREE.MeshStandardMaterial({ color: '#245840', roughness: 0.82 }),
  jadeFoliage: new THREE.MeshStandardMaterial({ color: '#387651', roughness: 0.82 }),
  autumnFoliage: new THREE.MeshStandardMaterial({ color: '#ba6330', roughness: 0.82 }),
  bamboo: new THREE.MeshStandardMaterial({ color: '#4c7c48', roughness: 0.78 }),
  reed: new THREE.MeshStandardMaterial({ color: '#8e9658', roughness: 0.9 }),
  sail: new THREE.MeshStandardMaterial({ color: '#f2e8d0', roughness: 0.88, side: THREE.DoubleSide }),
};

function createCurvedRoof(width, depth, height, thatch = false) {
  const group = new THREE.Group();
  const mat = thatch ? mats.thatch : mats.roofDark;

  const geo = new THREE.ConeGeometry(1, height, 4, 5);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const sag = Math.pow(r, 1.55) * 0.22;
    const cornerFlare = (Math.abs(x) > 0.55 && Math.abs(z) > 0.55) ? 0.14 : 0;
    pos.setY(i, y - sag + cornerFlare);
  }
  geo.computeVertexNormals();

  const roofMesh = new THREE.Mesh(geo, mat);
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.scale.set(width * 0.84, 1, depth * 0.84);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  group.add(roofMesh);

  if (!thatch) {
    const ridgeLen = width * 0.48;
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen, 0.1, 0.12), mats.roofDark);
    ridge.position.y = height * 0.48;
    group.add(ridge);

    for (const sx of [-ridgeLen / 2, ridgeLen / 2]) {
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), mats.gold);
      finial.position.set(sx, height * 0.56, 0);
      group.add(finial);
    }
  }
  return group;
}

function createSongHouse({ width = 3.2, depth = 2.4, height = 1.8, thatch = false, vermilion = false } = {}) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(width + 0.55, 0.42, depth + 0.55), mats.stone);
  base.position.y = 0.21;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.24), mats.stone);
    step.position.set(0, 0.06 + s * 0.12, depth / 2 + 0.42 - s * 0.16);
    group.add(step);
  }

  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mats.wall);
  wall.position.y = 0.42 + height / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const winCount = width > 3.4 ? 3 : 2;
  for (let i = 0; i < winCount; i++) {
    const wx = ((i + 0.5) / winCount - 0.5) * (width * 0.7);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.06), mats.windowGlow);
    win.position.set(wx, 0.42 + height * 0.52, depth / 2 + 0.01);
    group.add(win);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.08), mats.darkTimber);
    frame.position.set(wx, 0.42 + height * 0.52, depth / 2 + 0.02);
    group.add(frame);
  }

  const pillarMat = vermilion ? mats.vermilion : mats.timber;
  const px = width / 2 + 0.06;
  const pz = depth / 2 + 0.06;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, height, 6), pillarMat);
      p.position.set(sx * px, 0.42 + height / 2, sz * pz);
      p.castShadow = true;
      group.add(p);
    }
  }

  const roof = createCurvedRoof(width + 0.7, depth + 0.7, height * 0.82, thatch);
  roof.position.y = 0.42 + height + height * 0.34;
  group.add(roof);
  return group;
}

function createTwoStoryPavilion() {
  const group = new THREE.Group();
  for (const sx of [-1.25, 1.25]) {
    for (const sz of [-1.05, 1.05]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 2.2, 8), mats.vermilion);
      p.position.set(sx, 1.1, sz);
      p.castShadow = true;
      group.add(p);
    }
  }

  for (const sx of [-1.35, 1.35]) {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), mats.windowGlow);
    lantern.scale.set(1, 1.25, 1);
    lantern.position.set(sx, 1.85, 1.15);
    group.add(lantern);
  }

  const roof1 = createCurvedRoof(3.5, 3.1, 0.95, false);
  roof1.position.y = 2.58;
  group.add(roof1);

  const upperWall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.35, 1.5), mats.wall);
  upperWall.position.y = 3.25;
  upperWall.castShadow = true;
  group.add(upperWall);

  const upperWin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.6, 1.54), mats.windowGlow);
  upperWin.position.y = 3.25;
  group.add(upperWin);

  const roof2 = createCurvedRoof(2.8, 2.5, 1.05, false);
  roof2.position.y = 4.3;
  group.add(roof2);
  return group;
}

function createPagoda(tiers = 5) {
  const group = new THREE.Group();
  let curY = 0;
  for (let i = 0; i < tiers; i++) {
    const scale = 1 - i * 0.13;
    const r = 1.25 * scale;
    const h = 1.15 * scale;

    const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.82, h, 8), mats.wall);
    body.position.y = curY + h / 2;
    body.castShadow = true;
    group.add(body);

    const balc = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 0.98, 0.12, 8), mats.vermilion);
    balc.position.y = curY + 0.06;
    group.add(balc);

    const eave = new THREE.Mesh(new THREE.ConeGeometry(r * 1.42, h * 0.56, 8), mats.roofDark);
    eave.position.y = curY + h + h * 0.22;
    eave.castShadow = true;
    group.add(eave);

    curY += h * 1.12;
  }
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.95, 8), mats.gold);
  spire.position.y = curY + 0.48;
  group.add(spire);
  return group;
}

function createMastedBoat() {
  const group = new THREE.Group();
  const hullGeo = new THREE.BoxGeometry(1.35, 0.38, 4.8, 2, 1, 6);
  const hp = hullGeo.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    const z = hp.getZ(i);
    const taper = 1.0 - Math.pow(Math.abs(z) / 2.5, 2.2) * 0.68;
    hp.setX(i, hp.getX(i) * taper);
    if (hp.getY(i) > 0 && Math.abs(z) > 1.5) hp.setY(i, hp.getY(i) + 0.18);
  }
  hullGeo.computeVertexNormals();
  const hull = new THREE.Mesh(hullGeo, mats.timber);
  hull.position.y = 0.16;
  hull.castShadow = true;
  group.add(hull);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 1.85), mats.wall);
  cabin.position.set(0, 0.62, -0.4);
  cabin.castShadow = true;
  group.add(cabin);

  const cabinWin = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.26, 0.9), mats.windowGlow);
  cabinWin.position.set(0, 0.66, -0.4);
  group.add(cabinWin);

  const cabinRoof = createCurvedRoof(1.35, 2.25, 0.4, false);
  cabinRoof.position.set(0, 1.1, -0.4);
  group.add(cabinRoof);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.075, 4.1, 6), mats.darkTimber);
  mast.position.set(0, 2.15, 0.95);
  mast.castShadow = true;
  group.add(mast);

  const sailGeo = new THREE.PlaneGeometry(1.7, 2.6, 4, 6);
  const sp = sailGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const sy = sp.getY(i);
    sp.setZ(i, Math.cos((sy / 1.3) * 1.1) * 0.18);
  }
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, mats.sail);
  sail.position.set(0, 2.45, 1.02);
  sail.rotation.y = 0.28;
  sail.castShadow = true;
  group.add(sail);

  for (let b = -1.0; b <= 1.0; b += 0.5) {
    const batten = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.72, 4), mats.darkTimber);
    batten.rotation.z = Math.PI / 2;
    batten.rotation.y = 0.28;
    batten.position.set(0, 2.45 + b, 1.14);
    group.add(batten);
  }
  return group;
}

function createChinesePine(scale = 1, lean = 0.2) {
  const group = new THREE.Group();
  const trunkH = 2.7 * scale;

  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.18 * scale, trunkH * 0.55, 6), mats.pineTrunk);
  lower.position.y = trunkH * 0.27;
  lower.rotation.z = lean * 0.6;
  lower.castShadow = true;
  group.add(lower);

  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * scale, 0.11 * scale, trunkH * 0.55, 6), mats.pineTrunk);
  upper.position.set(lean * 0.45 * scale, trunkH * 0.72, 0);
  upper.rotation.z = lean * 1.1;
  upper.castShadow = true;
  group.add(upper);

  const pads = [
    { x: lean * 1.2 * scale, y: trunkH * 0.96, z: 0, rx: 1.25 * scale, ry: 0.24 * scale },
    { x: (lean * 1.5 + 0.55) * scale, y: trunkH * 0.84, z: 0.35 * scale, rx: 0.95 * scale, ry: 0.22 * scale },
    { x: (lean * 0.9 - 0.55) * scale, y: trunkH * 0.74, z: -0.3 * scale, rx: 0.88 * scale, ry: 0.2 * scale },
    { x: (lean * 1.1 + 0.35) * scale, y: trunkH * 0.64, z: -0.4 * scale, rx: 0.75 * scale, ry: 0.18 * scale },
    { x: (lean * 0.6 - 0.35) * scale, y: trunkH * 0.56, z: 0.38 * scale, rx: 0.7 * scale, ry: 0.18 * scale },
  ];
  for (const p of pads) {
    const pad = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 6), mats.pineNeedle);
    pad.scale.set(p.rx, p.ry, p.rx * 0.85);
    pad.position.set(p.x, p.y, p.z);
    pad.castShadow = true;
    group.add(pad);
  }
  return group;
}

function createBambooGrove(count = 7) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const rad = 0.25 + (i % 3) * 0.28;
    const h = 2.4 + (i % 3) * 0.65;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 5), mats.bamboo);
    stalk.position.set(Math.cos(angle) * rad, h / 2, Math.sin(angle) * rad);
    stalk.rotation.z = Math.sin(i * 2.1) * 0.08;
    stalk.castShadow = true;
    group.add(stalk);

    const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), mats.jadeFoliage);
    leaves.scale.set(1.2, 0.5, 1.2);
    leaves.position.set(Math.cos(angle) * rad, h * 0.88, Math.sin(angle) * rad);
    group.add(leaves);
  }
  return group;
}

function createWeepingWillow(scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.15 * scale, 2.1 * scale, 6), mats.pineTrunk);
  trunk.position.y = 1.05 * scale;
  trunk.rotation.z = 0.15;
  trunk.castShadow = true;
  group.add(trunk);

  const willowMat = new THREE.MeshStandardMaterial({ color: '#5c8c52', roughness: 0.85 });
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.15 * scale, 8, 6), willowMat);
  crown.scale.set(1.25, 0.75, 1.25);
  crown.position.set(0.2 * scale, 2.35 * scale, 0);
  crown.castShadow = true;
  group.add(crown);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const strand = new THREE.Mesh(new THREE.ConeGeometry(0.18 * scale, 1.6 * scale, 5), willowMat);
    strand.rotation.x = Math.PI;
    strand.position.set(0.2 * scale + Math.cos(a) * 0.85 * scale, 1.55 * scale, Math.sin(a) * 0.85 * scale);
    group.add(strand);
  }
  return group;
}

function createTempleGate() {
  const group = new THREE.Group();
  for (const sx of [-1.1, 1.1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.4, 8), mats.vermilion);
    p.position.set(sx, 1.2, 0);
    p.castShadow = true;
    group.add(p);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.28, 0.26), mats.vermilion);
  lintel.position.y = 2.15;
  group.add(lintel);

  // Clean two-slope pitched gate roof + ridge beam & gold finials
  for (const sz of [-1, 1]) {
    const slope = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.88), mats.roofDark);
    slope.position.set(0, 2.52, sz * 0.36);
    slope.rotation.x = sz * 0.42;
    slope.castShadow = true;
    group.add(slope);
  }
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.12, 0.14), mats.roofDark);
  ridge.position.y = 2.72;
  group.add(ridge);
  for (const sx of [-1.58, 1.58]) {
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), mats.gold);
    finial.position.set(sx, 2.86, 0);
    group.add(finial);
  }
  return group;
}

function createMooredSkiff() {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.16, 2.4), mats.timber);
  hull.position.y = 0.06;
  hull.castShadow = true;
  group.add(hull);
  const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.1, 5), mats.darkTimber);
  stake.position.set(0.45, 0.35, 1.1);
  group.add(stake);
  return group;
}

function createLeafTree(scale = 1, autumn = false) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.13 * scale, 1.8 * scale, 6), mats.timber);
  trunk.position.y = 0.9 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  const crownMat = autumn ? mats.autumnFoliage : mats.jadeFoliage;
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry((0.78 - i * 0.1) * scale, 1), crownMat);
    crown.position.set((i - 1) * 0.35 * scale, (1.95 + (i % 2) * 0.3) * scale, (i % 2 === 0 ? 0.2 : -0.2) * scale);
    crown.scale.set(1.1, 0.82, 1.0);
    crown.castShadow = true;
    group.add(crown);
  }
  return group;
}

function placeOnTerrain(obj, x, z, yOffset = 0, rotY = 0) {
  obj.position.set(x, getTerrainHeight(x, z) + yOffset, z);
  obj.rotation.y = rotY;
  return obj;
}

function createSealBorderStrip({ width, height, seals = [] }) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e5dcc2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#9c8559';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  for (const seal of seals) {
    ctx.fillStyle = '#b2382b';
    ctx.fillRect(seal.x, seal.y, seal.size, seal.size);
    ctx.strokeStyle = '#f8eedc';
    ctx.lineWidth = 2;
    ctx.strokeRect(seal.x + 4, seal.y + 4, seal.size - 8, seal.size - 8);
    ctx.fillStyle = '#f8eedc';
    ctx.font = `bold ${Math.round(seal.size * 0.34)}px "Noto Serif TC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(seal.text || '御賞', seal.x + seal.size / 2, seal.y + seal.size / 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.35, height),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })
  );
  mesh.receiveShadow = true;
  return mesh;
}

function buildBridge(startX, endX, z, heightFn, withPavilion = false) {
  const group = new THREE.Group();
  const segments = Math.round((endX - startX) * 1.1);

  for (let i = 0; i < segments; i++) {
    const x0 = THREE.MathUtils.lerp(startX, endX, i / segments);
    const x1 = THREE.MathUtils.lerp(startX, endX, (i + 1) / segments);
    const xm = (x0 + x1) * 0.5;
    const y0 = heightFn(x0);
    const y1 = heightFn(x1);
    const ym = (y0 + y1) * 0.5;
    const segLen = Math.hypot(x1 - x0, y1 - y0) + 0.04;
    const angle = Math.atan2(y1 - y0, x1 - x0);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.24, 2.3), mats.timber);
    deck.position.set(xm, ym - 0.12, z);
    deck.rotation.z = angle;
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    const truss = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.16, 1.9), mats.darkTimber);
    truss.position.set(xm, ym - 0.38, z);
    truss.rotation.z = angle;
    group.add(truss);

    for (const sz of [-1.05, 1.05]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.1, 0.1), mats.vermilion);
      rail.position.set(xm, ym + 0.58, z + sz);
      rail.rotation.z = angle;
      group.add(rail);

      if (i % 2 === 0) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.72, 6), mats.vermilion);
        post.position.set(x0, y0 + 0.34, z + sz);
        group.add(post);

        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mats.gold);
        cap.position.set(x0, y0 + 0.72, z + sz);
        group.add(cap);
      }
    }
  }

  for (let i = 1; i < 5; i++) {
    const px = THREE.MathUtils.lerp(startX, endX, i / 5);
    const py = heightFn(px);
    const pierH = py + 3.2;
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.0, pierH, 2.5), mats.stone);
    pier.position.set(px, py - pierH / 2 - 0.15, z);
    pier.castShadow = true;
    group.add(pier);
  }

  if (withPavilion) {
    const midX = (startX + endX) * 0.5;
    const pav = createTwoStoryPavilion();
    pav.position.set(midX, heightFn(midX), z);
    group.add(pav);
  }

  return group;
}

export function createArchitectureAndFlora(scene) {
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // 1. 卷首四印裱邊 (Far Right Border x=+365, matching the 4 red imperial seals on the right edge)
  const rightSealStrip = createSealBorderStrip({
    width: 9,
    height: 56,
    seals: [
      { x: 26, y: 36, size: 74, text: '乾隆' },
      { x: 26, y: 124, size: 74, text: '御覽' },
      { x: 38, y: 388, size: 48, text: '珍賞' },
      { x: 38, y: 446, size: 48, text: '石渠' },
    ],
  });
  const rightMountBase = new THREE.Mesh(new THREE.BoxGeometry(11, 1.2, 58), mats.stone);
  rightMountBase.position.set(365, -0.3, -2);
  rightMountBase.receiveShadow = true;
  worldGroup.add(rightMountBase);
  rightSealStrip.position.set(365, 0.3, -2);
  worldGroup.add(rightSealStrip);

  // 2. 卷首丘陵水村 (Part 17: x=+316, z=+12)
  worldGroup.add(placeOnTerrain(createSongHouse({ width: 3.0, depth: 2.2, height: 1.6, thatch: true }), 314, 11.5, -0.05, 0.25));
  worldGroup.add(placeOnTerrain(createSongHouse({ width: 2.6, depth: 2.0, height: 1.5 }), 318, 12.8, -0.05, -0.35));
  worldGroup.add(placeOnTerrain(createBambooGrove(7), 311.5, 12.5, -0.05, 0));
  worldGroup.add(placeOnTerrain(createWeepingWillow(1.1), 320.5, 14.5, -0.05, 0.4));
  const openSkiff = createMooredSkiff();
  openSkiff.position.set(315, WATER_LEVEL + 0.04, 18.2);
  openSkiff.rotation.y = 0.5;
  worldGroup.add(openSkiff);

  // 3. 右二主山群村落與平木橋 (Part 13-14: x=+225, x ∈ [188, 212])
  worldGroup.add(placeOnTerrain(createSongHouse({ width: 3.1, depth: 2.2, height: 1.6, thatch: true }), 224, 9.5, -0.05, 0.2));
  worldGroup.add(placeOnTerrain(createSongHouse({ width: 2.5, depth: 1.9, height: 1.5 }), 228, 10.8, -0.05, -0.3));
  worldGroup.add(buildBridge(188, 212, 11, getRightBridgeY, false));
  worldGroup.add(placeOnTerrain(createWeepingWillow(1.0), 213.5, 12.2, -0.05, -0.3));

  // 4. 右一大主山群村舍與泊船 (Part 10-12: x=+145, z=+8)
  worldGroup.add(placeOnTerrain(createSongHouse({ width: 3.2, depth: 2.3, height: 1.7, thatch: true }), 144, 7.8, -0.05, 0.15));
  worldGroup.add(placeOnTerrain(createBambooGrove(6), 147.5, 8.6, -0.05, 0));
  worldGroup.add(placeOnTerrain(createWeepingWillow(1.05), 141.0, 10.2, -0.05, 0.2));

  const mooredBoat = createMastedBoat();
  mooredBoat.position.set(110, WATER_LEVEL + 0.05, 14);
  mooredBoat.rotation.y = 0.9;
  worldGroup.add(mooredBoat);

  // 5. 正中特大主峰前景拱橋亭閣 (Part 06-07: x ∈ [-18, +14], z = 12)
  worldGroup.add(buildBridge(-18, 14, 12, getCentralBridgeY, true));
  const bridgeLight = new THREE.PointLight('#ffcf78', 3.5, 18, 1.5);
  bridgeLight.position.set(-2, 6.2, 12);
  worldGroup.add(bridgeLight);
  worldGroup.add(placeOnTerrain(createSongHouse({ width: 3.4, depth: 2.4, height: 1.8 }), 4, 6.2, -0.05, 0.1));
  worldGroup.add(placeOnTerrain(createWeepingWillow(1.15), -20.5, 13.8, -0.05, 0.6));
  worldGroup.add(placeOnTerrain(createWeepingWillow(1.05), 16.2, 14.0, -0.05, -0.5));

  // 6. 中左層巒山寺 (Part 05: x=-76, z=+4)
  worldGroup.add(placeOnTerrain(createSongHouse({ width: 4.5, depth: 3.1, height: 2.2, vermilion: true }), -76, 3.8, -0.08, 0.1));
  const templeLight = new THREE.PointLight('#ffcf78', 3.0, 16, 1.5);
  templeLight.position.set(-76, 7.2, 5.2);
  worldGroup.add(templeLight);
  worldGroup.add(placeOnTerrain(createTempleGate(), -76, 7.2, -0.05, 0.1));
  worldGroup.add(placeOnTerrain(createPagoda(5), -71, 4.5, -0.08, 0));

  // 7. 左端沙嘴與卷尾漁村 (Part 01-03: x=-240, x=-315)
  worldGroup.add(placeOnTerrain(createSongHouse({ width: 2.8, depth: 2.0, height: 1.5, thatch: true }), -315, 7.5, -0.05, 0.25));
  worldGroup.add(placeOnTerrain(createWeepingWillow(1.0), -242, 14.2, -0.05, 0.3));
  const endSkiff = createMooredSkiff();
  endSkiff.position.set(-310, WATER_LEVEL + 0.04, 14.0);
  endSkiff.rotation.y = -0.4;
  worldGroup.add(endSkiff);
  for (let i = 0; i < 36; i++) {
    const rx = -245 + Math.sin(i * 6.7) * 16;
    const rz = 12 + Math.cos(i * 4.3) * 6;
    const ry = getTerrainHeight(rx, rz);
    if (ry > -0.7 && ry < 0.7) {
      const reed = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.3, 4), mats.reed);
      reed.position.set(rx, Math.max(WATER_LEVEL, ry) + 0.52, rz);
      worldGroup.add(reed);
    }
  }

  // 8. 卷尾雙印裱邊 (Far Left Border x=-365)
  const leftSealStrip = createSealBorderStrip({
    width: 8,
    height: 56,
    seals: [
      { x: 38, y: 120, size: 46, text: '方琮' },
      { x: 38, y: 390, size: 46, text: '敬臨' },
    ],
  });
  const leftMountBase = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 58), mats.stone);
  leftMountBase.position.set(-365, -0.3, -2);
  leftMountBase.receiveShadow = true;
  worldGroup.add(leftMountBase);
  leftSealStrip.position.set(-365, 0.3, -2);
  worldGroup.add(leftSealStrip);

  // 9. Scattered Gnarled Pines & Leaf Trees across the full 760-unit scroll
  let seed = 2026;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 380; i++) {
    const tx = (rand() - 0.5) * 740;
    const tz = (rand() - 0.5) * 88;
    const ty = getTerrainHeight(tx, tz);
    if (ty < 1.3 || ty > 22) continue;

    if (Math.hypot(tx - 316, tz - 12) < 6) continue;
    if (Math.hypot(tx - 225, tz - 10) < 6) continue;
    if (Math.abs(tx - 200) < 15 && Math.abs(tz - 11) < 4) continue;
    if (Math.hypot(tx - 145, tz - 8) < 6) continue;
    if (Math.abs(tx + 2) < 18 && Math.abs(tz - 12) < 4) continue;
    if (Math.hypot(tx + 76, tz - 4) < 7) continue;

    const isPine = ty > 6.5 || rand() > 0.45;
    const sc = 0.72 + rand() * 0.65;
    const tree = isPine
      ? createChinesePine(sc, (rand() - 0.5) * 0.32)
      : createLeafTree(sc, rand() > 0.74);
    worldGroup.add(placeOnTerrain(tree, tx, tz, -0.1, rand() * Math.PI * 2));
  }

  return {};
}
