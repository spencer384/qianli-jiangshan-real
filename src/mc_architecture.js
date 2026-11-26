import * as THREE from 'three';
import { getTerrainHeight, getCentralBridgeY, getRightBridgeY, WATER_LEVEL } from './mc_terrain.js?v=20261126b';

function createVoxelMaterials(textures) {
  return {
    planks: new THREE.MeshStandardMaterial({ map: textures.planks, roughness: 0.85 }),
    log: new THREE.MeshStandardMaterial({ map: textures.log, roughness: 0.9 }),
    vermilion: new THREE.MeshStandardMaterial({ map: textures.vermilion, roughness: 0.72 }),
    wall: new THREE.MeshStandardMaterial({ map: textures.wall, roughness: 0.9 }),
    glowstone: new THREE.MeshStandardMaterial({
      map: textures.glowstone,
      emissive: '#f5b841',
      emissiveIntensity: 0.7,
      roughness: 0.4,
    }),
    darkTile: new THREE.MeshStandardMaterial({ map: textures.darkTile, roughness: 0.75 }),
    thatch: new THREE.MeshStandardMaterial({ map: textures.thatch, roughness: 0.92 }),
    stone: new THREE.MeshStandardMaterial({ map: textures.stoneBrick, roughness: 0.9 }),
    gold: new THREE.MeshStandardMaterial({ map: textures.gold, roughness: 0.35, metalness: 0.55 }),
    pineLeaves: new THREE.MeshStandardMaterial({ map: textures.pineLeaves, roughness: 0.85 }),
    jadeLeaves: new THREE.MeshStandardMaterial({ map: textures.jadeLeaves, roughness: 0.85 }),
    autumnLeaves: new THREE.MeshStandardMaterial({ map: textures.autumnLeaves, roughness: 0.85 }),
    bamboo: new THREE.MeshStandardMaterial({ map: textures.bamboo, roughness: 0.8 }),
    reed: new THREE.MeshStandardMaterial({ color: '#99a84c', roughness: 0.9 }),
    sail: new THREE.MeshStandardMaterial({ map: textures.wall, roughness: 0.9 }),
  };
}

function addBox(group, w, h, d, mat, x, y, z, castShadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = castShadow;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

// Stepped Minecraft-style pitched voxel roof (fine 0.25-unit steps)
function createVoxelRoof(mats, width, depth, tiers = 5, thatch = false) {
  const group = new THREE.Group();
  const mat = thatch ? mats.thatch : mats.darkTile;
  const stepH = 0.24;

  for (let i = 0; i < tiers; i++) {
    const shrink = i * 0.42;
    const w = Math.max(0.6, width - shrink);
    const d = Math.max(0.6, depth - shrink);
    addBox(group, w, stepH, d, mat, 0, i * stepH + stepH / 2, 0);
  }

  if (!thatch) {
    const ridgeW = Math.max(0.5, width - (tiers - 1) * 0.42);
    addBox(group, ridgeW, 0.18, 0.24, mats.darkTile, 0, tiers * stepH + 0.09, 0);
    for (const sx of [-ridgeW / 2 + 0.12, ridgeW / 2 - 0.12]) {
      addBox(group, 0.16, 0.22, 0.16, mats.gold, sx, tiers * stepH + 0.26, 0);
    }
  }
  return group;
}

function createVoxelHouse(mats, { width = 3.2, depth = 2.4, height = 1.8, thatch = false, vermilion = false } = {}) {
  const group = new THREE.Group();
  addBox(group, width + 0.6, 0.5, depth + 0.6, mats.stone, 0, 0.25, 0);
  addBox(group, 1.0, 0.25, 0.4, mats.stone, 0, 0.12, depth / 2 + 0.45);
  addBox(group, width, height, depth, mats.wall, 0, 0.5 + height / 2, 0);

  const winCount = width > 3.4 ? 3 : 2;
  for (let i = 0; i < winCount; i++) {
    const wx = ((i + 0.5) / winCount - 0.5) * (width * 0.68);
    addBox(group, 0.48, 0.56, 0.12, mats.glowstone, wx, 0.5 + height * 0.52, depth / 2 + 0.02, false);
  }

  const pillarMat = vermilion ? mats.vermilion : mats.log;
  const px = width / 2 + 0.08;
  const pz = depth / 2 + 0.08;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(group, 0.22, height, 0.22, pillarMat, sx * px, 0.5 + height / 2, sz * pz);
    }
  }

  const roof = createVoxelRoof(mats, width + 0.9, depth + 0.9, 3, thatch);
  roof.position.y = 0.5 + height;
  group.add(roof);
  return group;
}

