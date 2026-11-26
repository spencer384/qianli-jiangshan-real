import * as THREE from 'three';
import { getTerrainHeight, getCentralBridgeY, getRightBridgeY, WATER_LEVEL } from './mc_terrain.js';

function createVoxelWalker({ robeColor = '#2b4c5e', hasStrawHat = false } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const robeMat = new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#e6c29f', roughness: 0.8 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#26221e', roughness: 0.9 });
  const hatMat = new THREE.MeshStandardMaterial({ color: '#d4b36a', roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.18), robeMat);
  torso.position.y = 0.49;
  torso.castShadow = true;
  body.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), skinMat);
  head.position.y = 0.82;
  head.castShadow = true;
  body.add(head);

  if (hasStrawHat) {
    const hatBrim = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.46), hatMat);
    hatBrim.position.y = 0.95;
    body.add(hatBrim);
    const hatTop = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.26), hatMat);
    hatTop.position.y = 1.02;
    body.add(hatTop);
  } else {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.25), darkMat);
    hair.position.y = 0.95;
    body.add(hair);
  }

  const legGeo = new THREE.BoxGeometry(0.11, 0.28, 0.12);
  legGeo.translate(0, -0.14, 0);
  const leftLeg = new THREE.Mesh(legGeo, darkMat);
  leftLeg.position.set(-0.07, 0.28, 0);
  body.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, darkMat);
  rightLeg.position.set(0.07, 0.28, 0);
  body.add(rightLeg);

  const armGeo = new THREE.BoxGeometry(0.1, 0.28, 0.1);
  armGeo.translate(0, -0.14, 0);
  const leftArm = new THREE.Mesh(armGeo, robeMat);
  leftArm.position.set(-0.19, 0.68, 0);
  body.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, robeMat);
  rightArm.position.set(0.19, 0.68, 0);
  body.add(rightArm);

  return { root, body, leftLeg, rightLeg, leftArm, rightArm };
}

function createVoxelBoat(withCanopy = true) {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: '#7a5230', roughness: 0.85 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: '#cfb884', roughness: 0.9 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.28, 3.2), hullMat);
  hull.position.y = 0.1;
  hull.castShadow = true;
  group.add(hull);

  if (withCanopy) {
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.55, 1.35), canopyMat);
    canopy.position.set(0, 0.48, -0.1);
    canopy.castShadow = true;
    group.add(canopy);
  }

  const wake = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.04, 1.6),
    new THREE.MeshBasicMaterial({ color: '#eef7f5', transparent: true, opacity: 0.45 })
  );
  wake.position.set(0, 0.02, -2.5);
  group.add(wake);

  const boatman = createVoxelWalker({ robeColor: '#3a5763', hasStrawHat: true });
  boatman.root.scale.setScalar(0.85);
  boatman.root.position.set(0, 0.22, -1.1);
  group.add(boatman.root);
  return group;
}

function createVoxelEgret() {
  const root = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.55), mat);
  root.add(body);

  const wingGeo = new THREE.BoxGeometry(0.6, 0.05, 0.22);
  const leftWing = new THREE.Mesh(wingGeo.clone().translate(-0.32, 0, 0), mat);
  const rightWing = new THREE.Mesh(wingGeo.clone().translate(0.32, 0, 0), mat);
  root.add(leftWing);
  root.add(rightWing);
  return { root, leftWing, rightWing };
}

