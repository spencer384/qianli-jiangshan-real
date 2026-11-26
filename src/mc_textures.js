import * as THREE from 'three';

function makeRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createPixelTexture(size, painter, { repeatX = 1, repeatY = 1 } = {}) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  painter(ctx, size);

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapLinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function paintNoiseBlock(ctx, size, palette, seed, extraFn = null) {
  const rand = makeRand(seed);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = Math.floor(rand() * palette.length);
      ctx.fillStyle = palette[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  if (extraFn) extraFn(ctx, size, rand);
}

export function createBlockTextures() {
  return {
    sand: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#dfd2a8', '#d5c694', '#e6dbb6', '#cbb985'], 101, (c, sz, r) => {
        for (let i = 0; i < 40; i++) {
          c.fillStyle = r() > 0.5 ? '#eddcb0' : '#bfa972';
          c.fillRect(Math.floor(r() * sz), Math.floor(r() * sz), 2, 1);
        }
      })
    ),
    ochre: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#a8834c', '#98733f', '#b59057', '#896634'], 202, (c, sz, r) => {
        for (let i = 0; i < 48; i++) {
          c.fillStyle = r() > 0.5 ? '#705127' : '#c6a46c';
          c.fillRect(Math.floor(r() * sz), Math.floor(r() * sz), r() > 0.5 ? 2 : 1, 1);
        }
      })
    ),
    malachite: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#2e7353', '#36825f', '#276347', '#42916c'], 303, (c, sz, r) => {
        for (let i = 0; i < 65; i++) {
          c.fillStyle = r() > 0.4 ? '#4fa87e' : '#1d4d37';
          c.fillRect(Math.floor(r() * sz), Math.floor(r() * sz), 2, 1);
        }
      })
    ),
    azurite: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#1c527a', '#215f8c', '#174669', '#2b6f9e'], 404, (c, sz, r) => {
        for (let i = 0; i < 28; i++) {
          const x = Math.floor(r() * (sz - 4));
          const y = Math.floor(r() * sz);
          c.fillStyle = '#113552';
          c.fillRect(x, y, 3, 1);
        }
      })
    ),
    lapisPeak: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#143b68', '#194980', '#0f2f54', '#225996'], 505, (c, sz, r) => {
        for (let i = 0; i < 36; i++) {
          c.fillStyle = '#3375bd';
          c.fillRect(Math.floor(r() * sz), Math.floor(r() * sz), 2, 1);
        }
      })
    ),
    underwater: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#39635f', '#42706b', '#315753', '#4d7d78'], 606)
    ),
    water: createPixelTexture(
      32,
      (ctx, s) =>
        paintNoiseBlock(ctx, s, ['#3b858c', '#45949b', '#34787e', '#55a6ad'], 707, (c) => {
          c.fillStyle = 'rgba(220, 245, 242, 0.38)';
          c.fillRect(3, 5, 7, 1);
          c.fillRect(18, 14, 8, 1);
          c.fillRect(7, 24, 6, 1);
          c.fillRect(21, 27, 5, 1);
        }),
      { repeatX: 220, repeatY: 44 }
    ),
    planks: createPixelTexture(32, (ctx, s) => {
      paintNoiseBlock(ctx, s, ['#9e7246', '#94693e', '#a97b4d'], 808);
      ctx.fillStyle = '#6c4928';
      for (let y = 0; y < s; y += 8) ctx.fillRect(0, y, s, 1);
      ctx.fillRect(14, 0, 1, 8);
      ctx.fillRect(26, 8, 1, 8);
      ctx.fillRect(6, 16, 1, 8);
      ctx.fillRect(20, 24, 1, 8);
    }),
    log: createPixelTexture(32, (ctx, s) => {
      paintNoiseBlock(ctx, s, ['#583b24', '#4d331e', '#634329'], 909);
      ctx.fillStyle = '#382313';
      for (let x = 3; x < s; x += 6) ctx.fillRect(x, 0, 1, s);
    }),
    darkTile: createPixelTexture(32, (ctx, s) => {
      paintNoiseBlock(ctx, s, ['#2e3a42', '#263138', '#36444d'], 1010);
      ctx.fillStyle = '#1b2328';
      for (let y = 0; y < s; y += 8) ctx.fillRect(0, y, s, 1);
      for (let x = 0; x < s; x += 8) ctx.fillRect(x, 0, 1, s);
    }),
    thatch: createPixelTexture(32, (ctx, s) => {
      paintNoiseBlock(ctx, s, ['#bda15d', '#b0934f', '#c7ad6b'], 1111);
      ctx.fillStyle = '#8e7337';
      for (let y = 3; y < s; y += 6) ctx.fillRect(0, y, s, 1);
    }),
    wall: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#efe8d5', '#e7dec8', '#f5efe0'], 1212)
    ),
    vermilion: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#a83626', '#992e20', '#b53f2f'], 1313)
    ),
    gold: createPixelTexture(32, (ctx, s) => {
      paintNoiseBlock(ctx, s, ['#e8bf43', '#dfb134', '#f2cf5c'], 1414);
      ctx.fillStyle = '#b5871b';
      ctx.strokeRect(0.5, 0.5, s - 1, s - 1);
    }),
    glowstone: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#f7d97e', '#f2c152', '#ffeaa3', '#d69731'], 1515)
    ),
    pineLeaves: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#1f543b', '#266346', '#18442f', '#2e7352'], 1616)
    ),
    jadeLeaves: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#37784d', '#418a5a', '#2d6640', '#4d9c68'], 1717)
    ),
    autumnLeaves: createPixelTexture(32, (ctx, s) =>
      paintNoiseBlock(ctx, s, ['#bf632c', '#cf7136', '#a85220', '#de8447'], 1818)
    ),
    bamboo: createPixelTexture(32, (ctx, s) => {
      paintNoiseBlock(ctx, s, ['#558c44', '#4a7c3a', '#639e50'], 1919);
      ctx.fillStyle = '#365c29';
      ctx.fillRect(0, 15, s, 1);
      ctx.fillRect(0, 31, s, 1);
    }),
    stoneBrick: createPixelTexture(32, (ctx, s) => {
      paintNoiseBlock(ctx, s, ['#87837a', '#7c7870', '#918d84'], 2020);
      ctx.fillStyle = '#5c5952';
      ctx.fillRect(0, 0, s, 1);
      ctx.fillRect(0, 16, s, 1);
      ctx.fillRect(16, 0, 1, 16);
      ctx.fillRect(0, 16, 1, 16);
    }),
  };
}