function createVoxelPavilion(mats) {
  const group = new THREE.Group();
  for (const sx of [-1.2, 1.2]) {
    for (const sz of [-1.0, 1.0]) {
      addBox(group, 0.24, 2.2, 0.24, mats.vermilion, sx, 1.1, sz);
    }
  }
  for (const sx of [-1.3, 1.3]) {
    addBox(group, 0.28, 0.35, 0.28, mats.glowstone, sx, 1.85, 1.15, false);
  }

  const roof1 = createVoxelRoof(mats, 3.6, 3.2, 2, false);
  roof1.position.y = 2.2;
  group.add(roof1);

  addBox(group, 1.9, 1.3, 1.6, mats.wall, 0, 3.65, 0);
  addBox(group, 1.0, 0.6, 1.66, mats.glowstone, 0, 3.65, 0, false);

  const roof2 = createVoxelRoof(mats, 2.8, 2.5, 3, false);
  roof2.position.y = 4.3;
  group.add(roof2);
  return group;
}

function createVoxelPagoda(mats, tiers = 5) {
  const group = new THREE.Group();
  let curY = 0;
  for (let i = 0; i < tiers; i++) {
    const scale = 1 - i * 0.13;
    const w = 2.2 * scale;
    const h = 1.15 * scale;
    addBox(group, w * 0.78, h, w * 0.78, mats.wall, 0, curY + h / 2, 0);
    addBox(group, w * 0.98, 0.18, w * 0.98, mats.vermilion, 0, curY + 0.09, 0);
    addBox(group, w * 1.25, 0.28, w * 1.25, mats.darkTile, 0, curY + h + 0.14, 0);
    curY += h + 0.28;
  }
  addBox(group, 0.28, 1.0, 0.28, mats.gold, 0, curY + 0.5, 0);
  return group;
}

function createVoxelMastedBoat(mats) {
  const group = new THREE.Group();
  addBox(group, 1.5, 0.45, 4.6, mats.planks, 0, 0.22, 0);
  addBox(group, 1.1, 0.35, 1.0, mats.planks, 0, 0.45, 2.1);
  addBox(group, 1.0, 0.75, 1.8, mats.wall, 0, 0.82, -0.4);
  addBox(group, 1.04, 0.3, 0.9, mats.glowstone, 0, 0.82, -0.4, false);
  addBox(group, 1.35, 0.28, 2.1, mats.darkTile, 0, 1.34, -0.4);
  addBox(group, 0.18, 4.1, 0.18, mats.log, 0, 2.3, 1.0);
  addBox(group, 1.8, 2.5, 0.14, mats.sail, 0, 2.6, 1.14);
  for (let b = -1.0; b <= 1.0; b += 0.65) {
    addBox(group, 1.9, 0.08, 0.18, mats.log, 0, 2.6 + b, 1.14);
  }
  return group;
}

function createVoxelPine(mats, scale = 1) {
  const group = new THREE.Group();
  const h = Math.max(2.0, 2.8 * scale);
  addBox(group, 0.32 * scale, h * 0.55, 0.32 * scale, mats.log, 0, h * 0.275, 0);
  addBox(group, 0.24 * scale, h * 0.55, 0.24 * scale, mats.log, 0.22 * scale, h * 0.72, 0);

  const layers = [
    { x: 0.22 * scale, y: h * 1.0, z: 0, w: 2.1 * scale, d: 1.8 * scale, th: 0.36 * scale },
    { x: 0.35 * scale, y: h * 0.84, z: 0.25 * scale, w: 1.6 * scale, d: 1.4 * scale, th: 0.32 * scale },
    { x: -0.25 * scale, y: h * 0.72, z: -0.2 * scale, w: 1.45 * scale, d: 1.3 * scale, th: 0.32 * scale },
    { x: 0.1 * scale, y: h * 1.15, z: 0, w: 1.15 * scale, d: 1.0 * scale, th: 0.3 * scale },
  ];
  for (const l of layers) {
    addBox(group, l.w, l.th, l.d, mats.pineLeaves, l.x, l.y, l.z);
  }
  return group;
}