export function createAnimations(scene) {
  // 1. Blocky Minecraft Waterfall at Grand Central Peak flank
  const wfX = 22;
  const wfStartY = 19.5;
  const wfStartZ = -10.0;
  const wfEndY = WATER_LEVEL;
  const wfEndZ = 1.5;

  function evalWaterfallPoint(t, spreadX = 0) {
    const y = THREE.MathUtils.lerp(wfStartY, wfEndY, Math.pow(t, 1.35));
    const z = THREE.MathUtils.lerp(wfStartZ, wfEndZ, Math.pow(t, 0.78));
    return new THREE.Vector3(wfX + spreadX, y, z);
  }

  const wfBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 19.2, 1.2),
    new THREE.MeshBasicMaterial({ color: '#8ad4de', transparent: true, opacity: 0.45 })
  );
  wfBase.position.set(wfX, 10.0, -4.5);
  wfBase.rotation.x = 0.5;
  scene.add(wfBase);

  const wfCubeCount = 280;
  const wfCubeGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
  const wfCubeMat = new THREE.MeshBasicMaterial({ color: '#e6f9fc', transparent: true, opacity: 0.85 });
  const wfInst = new THREE.InstancedMesh(wfCubeGeo, wfCubeMat, wfCubeCount);
  const wfProgress = new Float32Array(wfCubeCount);
  const wfOffsets = new Float32Array(wfCubeCount);
  const wfSpeeds = new Float32Array(wfCubeCount);
  for (let i = 0; i < wfCubeCount; i++) {
    wfProgress[i] = Math.random();
    wfOffsets[i] = (Math.random() - 0.5) * 2.4;
    wfSpeeds[i] = 0.45 + Math.random() * 0.25;
  }
  scene.add(wfInst);

  // 2. Walking Blocky Figures
  const walkers = [];
  function addWalkerPath({ waypoints, speed = 1.4, robeColor, hasStrawHat = false, heightMode = 'terrain', phaseOffset = 0 }) {
    const figure = createVoxelWalker({ robeColor, hasStrawHat });
    scene.add(figure.root);
    walkers.push({ figure, waypoints, speed, heightMode, progress: phaseOffset, dir: 1, walkPhase: phaseOffset * 10 });
  }

  const bridgeColors = ['#2d586b', '#8c3b2b', '#4d6b4a', '#70583c'];
  for (let i = 0; i < 4; i++) {
    const zOff = i % 2 === 0 ? -0.45 : 0.45;
    addWalkerPath({
      waypoints: [new THREE.Vector3(-14, 0, 12 + zOff), new THREE.Vector3(10, 0, 12 + zOff)],
      speed: 1.35 + (i % 3) * 0.2,
      robeColor: bridgeColors[i],
      hasStrawHat: i % 2 === 1,
      heightMode: 'centralBridge',
      phaseOffset: i * 0.24,
    });
  }

  for (let i = 0; i < 2; i++) {
    addWalkerPath({
      waypoints: [new THREE.Vector3(155, 0, 11 + (i === 0 ? -0.4 : 0.4)), new THREE.Vector3(173, 0, 11 + (i === 0 ? -0.4 : 0.4))],
      speed: 1.25,
      robeColor: i === 0 ? '#2b4d5e' : '#8b422e',
      hasStrawHat: i === 1,
      heightMode: 'rightBridge',
      phaseOffset: i * 0.45,
    });
  }

  addWalkerPath({ waypoints: [new THREE.Vector3(255, 0, 12), new THREE.Vector3(261, 0, 13)], speed: 1.15, robeColor: '#3f5f68', hasStrawHat: true, phaseOffset: 0.2 });
  addWalkerPath({ waypoints: [new THREE.Vector3(114, 0, 8), new THREE.Vector3(118, 0, 9)], speed: 1.1, robeColor: '#345e4e', hasStrawHat: true, phaseOffset: 0.3 });
  addWalkerPath({ waypoints: [new THREE.Vector3(-68, 0, 4), new THREE.Vector3(-63, 0, 5)], speed: 1.05, robeColor: '#9c5a2b', phaseOffset: 0.1 });
  addWalkerPath({ waypoints: [new THREE.Vector3(-270, 0, 8), new THREE.Vector3(-265, 0, 8)], speed: 1.05, robeColor: '#2d586b', hasStrawHat: true, phaseOffset: 0.4 });

  // 3. Blocky Boats
  const boatConfigs = [
    { cx: 240, cz: 10, rx: 10, rz: 4.5, speed: 0.12, canopy: true, phase: 0.0 },
    { cx: 82, cz: 8, rx: 14, rz: 5.0, speed: -0.11, canopy: true, phase: 1.4 },
    { cx: -2, cz: 22, rx: 16, rz: 4.0, speed: 0.12, canopy: false, phase: 0.7 },
    { cx: -175, cz: 6, rx: 24, rz: 6.5, speed: 0.12, canopy: true, phase: 2.1 },
    { cx: -215, cz: 0, rx: 22, rz: 5.5, speed: -0.1, canopy: false, phase: 0.5 },
    { cx: -242, cz: 10, rx: 14, rz: 4.0, speed: 0.1, canopy: true, phase: 3.1 },
  ];
  const boats = boatConfigs.map((cfg) => {
    const mesh = createVoxelBoat(cfg.canopy);
    scene.add(mesh);
    return { mesh, cfg };
  });

  // 4. Blocky Egrets
  const egrets = [];
  const egretFlocks = [
    { cx: 238, cy: 11, cz: 2, rx: 18, rz: 8, speed: 0.26, phase: 0 },
    { cx: 82, cy: 13, cz: -2, rx: 20, rz: 9, speed: -0.22, phase: 1.8 },
    { cx: -200, cy: 12, cz: 0, rx: 28, rz: 10, speed: 0.2, phase: 3.2 },
  ];
  for (const flock of egretFlocks) {
    for (let i = 0; i < 3; i++) {
      const eg = createVoxelEgret();
      scene.add(eg.root);
      egrets.push({ eg, flock, offset: i * 0.42, wingPhase: i * 1.4 });
    }
  }

  // 5. Drifting Lake-Surface & Waterfall Mist Puffs (湖面水氣飄渺粒子)
  const mistCanvas = document.createElement('canvas');
  mistCanvas.width = 64;
  mistCanvas.height = 64;
  const mctx = mistCanvas.getContext('2d');
  const mg = mctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  mg.addColorStop(0, 'rgba(240, 249, 252, 0.55)');
  mg.addColorStop(0.5, 'rgba(225, 242, 248, 0.24)');
  mg.addColorStop(1, 'rgba(225, 242, 248, 0)');
  mctx.fillStyle = mg;
  mctx.fillRect(0, 0, 64, 64);
  const mistTex = new THREE.CanvasTexture(mistCanvas);

  const lakeMistCount = 180;
  const lakeMistGeo = new THREE.BufferGeometry();
  const lakeMistPos = new Float32Array(lakeMistCount * 3);
  const lakeMistBase = [];
  for (let i = 0; i < lakeMistCount; i++) {
    const isWaterfallMist = i < 24;
    const bx = isWaterfallMist ? wfX + (Math.random() - 0.5) * 9 : (Math.random() - 0.5) * 560;
    const by = isWaterfallMist ? WATER_LEVEL + 0.6 + Math.random() * 2.2 : WATER_LEVEL + 0.4 + Math.random() * 1.4;
    const bz = isWaterfallMist ? wfEndZ + (Math.random() - 0.5) * 6 : 2 + Math.random() * 28;
    lakeMistPos[i * 3] = bx;
    lakeMistPos[i * 3 + 1] = by;
    lakeMistPos[i * 3 + 2] = bz;
    lakeMistBase.push({ bx, by, bz, speed: 0.4 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2 });
  }
  lakeMistGeo.setAttribute('position', new THREE.BufferAttribute(lakeMistPos, 3));
  scene.add(
    new THREE.Points(
      lakeMistGeo,
      new THREE.PointsMaterial({
        map: mistTex,
        size: 7.5,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      })
    )
  );

  const dummy = new THREE.Object3D();

  return function updateAnimations(dt, elapsed) {
    // Waterfall cubes
    for (let i = 0; i < wfCubeCount; i++) {
      wfProgress[i] += dt * wfSpeeds[i];
      if (wfProgress[i] > 1) wfProgress[i] -= 1;
      const p = evalWaterfallPoint(wfProgress[i], wfOffsets[i]);
      dummy.position.copy(p);
      dummy.updateMatrix();
      wfInst.setMatrixAt(i, dummy.matrix);
    }
    wfInst.instanceMatrix.needsUpdate = true;

    // Walkers
    for (const w of walkers) {
      const p0 = w.waypoints[0];
      const p1 = w.waypoints[1];
      const dist = p0.distanceTo(p1);
      w.progress += (w.speed * dt * w.dir) / Math.max(dist, 0.1);
      if (w.progress >= 1) {
        w.progress = 1;
        w.dir = -1;
      } else if (w.progress <= 0) {
        w.progress = 0;
        w.dir = 1;
      }

      const x = THREE.MathUtils.lerp(p0.x, p1.x, w.progress);
      const z = THREE.MathUtils.lerp(p0.z, p1.z, w.progress);
      let y = 0;
      if (w.heightMode === 'centralBridge') y = getCentralBridgeY(x);
      else if (w.heightMode === 'rightBridge') y = getRightBridgeY(x);
      else y = getTerrainHeight(x, z);

      w.figure.root.position.set(x, y, z);
      const dx = (p1.x - p0.x) * w.dir;
      const dz = (p1.z - p0.z) * w.dir;
      w.figure.root.rotation.y = Math.atan2(dx, dz);

      w.walkPhase += dt * w.speed * 7.5;
      const swing = Math.sin(w.walkPhase) * 0.55;
      w.figure.leftLeg.rotation.x = swing;
      w.figure.rightLeg.rotation.x = -swing;
      w.figure.leftArm.rotation.x = -swing * 0.7;
      w.figure.rightArm.rotation.x = swing * 0.7;
    }

    // Boats
    for (const b of boats) {
      const { cx, cz, rx, rz, speed, phase } = b.cfg;
      const t = elapsed * speed + phase;
      const x = cx + Math.cos(t) * rx;
      const z = cz + Math.sin(t) * rz;
      const dx = -Math.sin(t) * rx * speed;
      const dz = Math.cos(t) * rz * speed;
      b.mesh.position.set(x, WATER_LEVEL + Math.sin(elapsed * 2 + phase) * 0.04, z);
      b.mesh.rotation.y = Math.atan2(dx, dz);
    }

    // Egrets
    for (const item of egrets) {
      const { eg, flock, offset, wingPhase } = item;
      const t = elapsed * flock.speed + flock.phase + offset;
      const x = flock.cx + Math.cos(t) * flock.rx;
      const z = flock.cz + Math.sin(t * 1.4) * flock.rz;
      const y = flock.cy + Math.sin(elapsed * 1.2 + offset) * 0.8;
      const dx = -Math.sin(t) * flock.rx * flock.speed;
      const dz = Math.cos(t * 1.4) * flock.rz * flock.speed * 1.4;
      eg.root.position.set(x, y, z);
      eg.root.rotation.y = Math.atan2(dx, dz);

      const flap = Math.sin(elapsed * 8.5 + wingPhase) * 0.55;
      eg.leftWing.rotation.z = flap;
      eg.rightWing.rotation.z = -flap;
    }

    // Drifting lake & waterfall mist puffs
    const mp = lakeMistGeo.attributes.position.array;
    for (let i = 0; i < lakeMistCount; i++) {
      const b = lakeMistBase[i];
      mp[i * 3] = b.bx + Math.sin(elapsed * 0.25 * b.speed + b.phase) * 3.5;
      mp[i * 3 + 1] = b.by + Math.sin(elapsed * 0.4 + b.phase) * 0.25;
    }
    lakeMistGeo.attributes.position.needsUpdate = true;
  };
}
