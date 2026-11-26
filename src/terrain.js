import * as THREE from 'three';

export const SCROLL_WIDTH = 960;
export const SCROLL_DEPTH = 160;
export const WATER_LEVEL = 0.0;

function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x, z, octaves = 4) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * (smoothNoise(x * freq, z * freq) * 2 - 1);
    freq *= 2.05;
    amp *= 0.48;
  }
  return val;
}

function ridgeFbm(x, z, octaves = 4) {
  let val = 0;
  let amp = 0.55;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    const n = 1.0 - Math.abs(smoothNoise(x * freq, z * freq) * 2 - 1);
    val += amp * n * n;
    freq *= 2.1;
    amp *= 0.5;
  }
  return val;
}

function gaussian(x, z, cx, cz, rx, rz) {
  const dx = (x - cx) / rx;
  const dz = (z - cz) / rz;
  return Math.exp(-(dx * dx + dz * dz));
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function getTerrainHeight(x, z) {
  if (x > 470 || x < -470) {
    return -1.6;
  }

  let h = -2.2 + fbm(x * 0.04, z * 0.05, 3) * 0.6;
  const ridge = ridgeFbm(x * 0.035 + 1.7, z * 0.05 - 0.9, 4);

  // 1. 卷首孤峰、赭石石台與低緩松林水村 (Part 17: +310 .. +365)
  h += 24.5 * gaussian(x, z, 345, -20, 9.0, 8.0);
  h += 14.5 * gaussian(x, z, 328, -2, 13, 9.5);
  h += 10.5 * gaussian(x, z, 314, 8, 10, 7.5);
  h += ridge * 5.0 * gaussian(x, z, 325, 3, 18, 12);
  h = THREE.MathUtils.lerp(h, 2.2, smoothstep(0.4, 0.85, gaussian(x, z, 316, 12, 6.0, 5.0)));

  // 2. 右岸木橋、松林半島與煙波水灣 (Part 15-16: +255 .. +310)
  h += 18.0 * gaussian(x, z, 292, -12, 12, 9);
  h += 13.5 * gaussian(x, z, 276, -4, 11, 8.5);
  h += 8.0 * gaussian(x, z, 260, 10, 12, 7.5);
  h += ridge * 4.5 * gaussian(x, z, 282, -5, 20, 14);

  // 3. 雙瀑山莊與右二連綿青綠層巒 (Part 13-14: +190 .. +255)
  h += 27.0 * gaussian(x, z, 228, -13, 15, 12);
  h += 22.0 * gaussian(x, z, 205, -11, 14, 11);
  h += 16.0 * gaussian(x, z, 186, -6, 12, 9.5);
  h += 11.5 * gaussian(x, z, 210, 8, 15, 8);
  h += ridge * 6.5 * gaussian(x, z, 214, -7, 28, 16);

  // 4. 右一大主山群與泊船水灣 (Part 10-12: +115 .. +190)
  h += 32.0 * gaussian(x, z, 152, -13, 14, 12);
  h += 22.5 * gaussian(x, z, 132, -8, 14, 10);
  h += 14.0 * gaussian(x, z, 118, -4, 11, 8.5);
  h += ridge * 6.0 * gaussian(x, z, 140, -8, 26, 15);
  h = THREE.MathUtils.lerp(h, 2.4, smoothstep(0.4, 0.85, gaussian(x, z, 126, 8, 6.0, 4.8)));

  // 5. 雙峰峽灣古村與中央留白水灣 (Part 08-09: +45 .. +115)
  h += 23.5 * gaussian(x, z, 88, -13, 12, 10);
  h += 16.0 * gaussian(x, z, 72, -9, 11, 8.5);
  h += ridge * 4.8 * gaussian(x, z, 80, -8, 20, 12);
  h = THREE.MathUtils.lerp(h, 2.0, smoothstep(0.4, 0.85, gaussian(x, z, 74, 9, 5.5, 4.5)));

  // 6. 正中特大主峰群、飛瀑直瀉與雙層亭橋 (Part 06-07: -45 .. +45)
  h += 46.0 * gaussian(x, z, 0, -16, 16, 14);
  h += 34.0 * gaussian(x, z, 16, -18, 13, 11.5);
  h += 30.0 * gaussian(x, z, -18, -16, 13, 11.5);
  h += 20.0 * gaussian(x, z, 34, -10, 13, 10);
  h += 19.0 * gaussian(x, z, -34, -8, 12, 9.5);
  h += 13.0 * gaussian(x, z, 4, 6, 17, 8.5);
  h += ridge * 9.0 * gaussian(x, z, 2, -10, 36, 18);
  const wfCliff = gaussian(x, z, 24, -10, 3.5, 2.8);
  h = THREE.MathUtils.lerp(h, 21.0, smoothstep(0.4, 0.85, wfCliff));
  h -= 7.5 * gaussian(x, z, 24, 1.5, 6.5, 5.0);
  h -= 6.0 * gaussian(x, z, -2, 12, 14.0, 8.0);
  h += 4.5 * gaussian(x, z, -19, 12, 6.0, 5.0);
  h += 4.5 * gaussian(x, z, 16, 12, 6.0, 5.0);

  // 7. 中左層巒山寺與古剎浮屠 (Part 05: -110 .. -45)
  h += 28.0 * gaussian(x, z, -72, -12, 14, 11);
  h += 19.0 * gaussian(x, z, -88, -9, 12, 9.5);
  h += 15.0 * gaussian(x, z, -56, -5, 11, 8.5);
  h += ridge * 5.5 * gaussian(x, z, -74, -8, 24, 15);
  h = THREE.MathUtils.lerp(h, 5.5, smoothstep(0.4, 0.85, gaussian(x, z, -76, 4, 6.0, 4.8)));

  // 8. 左中險峻青綠銳峰群探入江心 (Part 04: -175 .. -110)
  h += 24.5 * gaussian(x, z, -140, -10, 12, 9.5);
  h += 15.5 * gaussian(x, z, -124, -5, 10, 8.5);
  h += ridge * 5.0 * gaussian(x, z, -135, -7, 20, 13);

  // 9. 左端浩瀚平遠大湖與蘆洲沙嘴 (Part 02-03: -280 .. -175)
  h += 9.5 * gaussian(x, z, -205, -28, 18, 8);
  h += 10.5 * gaussian(x, z, -245, -29, 20, 8);
  h += 7.0 * gaussian(x, z, -275, -25, 16, 7);
  h += 4.2 * gaussian(x, z, -240, 14, 12, 6.0);

  // 10. 卷尾峭拔雙尖青峰與漁村 (Part 01: -365 .. -280)
  h += 32.0 * gaussian(x, z, -332, -15, 10, 10);
  h += 23.5 * gaussian(x, z, -316, -11, 9, 9);
  h += 13.0 * gaussian(x, z, -310, 6, 11, 8);
  h += ridge * 4.5 * gaussian(x, z, -325, -9, 17, 13);
  h = THREE.MathUtils.lerp(h, 2.2, smoothstep(0.4, 0.85, gaussian(x, z, -312, 10, 6.0, 5.0)));

  // Edge falloff at far ends
  const edgeX = smoothstep(420, 470, Math.abs(x));
  const edgeZ = smoothstep(SCROLL_DEPTH * 0.42, SCROLL_DEPTH * 0.5, Math.abs(z));
  h = THREE.MathUtils.lerp(h, -1.8, Math.max(edgeX, edgeZ));

  return h;
}

export function getCentralBridgeY(x) {
  const t = Math.max(0, Math.min(1, (x + 15) / 26));
  return 1.8 + Math.sin(t * Math.PI) * 2.3;
}

export function getRightBridgeY(x) {
  const t = Math.max(0, Math.min(1, (x - 200) / 24));
  return 1.6 + Math.sin(t * Math.PI) * 1.5;
}

export function createTerrainAndWater(scene) {
  const segX = 960;
  const segZ = 160;
  const geo = new THREE.PlaneGeometry(SCROLL_WIDTH, SCROLL_DEPTH, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, getTerrainHeight(pos.getX(i), pos.getZ(i)));
  }
  geo.computeVertexNormals();

  // Stylized Shanshui Material: 雙鉤墨線 (Fresnel ink outline) + 披麻斧劈皴法 + 山腰白雲 + 三遠法
  const terrainMat = new THREE.MeshStandardMaterial({
    roughness: 0.92,
    metalness: 0.02,
  });

  terrainMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vWorldPos;
         varying vec3 vWorldNormal;`
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vWorldPos;
         varying vec3 vWorldNormal;

         float tHash(vec2 p) {
           return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
         }
         float tNoise(vec2 p) {
           vec2 i = floor(p);
           vec2 f = fract(p);
           vec2 u = f * f * (3.0 - 2.0 * f);
           return mix(
             mix(tHash(i), tHash(i + vec2(1.0, 0.0)), u.x),
             mix(tHash(i + vec2(0.0, 1.0)), tHash(i + vec2(1.0, 1.0)), u.x),
             u.y
           );
         }
         float tFbm(vec2 p) {
           float v = 0.0;
           float a = 0.5;
           for (int i = 0; i < 4; i++) {
             v += a * tNoise(p);
             p *= 2.12;
             a *= 0.48;
           }
           return v;
         }`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float y = vWorldPos.y;
         float slope = 1.0 - clamp(vWorldNormal.y, 0.0, 1.0);
         float detail = tFbm(vWorldPos.xz * 0.48);
         float fine = tFbm(vWorldPos.xz * 2.1);

         // 披麻皴 & 斧劈皴 (elongated calligraphic ink-brush striations)
         float pimaCun = tNoise(vec2(vWorldPos.x * 2.8 + vWorldPos.y * 0.7, vWorldPos.y * 4.5 + vWorldPos.z * 0.9));
         float fupiCun = tNoise(vec2(vWorldPos.x * 1.2 - vWorldPos.y * 0.9, vWorldPos.y * 2.2));
         float inkStroke = smoothstep(0.35, 0.75, pimaCun * 0.65 + fupiCun * 0.35) * smoothstep(0.14, 0.52, slope);

         // Authentic 青綠山水 mineral pigment washes
         vec3 cUnderwater = vec3(0.22, 0.41, 0.40);
         vec3 cSand = vec3(0.81, 0.73, 0.52);
         vec3 cOchre = vec3(0.74, 0.60, 0.36);
         vec3 cMalachite = vec3(0.18, 0.47, 0.35);
         vec3 cCobalt = vec3(0.09, 0.31, 0.51);
         vec3 cDeepAzurite = vec3(0.07, 0.22, 0.41);
         vec3 cSumiInk = vec3(0.11, 0.10, 0.09);
         vec3 cSilkMist = vec3(0.86, 0.84, 0.75);

         vec3 col = cOchre;
         if (y < -0.1) {
           col = cUnderwater;
         } else if (y < 1.9) {
           col = mix(cSand, cOchre, smoothstep(0.0, 1.9, y) * 0.82);
           col = mix(col, cOchre * 0.86, fine * 0.3);
         } else if (y < 11.5) {
           float t = smoothstep(1.9, 11.5, y);
           col = mix(cOchre, cMalachite, smoothstep(0.0, 0.48, t));
           col = mix(col, cCobalt, smoothstep(0.32, 0.88, t) * 0.58);
           col = mix(col, cCobalt, smoothstep(0.25, 0.62, slope) * 0.65);
         } else {
           float t = smoothstep(11.5, 34.0, y);
           col = mix(cMalachite, cCobalt, smoothstep(0.0, 0.36, t));
           col = mix(col, cDeepAzurite, smoothstep(0.36, 0.85, t) * 0.88);
           col = mix(col, cDeepAzurite, detail * 0.28);
         }

         // Apply calligraphic 皴法 ink strokes
         col = mix(col, cSumiInk, inkStroke * 0.48);

         // 山腰白雲 (Painterly mist hugging mid-altitude valleys y ∈ [4.5, 13.5])
         float waistBand = smoothstep(3.5, 7.5, y) * (1.0 - smoothstep(9.5, 15.0, y));
         float mistNoise = tFbm(vWorldPos.xz * 0.09 + vec2(3.1, 1.7));
         float waistMist = waistBand * smoothstep(0.46, 0.78, mistNoise) * 0.58;
         col = mix(col, cSilkMist, waistMist);

         // 三遠法: distant back peaks fade gently into pale celadon-silk atmosphere
         float depthFade = smoothstep(-8.0, -34.0, vWorldPos.z) * 0.42;
         col = mix(col, vec3(0.68, 0.73, 0.68), depthFade);

         // Subtle silk-canvas weave
         float silkWeave = (sin(vWorldPos.x * 18.0) * 0.5 + sin(vWorldPos.z * 18.0) * 0.5) * 0.015;
         col += vec3(silkWeave);
         diffuseColor.rgb = col;`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         // Per-pixel rocky micro-relief normal perturbation using screen-space derivatives
         float bumpH = tFbm(vWorldPos.xz * 1.45 + vec2(vWorldPos.y * 0.25, 0.0));
         vec3 dPosX = dFdx(vViewPosition);
         vec3 dPosY = dFdy(vViewPosition);
         vec3 r1 = cross(dPosY, normal);
         vec3 r2 = cross(normal, dPosX);
         float det = dot(dPosX, r1);
         if (abs(det) > 1e-5) {
           float bumpStrength = mix(0.06, 0.22, smoothstep(1.5, 16.0, vWorldPos.y));
           vec3 surfGrad = sign(det) * (dFdx(bumpH) * r1 + dFdy(bumpH) * r2);
           normal = normalize(abs(det) * normal - bumpStrength * surfGrad);
         }`
      )
      .replace(
        '#include <dithering_fragment>',
        `// 雙鉤墨線 (View-dependent Fresnel ink-outline on mountain silhouettes & ridges)
         vec3 viewDir = normalize(vViewPosition);
         float fresnel = 1.0 - abs(dot(viewDir, normal));
         float inkContour = smoothstep(0.66, 0.86, fresnel) * smoothstep(0.8, 3.5, vWorldPos.y);
         gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.11, 0.10, 0.09), inkContour * 0.62);
         #include <dithering_fragment>`
      );
  };

  const terrainMesh = new THREE.Mesh(geo, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;
  scene.add(terrainMesh);

  // --- 遠山淡影 (Distant Misty Horizon Mountain Silhouettes at z = -44) ---
  const horizonCanvas = document.createElement('canvas');
  horizonCanvas.width = 2048;
  horizonCanvas.height = 256;
  const hctx = horizonCanvas.getContext('2d');
  hctx.clearRect(0, 0, 2048, 256);

  const hGrad = hctx.createLinearGradient(0, 40, 0, 256);
  hGrad.addColorStop(0, 'rgba(98, 128, 128, 0.55)');
  hGrad.addColorStop(0.55, 'rgba(145, 168, 156, 0.32)');
  hGrad.addColorStop(1, 'rgba(218, 213, 194, 0.0)');

  hctx.beginPath();
  hctx.moveTo(0, 256);
  for (let px = 0; px <= 2048; px += 4) {
    const t = px / 2048;
    const hVal =
      Math.sin(t * 19.0) * 28 +
      Math.sin(t * 43.0 + 1.2) * 16 +
      Math.cos(t * 9.0) * 22 +
      135;
    hctx.lineTo(px, hVal);
  }
  hctx.lineTo(2048, 256);
  hctx.closePath();
  hctx.fillStyle = hGrad;
  hctx.fill();

  const horizonTex = new THREE.CanvasTexture(horizonCanvas);
  const horizonPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(SCROLL_WIDTH + 80, 36),
    new THREE.MeshBasicMaterial({ map: horizonTex, transparent: true, depthWrite: false })
  );
  horizonPlane.position.set(0, 13, -50);
  scene.add(horizonPlane);

  // --- Instanced Sculpted 礬頭山石 + 墨綠苔點 (Mineral Crags & Ink-Moss Dots) ---
  const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);
  const rPos = rockGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const vx = rPos.getX(i);
    const vy = rPos.getY(i);
    const vz = rPos.getZ(i);
    const n = 0.78 + 0.36 * Math.sin(vx * 3.1 + vy * 2.7 + vz * 4.3);
    rPos.setXYZ(i, vx * n, vy * n * 1.35, vz * n);
  }
  rockGeo.computeVertexNormals();

  const rockMat = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0.03 });
  const rockCount = 520;
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInst.castShadow = true;
  rockInst.receiveShadow = true;

  const mossGeo = new THREE.DodecahedronGeometry(0.28, 0);
  const mossMat = new THREE.MeshStandardMaterial({ color: '#1b3828', roughness: 0.95 });
  const mossCount = 680;
  const mossInst = new THREE.InstancedMesh(mossGeo, mossMat, mossCount);

  const dummy = new THREE.Object3D();
  const rockColor = new THREE.Color();
  let seed = 888;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  let placed = 0;
  let mossPlaced = 0;
  for (let i = 0; i < 1600 && placed < rockCount; i++) {
    const rx = (rand() - 0.5) * 750;
    const rz = (rand() - 0.5) * 88;
    const ry = getTerrainHeight(rx, rz);
    if (ry < 0.2 || ry > 38) continue;
    if (Math.abs(rx + 2) < 16 && Math.abs(rz - 12) < 4) continue;
    if (Math.abs(rx - 200) < 15 && Math.abs(rz - 11) < 4) continue;

    dummy.position.set(rx, ry - 0.25, rz);
    dummy.rotation.set((rand() - 0.5) * 0.4, rand() * Math.PI * 2, (rand() - 0.5) * 0.4);
    dummy.scale.set(0.65 + rand() * 1.35, 0.7 + rand() * 1.85, 0.65 + rand() * 1.3);
    dummy.updateMatrix();
    rockInst.setMatrixAt(placed, dummy.matrix);

    if (ry > 12) rockColor.set('#184870');
    else if (ry > 4.0) rockColor.set('#2a684e');
    else rockColor.set('#aa8f58');
    rockColor.offsetHSL(0, 0, (rand() - 0.5) * 0.08);
    rockInst.setColorAt(placed, rockColor);
    placed++;

    // Add 苔點 (ink-moss dots) clustered near ridges & rocks
    if (mossPlaced < mossCount && ry > 3.0) {
      dummy.position.set(rx + (rand() - 0.5) * 1.4, ry + 0.12, rz + (rand() - 0.5) * 1.4);
      dummy.scale.set(0.8 + rand() * 0.7, 0.5 + rand() * 0.4, 0.8 + rand() * 0.7);
      dummy.updateMatrix();
      mossInst.setMatrixAt(mossPlaced++, dummy.matrix);
    }
  }
  rockInst.count = placed;
  rockInst.instanceMatrix.needsUpdate = true;
  if (rockInst.instanceColor) rockInst.instanceColor.needsUpdate = true;
  scene.add(rockInst);

  mossInst.count = mossPlaced;
  mossInst.instanceMatrix.needsUpdate = true;
  scene.add(mossInst);

  // --- Calligraphic Celadon-Teal River with 網巾水紋 (Ink-Wave Lines) ---
  const waterGeo = new THREE.PlaneGeometry(SCROLL_WIDTH + 140, SCROLL_DEPTH + 60, 440, 100);
  waterGeo.rotateX(-Math.PI / 2);

  const wPos = waterGeo.attributes.position;
  const depthAttr = new Float32Array(wPos.count);
  for (let i = 0; i < wPos.count; i++) {
    depthAttr[i] = WATER_LEVEL - getTerrainHeight(wPos.getX(i), wPos.getZ(i));
  }
  waterGeo.setAttribute('aDepth', new THREE.BufferAttribute(depthAttr, 1));

  const waterUniforms = {
    uTime: { value: 0 },
    uDeepColor: { value: new THREE.Color('#4a7c77') },
    uShallowColor: { value: new THREE.Color('#7ca397') },
    uSilkColor: { value: new THREE.Color('#dad3bc') },
  };

  const waterMat = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float aDepth;
      varying float vDepth;
      varying vec3 vWorldPos;
      uniform float uTime;
      void main() {
        vDepth = aDepth;
        vec3 p = position;
        float wave = sin(p.x * 0.3 + uTime * 1.3) * cos(p.z * 0.36 + uTime * 0.9) * 0.035;
        p.y += wave * clamp(aDepth, 0.0, 1.0);
        vec4 worldPos = modelMatrix * vec4(p, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      varying float vDepth;
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSilkColor;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        if (vDepth < -0.15) discard;
        vec2 uv = vWorldPos.xz * 0.2;
        float flow1 = noise(uv + vec2(uTime * 0.14, uTime * 0.04));
        float flow2 = noise(uv * 2.6 - vec2(uTime * 0.11, -uTime * 0.07));
        float inkRipple = flow1 * 0.6 + flow2 * 0.4;

        float depthFactor = smoothstep(0.0, 3.2, vDepth);
        vec3 base = mix(uShallowColor, uDeepColor, depthFactor);
        base = mix(base, uSilkColor, (1.0 - depthFactor) * 0.3 + inkRipple * 0.14);

        // Traditional 網巾水紋 (delicate horizontal ink-wave lines)
        float wangjin = smoothstep(0.84, 0.94, sin(vWorldPos.z * 3.8 + sin(vWorldPos.x * 0.45 + uTime * 0.9) * 1.4));
        base = mix(base, vec3(0.24, 0.38, 0.37), wangjin * 0.22);

        // Realistic Fresnel sky reflection & sun specular glint on animated water normal
        vec3 wNormal = normalize(vec3((flow1 - 0.5) * 0.26, 1.0, (flow2 - 0.5) * 0.26));
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, wNormal), 0.0), 3.0);
        base = mix(base, vec3(0.88, 0.85, 0.75), fresnel * 0.42);

        vec3 sunDir = normalize(vec3(0.55, 0.72, 0.42));
        vec3 halfVec = normalize(sunDir + viewDir);
        float spec = pow(max(dot(wNormal, halfVec), 0.0), 96.0);
        base += vec3(1.0, 0.95, 0.82) * spec * 0.42 * smoothstep(0.0, 0.8, vDepth);

        // Soft shoreline silk-ink bleed
        float shore = 1.0 - smoothstep(0.0, 0.55, vDepth);
        base = mix(base, vec3(0.90, 0.87, 0.78), shore * 0.48);

        float alpha = smoothstep(-0.08, 0.35, vDepth) * 0.88;
        gl_FragColor = vec4(base, alpha);
      }
    `,
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = WATER_LEVEL;
  scene.add(waterMesh);

  // --- Atmospheric Silk-Celadon Sky Dome ---
  const skyGeo = new THREE.SphereGeometry(460, 32, 16);
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
        vec3 horizon = vec3(0.86, 0.84, 0.76);
        vec3 zenith = vec3(0.73, 0.78, 0.75);
        vec3 col = mix(horizon, zenith, pow(h, 0.65));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  return { terrainMesh, waterMesh, waterUniforms };
}
