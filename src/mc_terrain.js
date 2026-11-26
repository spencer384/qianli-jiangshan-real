import * as THREE from 'three';
import { getTerrainHeight as getInkTerrainHeight, getCentralBridgeY, getRightBridgeY, SCROLL_WIDTH, SCROLL_DEPTH } from './terrain.js';

export { SCROLL_WIDTH, SCROLL_DEPTH, getCentralBridgeY, getRightBridgeY };
export const WATER_LEVEL = 0.25;
export const VOXEL_SIZE = 0.75;

function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

export function getRawTerrainHeight(x, z) {
  return getInkTerrainHeight(x, z);
}

// Quantized to voxel grid so buildings, trees, and walkers sit flush on block tops
export function getTerrainHeight(x, z) {
  const gx = Math.round(x / VOXEL_SIZE) * VOXEL_SIZE;
  const gz = Math.round(z / VOXEL_SIZE) * VOXEL_SIZE;
  const stepY = Math.floor(getInkTerrainHeight(gx, gz) / VOXEL_SIZE);
  return (stepY + 0.5) * VOXEL_SIZE;
}

export function createTerrainAndWater(scene, textures) {
  const nxMin = Math.round(-380 / VOXEL_SIZE);
  const nxMax = Math.round(380 / VOXEL_SIZE);
  const nzMin = Math.round(-55 / VOXEL_SIZE);
  const nzMax = Math.round(55 / VOXEL_SIZE);
  const widthCount = nxMax - nxMin + 1;
  const depthCount = nzMax - nzMin + 1;

  const grid = new Int16Array(widthCount * depthCount);
  const idx = (ix, iz) => (ix - nxMin) * depthCount + (iz - nzMin);

  for (let ix = nxMin; ix <= nxMax; ix++) {
    const wx = ix * VOXEL_SIZE;
    for (let iz = nzMin; iz <= nzMax; iz++) {
      const wz = iz * VOXEL_SIZE;
      grid[idx(ix, iz)] = Math.floor(getRawTerrainHeight(wx, wz) / VOXEL_SIZE);
    }
  }

  const buckets = {
    underwater: [],
    sand: [],
    ochre: [],
    malachite: [],
    azurite: [],
    lapisPeak: [],
  };

  for (let ix = nxMin; ix <= nxMax; ix++) {
    const wx = ix * VOXEL_SIZE;
    for (let iz = nzMin; iz <= nzMax; iz++) {
      const wz = iz * VOXEL_SIZE;
      const h = grid[idx(ix, iz)];

      // Skip deep flat ocean floor to keep triangle count lean and 60fps smooth
      if (h < -2) continue;

      const hL = ix > nxMin ? grid[idx(ix - 1, iz)] : h;
      const hR = ix < nxMax ? grid[idx(ix + 1, iz)] : h;
      const hF = iz > nzMin ? grid[idx(ix, iz - 1)] : h;
      const hB = iz < nzMax ? grid[idx(ix, iz + 1)] : h;
      const minNeighbor = Math.min(hL, hR, hF, hB);
      const startY = Math.max(-2, Math.min(h, minNeighbor + 1));

      for (let iy = startY; iy <= h; iy++) {
        const wy = iy * VOXEL_SIZE;
        let type = 'ochre';
        if (wy < 0) type = 'underwater';
        else if (wy <= 1.25) type = 'sand';
        else if (wy <= 4.25) type = 'ochre';
        else if (wy <= 12.25) type = 'malachite';
        else if (wy <= 23.0) type = 'azurite';
        else type = 'lapisPeak';

        buckets[type].push(wx, wy, wz);
      }
    }
  }

  const blockGeo = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
  const dummy = new THREE.Object3D();

  const blockConfigs = [
    { key: 'underwater', tex: textures.underwater, roughness: 0.9, shadow: false },
    { key: 'sand', tex: textures.sand, roughness: 0.92, shadow: true },
    { key: 'ochre', tex: textures.ochre, roughness: 0.92, shadow: true },
    { key: 'malachite', tex: textures.malachite, roughness: 0.88, shadow: true },
    { key: 'azurite', tex: textures.azurite, roughness: 0.85, shadow: true },
    { key: 'lapisPeak', tex: textures.lapisPeak, roughness: 0.8, shadow: true },
  ];

  for (const cfg of blockConfigs) {
    const coords = buckets[cfg.key];
    const count = coords.length / 3;
    if (count === 0) continue;

    const mat = new THREE.MeshStandardMaterial({
      map: cfg.tex,
      roughness: cfg.roughness,
      metalness: 0.02,
    });
    const inst = new THREE.InstancedMesh(blockGeo, mat, count);
    inst.castShadow = cfg.shadow;
    inst.receiveShadow = true;

    for (let i = 0; i < count; i++) {
      dummy.position.set(coords[i * 3], coords[i * 3 + 1], coords[i * 3 + 2]);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
  }

  // --- Minecraft Pixelated Water Plane ---
  const waterGeo = new THREE.PlaneGeometry(1200, 360);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    map: textures.water,
    color: '#73c7c4',
    transparent: true,
    opacity: 0.82,
    roughness: 0.25,
    metalness: 0.08,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = WATER_LEVEL;
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // --- Minecraft Sky Dome + Square Sun + Blocky Clouds ---
  const skyGeo = new THREE.SphereGeometry(620, 24, 12);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      void main() {
        float h = clamp(normalize(vPos).y, 0.0, 1.0);
        vec3 horizon = vec3(0.78, 0.87, 0.92);
        vec3 zenith = vec3(0.45, 0.70, 0.93);
        gl_FragColor = vec4(mix(horizon, zenith, pow(h, 0.55)), 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  const sunMesh = new THREE.Mesh(
    new THREE.BoxGeometry(28, 28, 2),
    new THREE.MeshBasicMaterial({ color: '#fff7c2' })
  );
  sunMesh.position.set(160, 165, -190);
  sunMesh.lookAt(0, 0, 0);
  scene.add(sunMesh);

  const cloudsGroup = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 1.0,
    emissive: '#e8f1f8',
    emissiveIntensity: 0.35,
  });
  const cloudBoxes = [];
  for (let i = 0; i < 36; i++) {
    const cx = (hash2(i, 11) - 0.5) * 820;
    const cy = 54 + Math.floor(hash2(i, 22) * 8);
    const cz = -42 + hash2(i, 33) * 58;
    const w = 12 + Math.floor(hash2(i, 44) * 18);
    const d = 6 + Math.floor(hash2(i, 55) * 8);
    const cloud = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), cloudMat);
    cloud.position.set(cx, cy, cz);
    cloudsGroup.add(cloud);
    cloudBoxes.push({ mesh: cloud, speed: 0.6 + hash2(i, 66) * 0.5 });
  }
  scene.add(cloudsGroup);

  // --- Lake Surface & Mid-Mountain Hazy Mist Layers (山水湖面朦朧薄霧) ---
  function createMistTexture(seedOffset) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 256, 128);
    for (let i = 0; i < 48; i++) {
      const rx = hash2(i + seedOffset, 1.3) * 256;
      const ry = hash2(i + seedOffset, 2.7) * 128;
      const rad = 18 + hash2(i + seedOffset, 4.1) * 34;
      const g = ctx.createRadialGradient(rx, ry, 2, rx, ry, rad);
      g.addColorStop(0, 'rgba(232, 244, 248, 0.28)');
      g.addColorStop(0.55, 'rgba(220, 238, 244, 0.14)');
      g.addColorStop(1, 'rgba(220, 238, 244, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(rx - rad, ry - rad, rad * 2, rad * 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 2);
    return tex;
  }

  const mistLayers = [];
  const mistConfigs = [
    { y: WATER_LEVEL + 0.38, opacity: 0.48, speedX: 0.012, phase: 0.0, z: 6, depth: 74 },
    { y: WATER_LEVEL + 0.95, opacity: 0.34, speedX: -0.009, phase: 1.7, z: 2, depth: 66 },
    { y: 6.2, opacity: 0.28, speedX: 0.007, phase: 3.1, z: -12, depth: 36 },
    { y: 10.5, opacity: 0.22, speedX: -0.006, phase: 4.5, z: -15, depth: 30 },
  ];

  mistConfigs.forEach((cfg, idx) => {
    const tex = createMistTexture(idx * 31);
    const geo = new THREE.PlaneGeometry(SCROLL_WIDTH + 40, cfg.depth);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: cfg.opacity,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, cfg.y, cfg.z);
    scene.add(mesh);
    mistLayers.push({ mesh, tex, speedX: cfg.speedX, phase: cfg.phase });
  });

  return { waterMesh, waterTex: textures.water, cloudBoxes, mistLayers };
}