function createVoxelLeafTree(mats, scale = 1, autumn = false) {
  const group = new THREE.Group();
  const h = Math.max(1.6, 2.0 * scale);
  addBox(group, 0.42 * scale, h, 0.42 * scale, mats.log, 0, h / 2, 0);
  const leafMat = autumn ? mats.autumnLeaves : mats.jadeLeaves;
  addBox(group, 1.9 * scale, 1.25 * scale, 1.9 * scale, leafMat, 0, h + 0.55 * scale, 0);
  addBox(group, 1.25 * scale, 0.65 * scale, 1.25 * scale, leafMat, 0, h + 1.3 * scale, 0);
  return group;
}

function createVoxelBamboo(mats, count = 7) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 0.35 + (i % 3) * 0.3;
    const h = 2.4 + (i % 3) * 0.65;
    const x = Math.round(Math.cos(a) * r * 2) / 2;
    const z = Math.round(Math.sin(a) * r * 2) / 2;
    addBox(group, 0.16, h, 0.16, mats.bamboo, x, h / 2, z);
    addBox(group, 0.55, 0.4, 0.55, mats.jadeLeaves, x, h + 0.15, z);
  }
  return group;
}

function createVoxelWillow(mats, scale = 1) {
  const group = new THREE.Group();
  addBox(group, 0.42 * scale, 2.2 * scale, 0.42 * scale, mats.log, 0, 1.1 * scale, 0);
  addBox(group, 2.2 * scale, 1.1 * scale, 2.2 * scale, mats.jadeLeaves, 0, 2.4 * scale, 0);
  for (const [sx, sz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) {
    addBox(group, 0.25 * scale, 1.3 * scale, 0.25 * scale, mats.jadeLeaves, sx * scale, 1.4 * scale, sz * scale);
  }
  return group;
}

function createVoxelTempleGate(mats) {
  const group = new THREE.Group();
  for (const sx of [-1.1, 1.1]) {
    addBox(group, 0.3, 2.4, 0.3, mats.vermilion, sx, 1.2, 0);
  }
  addBox(group, 2.9, 0.32, 0.34, mats.vermilion, 0, 2.2, 0);
  const roof = createVoxelRoof(mats, 3.4, 1.4, 2, false);
  roof.position.y = 2.36;
  group.add(roof);
  return group;
}

function createVoxelSkiff(mats) {
  const group = new THREE.Group();
  addBox(group, 0.75, 0.22, 2.4, mats.planks, 0, 0.11, 0);
  addBox(group, 0.16, 1.1, 0.16, mats.log, 0.5, 0.4, 1.1);
  return group;
}

function createSealBorderStrip({ width, height, seals = [] }) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e5dcc2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#9c8559';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  for (const seal of seals) {
    ctx.fillStyle = '#b8362a';
    ctx.fillRect(seal.x / 2, seal.y / 2, seal.size / 2, seal.size / 2);
    ctx.fillStyle = '#fff5e6';
    ctx.font = `bold ${Math.round((seal.size / 2) * 0.38)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(seal.text || '御賞', seal.x / 2 + seal.size / 4, seal.y / 2 + seal.size / 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.6, height),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })
  );
  mesh.receiveShadow = true;
  return mesh;
}

function placeOnTerrain(obj, x, z, yOffset = 0, rotY = 0) {
  obj.position.set(x, getTerrainHeight(x, z) + yOffset, z);
  obj.rotation.y = rotY;
  return obj;
}

function buildVoxelBridge(mats, startX, endX, z, heightFn, withPavilion = false) {
  const group = new THREE.Group();
  const segments = Math.round(endX - startX);

  for (let i = 0; i < segments; i++) {
    const xm = startX + i + 0.5;
    const ym = heightFn(xm);
    addBox(group, 1.02, 0.3, 2.4, mats.planks, xm, ym - 0.15, z);

    for (const sz of [-1.08, 1.08]) {
      addBox(group, 1.02, 0.14, 0.14, mats.vermilion, xm, ym + 0.56, z + sz);
      if (i % 2 === 0) {
        addBox(group, 0.18, 0.72, 0.18, mats.vermilion, xm - 0.4, ym + 0.36, z + sz);
        addBox(group, 0.22, 0.22, 0.22, mats.gold, xm - 0.4, ym + 0.8, z + sz);
      }
    }
  }

  for (let i = 1; i < 5; i++) {
    const px = Math.round(THREE.MathUtils.lerp(startX, endX, i / 5));
    const py = heightFn(px);
    const pierH = py + 3.2;
    addBox(group, 1.0, pierH, 2.4, mats.stone, px, py - pierH / 2 - 0.2, z);
  }

  if (withPavilion) {
    const midX = (startX + endX) * 0.5;
    const pav = createVoxelPavilion(mats);
    pav.position.set(midX, heightFn(midX), z);
    group.add(pav);
  }
  return group;
}

export function createArchitectureAndFlora(scene, textures) {
  const mats = createVoxelMaterials(textures);
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // 1. 卷首四印裱邊 (Far Right Border x=+365)
  addBox(worldGroup, 11, 1.2, 58, mats.stone, 365, -0.3, -2, false);
  const rightSealStrip = createSealBorderStrip({
    width: 8,
    height: 54,
    seals: [
      { x: 26, y: 36, size: 74, text: '乾隆' },
      { x: 26, y: 124, size: 74, text: '御覽' },
      { x: 38, y: 388, size: 48, text: '珍賞' },
      { x: 38, y: 446, size: 48, text: '石渠' },
    ],
  });
  rightSealStrip.position.set(365, 0.3, -2);
  worldGroup.add(rightSealStrip);

  // 1b. 卷尾雙印裱邊 (Far Left Border x=-365)
  addBox(worldGroup, 10, 1.2, 58, mats.stone, -365, -0.3, -2, false);
  const leftSealStrip = createSealBorderStrip({
    width: 7,
    height: 54,
    seals: [
      { x: 38, y: 120, size: 46, text: '方琮' },
      { x: 38, y: 390, size: 46, text: '敬臨' },
    ],
  });
  leftSealStrip.position.set(-365, 0.3, -2);
  worldGroup.add(leftSealStrip);

  // 2. 卷首丘陵水村 (Part 17: x=+316, z=+12)
  worldGroup.add(placeOnTerrain(createVoxelHouse(mats, { width: 3.0, depth: 2.2, height: 1.6, thatch: true }), 314, 11.5, 0, 0));
  worldGroup.add(placeOnTerrain(createVoxelHouse(mats, { width: 2.6, depth: 2.0, height: 1.5 }), 318, 12.8, 0, 0));
  worldGroup.add(placeOnTerrain(createVoxelBamboo(mats, 7), 311, 12.5, 0, 0));
  worldGroup.add(placeOnTerrain(createVoxelWillow(mats, 1.1), 320, 14.5, 0, 0));
  const openSkiff = createVoxelSkiff(mats);
  openSkiff.position.set(315, WATER_LEVEL + 0.05, 18.2);
  openSkiff.rotation.y = 0.5;
  worldGroup.add(openSkiff);

  // 3. 右二主山群村落與平木橋 (Part 13-14: x=+225, x ∈ [188, 212])
  worldGroup.add(placeOnTerrain(createVoxelHouse(mats, { width: 3.1, depth: 2.2, height: 1.6, thatch: true }), 224, 9.5, 0, 0));
  worldGroup.add(placeOnTerrain(createVoxelHouse(mats, { width: 2.5, depth: 1.9, height: 1.5 }), 228, 10.8, 0, 0));
  worldGroup.add(buildVoxelBridge(mats, 188, 212, 11, getRightBridgeY, false));
  worldGroup.add(placeOnTerrain(createVoxelWillow(mats, 1.0), 213.5, 12.2, 0, 0));

  // 4. 右一大主山群村舍與泊船 (Part 10-12: x=+145, z=+8)
  worldGroup.add(placeOnTerrain(createVoxelHouse(mats, { width: 3.2, depth: 2.3, height: 1.7, thatch: true }), 144, 7.8, 0, 0));
  worldGroup.add(placeOnTerrain(createVoxelBamboo(mats, 6), 147.5, 8.6, 0, 0));
  worldGroup.add(placeOnTerrain(createVoxelWillow(mats, 1.05), 141.0, 10.2, 0, 0));

  const mooredBoat = createVoxelMastedBoat(mats);
  mooredBoat.position.set(110, WATER_LEVEL + 0.05, 14);
  mooredBoat.rotation.y = 0.9;
  worldGroup.add(mooredBoat);

  // 5. 正中特大主峰前景拱橋亭閣 (Part 06-07: x ∈ [-18, +14], z = 12)
  worldGroup.add(buildVoxelBridge(mats, -18, 14, 12, getCentralBridgeY, true));
  const bridgeLight = new THREE.PointLight('#ffcf78', 3.5, 18, 1.5);
  bridgeLight.position.set(-2, 6.2, 12);
  worldGroup.add(bridgeLight);
  worldGroup.add(placeOnTerrain(createVoxelHouse(mats, { width: 3.4, depth: 2.4, height: 1.8 }), 4, 6.2, 0, 0));
  worldGroup.add(placeOnTerrain(createVoxelWillow(mats, 1.15), -20.5, 13.8, 0, 0));
  worldGroup.add(placeOnTerrain(createVoxelWillow(mats, 1.05), 16.2, 14.0, 0, 0));

  // 6. 中左層巒山寺 (Part 05: x=-76, z=+4)
  worldGroup.add(placeOnTerrain(createVoxelHouse(mats, { width: 4.5, depth: 3.1, height: 2.2, vermilion: true }), -76, 3.8, 0, 0));
  const templeLight = new THREE.PointLight('#ffcf78', 3.0, 16, 1.5);
  templeLight.position.set(-76, 7.2, 5.2);
  worldGroup.add(templeLight);
  worldGroup.add(placeOnTerrain(createVoxelTempleGate(mats), -76, 7.2, 0, 0));
  worldGroup.add(placeOnTerrain(createVoxelPagoda(mats, 5), -71, 4.5, 0, 0));

  // 7. 左端沙嘴與卷尾漁村 (Part 01-03: x=-240, x=-315)
  worldGroup.add(placeOnTerrain(createVoxelHouse(mats, { width: 2.8, depth: 2.0, height: 1.5, thatch: true }), -315, 7.5, 0, 0));
  worldGroup.add(placeOnTerrain(createVoxelWillow(mats, 1.0), -242, 14.2, 0, 0));
  const endSkiff = createVoxelSkiff(mats);
  endSkiff.position.set(-310, WATER_LEVEL + 0.04, 14.0);
  endSkiff.rotation.y = -0.4;
  worldGroup.add(endSkiff);

  for (let i = 0; i < 36; i++) {
    const rx = Math.round(-245 + Math.sin(i * 6.7) * 16);
    const rz = Math.round(12 + Math.cos(i * 4.3) * 6);
    const ry = getTerrainHeight(rx, rz);
    if (ry > -0.7 && ry < 0.7) {
      addBox(worldGroup, 0.18, 1.3, 0.18, mats.reed, rx, Math.max(WATER_LEVEL, ry) + 0.55, rz, false);
    }
  }

  // 8. Scattered Blocky Pines & Leaf Trees across full 740-unit span
  let seed = 2026;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 340; i++) {
    const tx = Math.round((rand() - 0.5) * 730);
    const tz = Math.round((rand() - 0.5) * 88);
    const ty = getTerrainHeight(tx, tz);
    if (ty < 1.3 || ty > 24) continue;

    if (Math.hypot(tx - 316, tz - 12) < 7) continue;
    if (Math.hypot(tx - 225, tz - 10) < 7) continue;
    if (Math.abs(tx - 200) < 16 && Math.abs(tz - 11) < 5) continue;
    if (Math.hypot(tx - 145, tz - 8) < 7) continue;
    if (Math.abs(tx + 2) < 18 && Math.abs(tz - 12) < 5) continue;
    if (Math.hypot(tx + 76, tz - 4) < 8) continue;
    if (Math.hypot(tx + 315, tz - 8) < 7) continue;

    const isPine = ty > 6.5 || rand() > 0.45;
    const sc = 0.8 + rand() * 0.6;
    const tree = isPine ? createVoxelPine(mats, sc) : createVoxelLeafTree(mats, sc, rand() > 0.74);
    worldGroup.add(placeOnTerrain(tree, tx, tz, 0, 0));
  }

  return {};
}
