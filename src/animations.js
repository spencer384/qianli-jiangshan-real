import * as THREE from 'three';
import { getTerrainHeight, getCentralBridgeY, getRightBridgeY, WATER_LEVEL } from './terrain.js';

function createSoftParticleTexture() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(240,248,245,0.65)');
  g.addColorStop(1, 'rgba(240,248,245,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

function createWalker({ robeColor = '#2b4c5e', hasStrawHat = false } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const robeMat = new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#e0bfa0', roughness: 0.8 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#26221e', roughness: 0.9 });
  const hatMat = new THREE.MeshStandardMaterial({ color: '#c4a668', roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.44, 7), robeMat);
  torso.position.y = 0.48;
  torso.castShadow = true;
  body.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), skinMat);
  head.position.y = 0.79;
  head.castShadow = true;
  body.add(head);

  if (hasStrawHat) {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.11, 10), hatMat);
    hat.position.y = 0.87;
    hat.castShadow = true;
    body.add(hat);
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), darkMat);
    hair.position.set(0, 0.88, -0.02);
    body.add(hair);
  }

  const legGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.28, 6);
  legGeo.translate(0, -0.14, 0);
  const leftLeg = new THREE.Mesh(legGeo, darkMat);
  leftLeg.position.set(-0.06, 0.28, 0);
  body.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, darkMat);
  rightLeg.position.set(0.06, 0.28, 0);
  body.add(rightLeg);

  const armGeo = new THREE.CylinderGeometry(0.032, 0.028, 0.28, 6);
  armGeo.translate(0, -0.14, 0);
  const leftArm = new THREE.Mesh(armGeo, robeMat);
  leftArm.position.set(-0.14, 0.66, 0);
  body.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, robeMat);
  rightArm.position.set(0.14, 0.66, 0);
  body.add(rightArm);

  return { root, body, leftLeg, rightLeg, leftArm, rightArm };
}

function createBoat(withCanopy = true) {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: '#6b472a', roughness: 0.85 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: '#c7b282', roughness: 0.9 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 3.2), hullMat);
  hull.position.y = 0.08;
  hull.castShadow = true;
  group.add(hull);

  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 4), hullMat);
  bow.rotation.x = Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.scale.set(1.0, 0.45, 1.0);
  bow.position.set(0, 0.12, 1.95);
  group.add(bow);

  if (withCanopy) {
    const canopy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 1.35, 8, 1, false, 0, Math.PI),
      canopyMat
    );
    canopy.rotation.z = Math.PI / 2;
    canopy.rotation.y = Math.PI / 2;
    canopy.position.set(0, 0.22, -0.1);
    canopy.castShadow = true;
    group.add(canopy);
  }

  const wakeGeo = new THREE.PlaneGeometry(1.8, 3.4);
  wakeGeo.rotateX(-Math.PI / 2);
  const wake = new THREE.Mesh(
    wakeGeo,
    new THREE.MeshBasicMaterial({ color: '#e8e2ce', transparent: true, opacity: 0.28, depthWrite: false })
  );
  wake.position.set(0, 0.02, -3.1);
  group.add(wake);

  const boatman = createWalker({ robeColor: '#3a5763', hasStrawHat: true });
  boatman.root.scale.setScalar(0.85);
  boatman.root.position.set(0, 0.18, -1.1);
  group.add(boatman.root);
  return group;
}

function createEgret() {
  const root = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#faf6ec', roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.65, 6), mat);
  body.rotation.x = Math.PI / 2;
  root.add(body);

  const wingGeo = new THREE.BoxGeometry(0.62, 0.03, 0.24);
  const leftWing = new THREE.Mesh(wingGeo.clone().translate(-0.31, 0, 0), mat);
  const rightWing = new THREE.Mesh(wingGeo.clone().translate(0.31, 0, 0), mat);
  root.add(leftWing);
  root.add(rightWing);
  return { root, leftWing, rightWing };
}

export function createAnimations(scene) {
  const softTex = createSoftParticleTexture();

  // 1. Waterfall at Grand Central Peak flank (x = +22, z = -10 -> plunge pool z = +1.5)
  const wfX = 22;
  const wfStartY = 19.3;
  const wfStartZ = -10.0;
  const wfEndY = WATER_LEVEL;
  const wfEndZ = 1.5;

  function evalWaterfallPoint(t, spreadX = 0) {
    const y = THREE.MathUtils.lerp(wfStartY, wfEndY, Math.pow(t, 1.35));
    const z = THREE.MathUtils.lerp(wfStartZ, wfEndZ, Math.pow(t, 0.78));
    return new THREE.Vector3(wfX + spreadX, y, z);
  }

  const ribbonGeo = new THREE.PlaneGeometry(2.8, 1, 8, 24);
  const rPos = ribbonGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const pt = evalWaterfallPoint(0.5 - rPos.getY(i), rPos.getX(i));
    rPos.setXYZ(i, pt.x, pt.y, pt.z);
  }
  ribbonGeo.computeVertexNormals();
  scene.add(
    new THREE.Mesh(
      ribbonGeo,
      new THREE.MeshBasicMaterial({ color: '#dcebe8', transparent: true, opacity: 0.54, side: THREE.DoubleSide, depthWrite: false })
    )
  );

  const wfCount = 700;
  const wfGeo = new THREE.BufferGeometry();
  const wfPositions = new Float32Array(wfCount * 3);
  const wfProgress = new Float32Array(wfCount);
  const wfOffsets = new Float32Array(wfCount);
  const wfSpeeds = new Float32Array(wfCount);
  for (let i = 0; i < wfCount; i++) {
    wfProgress[i] = Math.random();
    wfOffsets[i] = (Math.random() - 0.5) * 2.6;
    wfSpeeds[i] = 0.42 + Math.random() * 0.28;
    const p = evalWaterfallPoint(wfProgress[i], wfOffsets[i]);
    wfPositions[i * 3] = p.x;
    wfPositions[i * 3 + 1] = p.y;
    wfPositions[i * 3 + 2] = p.z;
  }
  wfGeo.setAttribute('position', new THREE.BufferAttribute(wfPositions, 3));
  scene.add(
    new THREE.Points(
      wfGeo,
      new THREE.PointsMaterial({ map: softTex, color: '#f4faf8', size: 0.55, transparent: true, opacity: 0.85, depthWrite: false })
    )
  );

  const splashCount = 160;
  const splashGeo = new THREE.BufferGeometry();
  const splashPos = new Float32Array(splashCount * 3);
  const splashVel = [];
  const splashLife = new Float32Array(splashCount);
  const resetSplash = (i) => {
    splashPos[i * 3] = wfX + (Math.random() - 0.5) * 3.2;
    splashPos[i * 3 + 1] = WATER_LEVEL + 0.08;
    splashPos[i * 3 + 2] = wfEndZ + (Math.random() - 0.5) * 1.6;
    splashVel[i] = new THREE.Vector3((Math.random() - 0.5) * 2.2, 1.8 + Math.random() * 2.5, (Math.random() - 0.5) * 2.2);
    splashLife[i] = Math.random();
  };
  for (let i = 0; i < splashCount; i++) resetSplash(i);
  splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPos, 3));
  scene.add(
    new THREE.Points(
      splashGeo,
      new THREE.PointsMaterial({ map: softTex, color: '#ffffff', size: 0.62, transparent: true, opacity: 0.78, depthWrite: false })
    )
  );

  const ripples = [];
  for (let i = 0; i < 4; i++) {
    const ringGeo = new THREE.RingGeometry(0.6, 0.82, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: '#eef5f2', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.position.set(wfX, WATER_LEVEL + 0.04, wfEndZ);
    scene.add(ring);
    ripples.push({ mesh: ring, phase: i * 0.25 });
  }

  // 2. Walking Figures
  const walkers = [];
  function addWalkerPath({ waypoints, speed = 1.4, robeColor, hasStrawHat = false, heightMode = 'terrain', phaseOffset = 0 }) {
    const figure = createWalker({ robeColor, hasStrawHat });
    scene.add(figure.root);
    walkers.push({ figure, waypoints, speed, heightMode, progress: phaseOffset, dir: 1, walkPhase: phaseOffset * 10 });
  }

  // Central Pavilion Bridge (x ∈ [-14, +10], z = 12)
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

  // Right Wooden Bridge (x ∈ [155, 173], z = 11)
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

  // Villages & Temple
  addWalkerPath({
    waypoints: [new THREE.Vector3(255, 0, 12.2), new THREE.Vector3(261, 0, 12.6)],
    speed: 1.15,
    robeColor: '#3f5f68',
    hasStrawHat: true,
    phaseOffset: 0.2,
  });
  addWalkerPath({
    waypoints: [new THREE.Vector3(114, 0, 8.2), new THREE.Vector3(118.5, 0, 8.6)],
    speed: 1.1,
    robeColor: '#345e4e',
    hasStrawHat: true,
    phaseOffset: 0.3,
  });
  addWalkerPath({
    waypoints: [new THREE.Vector3(-68.5, 0, 4.2), new THREE.Vector3(-63.5, 0, 4.5)],
    speed: 1.05,
    robeColor: '#9c5a2b',
    phaseOffset: 0.1,
  });
  addWalkerPath({
    waypoints: [new THREE.Vector3(-270, 0, 8.2), new THREE.Vector3(-265.5, 0, 7.6)],
    speed: 1.05,
    robeColor: '#2d586b',
    hasStrawHat: true,
    phaseOffset: 0.4,
  });

  // 3. Boats in open bays & lake
  const boatConfigs = [
    { cx: 240, cz: 10, rx: 10, rz: 4.5, speed: 0.12, canopy: true, phase: 0.0 },
    { cx: 82, cz: 8, rx: 14, rz: 5.0, speed: -0.11, canopy: true, phase: 1.4 },
    { cx: -2, cz: 22, rx: 16, rz: 4.0, speed: 0.12, canopy: false, phase: 0.7 },
    { cx: -175, cz: 6, rx: 24, rz: 6.5, speed: 0.12, canopy: true, phase: 2.1 },
    { cx: -215, cz: 0, rx: 22, rz: 5.5, speed: -0.10, canopy: false, phase: 0.5 },
    { cx: -242, cz: 10, rx: 14, rz: 4.0, speed: 0.10, canopy: true, phase: 3.1 },
  ];
  const boats = boatConfigs.map((cfg) => {
    const mesh = createBoat(cfg.canopy);
    scene.add(mesh);
    return { mesh, cfg };
  });

  // 4. Flying White Egrets
  const egrets = [];
  const egretFlocks = [
    { cx: 238, cy: 11, cz: 2, rx: 18, rz: 8, speed: 0.26, phase: 0 },
    { cx: 0, cy: 27, cz: -6, rx: 28, rz: 12, speed: 0.22, phase: 1.2 },
    { cx: -195, cy: 12, cz: 2, rx: 28, rz: 11, speed: 0.25, phase: 2.5 },
    { cx: -197, cy: 13, cz: 4, rx: 26, rz: 10, speed: 0.25, phase: 2.85 },
  ];
  for (const cfg of egretFlocks) {
    const egret = createEgret();
    scene.add(egret.root);
    egrets.push({ egret, cfg });
  }

  // 5. Drifting Calligraphic Silk-Mist Ribbons (雲氣繚繞)
  const mistCanvas = document.createElement('canvas');
  mistCanvas.width = 256;
  mistCanvas.height = 64;
  const mctx = mistCanvas.getContext('2d');
  const mGrad = mctx.createRadialGradient(128, 32, 6, 128, 32, 124);
  mGrad.addColorStop(0, 'rgba(246, 242, 228, 0.52)');
  mGrad.addColorStop(0.55, 'rgba(236, 232, 214, 0.22)');
  mGrad.addColorStop(1, 'rgba(236, 232, 214, 0)');
  mctx.fillStyle = mGrad;
  mctx.fillRect(0, 0, 256, 64);
  const mistTex = new THREE.CanvasTexture(mistCanvas);

  const cloudMat = new THREE.MeshBasicMaterial({
    map: mistTex,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const clouds = [];
  for (let i = 0; i < 30; i++) {
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(24 + (i % 4) * 8, 5.5 + (i % 3) * 1.5), cloudMat);
    const baseX = -275 + i * 19;
    ribbon.position.set(baseX, 8.5 + (i % 4) * 3.2, -12 - (i % 3) * 7);
    ribbon.rotation.x = -0.18;
    scene.add(ribbon);
    clouds.push({ mesh: ribbon, baseX, speed: 0.38 + (i % 3) * 0.14 });
  }

  return function updateAnimations(dt, elapsed) {
    const wfArr = wfGeo.attributes.position.array;
    for (let i = 0; i < wfCount; i++) {
      wfProgress[i] += dt * wfSpeeds[i];
      if (wfProgress[i] >= 1.0) wfProgress[i] -= 1.0;
      const p = evalWaterfallPoint(wfProgress[i], wfOffsets[i]);
      wfArr[i * 3] = p.x;
      wfArr[i * 3 + 1] = p.y;
      wfArr[i * 3 + 2] = p.z;
    }
    wfGeo.attributes.position.needsUpdate = true;

    const spArr = splashGeo.attributes.position.array;
    for (let i = 0; i < splashCount; i++) {
      splashLife[i] += dt * 1.55;
      if (splashLife[i] >= 1.0) {
        resetSplash(i);
      } else {
        splashVel[i].y -= 6.8 * dt;
        spArr[i * 3] += splashVel[i].x * dt;
        spArr[i * 3 + 1] = Math.max(WATER_LEVEL + 0.02, spArr[i * 3 + 1] + splashVel[i].y * dt);
        spArr[i * 3 + 2] += splashVel[i].z * dt;
      }
    }
    splashGeo.attributes.position.needsUpdate = true;

    for (const r of ripples) {
      r.phase = (r.phase + dt * 0.45) % 1.0;
      const s = 1.0 + r.phase * 4.5;
      r.mesh.scale.set(s, 1, s);
      r.mesh.material.opacity = (1.0 - r.phase) * 0.55;
    }

    for (const w of walkers) {
      const pts = w.waypoints;
      const segCount = pts.length - 1;
      w.progress += dt * w.speed * 0.055 * w.dir;
      if (w.progress >= 1.0) {
        w.progress = 1.0;
        w.dir = -1;
      } else if (w.progress <= 0.0) {
        w.progress = 0.0;
        w.dir = 1;
      }

      const scaled = w.progress * segCount;
      const idx = Math.min(segCount - 1, Math.floor(scaled));
      const localT = scaled - idx;
      const pA = pts[idx];
      const pB = pts[idx + 1];

      const x = THREE.MathUtils.lerp(pA.x, pB.x, localT);
      const z = THREE.MathUtils.lerp(pA.z, pB.z, localT);

      let y;
      if (w.heightMode === 'centralBridge') y = getCentralBridgeY(x);
      else if (w.heightMode === 'rightBridge') y = getRightBridgeY(x);
      else y = getTerrainHeight(x, z);

      w.figure.root.position.set(x, y, z);
      w.figure.root.rotation.y = Math.atan2((pB.x - pA.x) * w.dir, (pB.z - pA.z) * w.dir);

      w.walkPhase += dt * w.speed * 5.2;
      const swing = Math.sin(w.walkPhase) * 0.58;
      w.figure.leftLeg.rotation.x = swing;
      w.figure.rightLeg.rotation.x = -swing;
      w.figure.leftArm.rotation.x = -swing * 0.7;
      w.figure.rightArm.rotation.x = swing * 0.7;
      w.figure.body.position.y = Math.abs(Math.cos(w.walkPhase)) * 0.04;
    }

    for (const b of boats) {
      const { cx, cz, rx, rz, speed, phase } = b.cfg;
      const t = elapsed * speed + phase;
      const x = cx + Math.cos(t) * rx;
      const z = cz + Math.sin(t) * rz;
      b.mesh.position.set(x, WATER_LEVEL + Math.sin(elapsed * 2.0 + phase) * 0.04, z);
      b.mesh.rotation.y = Math.atan2(-Math.sin(t) * rx * speed, Math.cos(t) * rz * speed);
      b.mesh.rotation.z = Math.sin(elapsed * 1.6 + phase) * 0.03;
    }

    for (const e of egrets) {
      const { cx, cy, cz, rx, rz, speed, phase } = e.cfg;
      const t = elapsed * speed + phase;
      const x = cx + Math.cos(t) * rx;
      const z = cz + Math.sin(t) * rz;
      const y = cy + Math.sin(t * 2.0) * 0.8;
      e.egret.root.position.set(x, y, z);
      e.egret.root.rotation.y = Math.atan2(-Math.sin(t) * rx * speed, Math.cos(t) * rz * speed);
      const flap = Math.sin(elapsed * 9.0 + phase * 4.0) * 0.55;
      e.egret.leftWing.rotation.z = -flap;
      e.egret.rightWing.rotation.z = flap;
    }

    for (const c of clouds) {
      c.mesh.position.x = ((c.baseX + elapsed * c.speed + 290) % 580) - 290;
    }
  };
}
