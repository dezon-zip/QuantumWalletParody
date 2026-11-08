import * as THREE from 'three';
import { ramp } from '../utils/math.js';

const SIZE = 1024;
const ICON_SIZE = 256;
const MONO = 'JetBrains Mono, monospace';

/** What the lid display shows at a given scroll progress. */
function readoutState(p, red) {
  let state;

  if (p < 0.012) {
    state = { title: '', value: '', sub: '', ring: 0, icon: '' };
  } else if (p < 0.095) {
    const f = ramp(p, 0.012, 0.09);
    state = {
      title: 'DEPLOYING',
      value: 'api@2.4.0',
      sub: `${Math.round(f * 100)}%`,
      ring: f,
      icon: '',
    };
  } else if (p < 0.38) {
    state = { title: 'DEPLOYED', value: '4 ENDPOINTS', sub: '200 OK', ring: 1, icon: 'check' };
  } else if (p < 0.6) {
    const q = ramp(p, 0.45, 0.58);
    const uptime = (49.82 + q * 50.18).toFixed(2);
    state = { title: 'UPTIME', value: `${uptime}%`, sub: '', ring: 0.5 + q * 0.5, icon: 'dot' };
  } else if (p < 0.75) {
    state = { title: 'GUARD', value: '401 DENIED', sub: 'NO TOKEN', ring: 1, icon: 'warn' };
  } else {
    state = { title: '', value: '', sub: '', ring: 0.15, icon: 'dot' };
  }

  state.alert = red > 0.5;
  return state;
}

const stateKey = (s) => [s.title, s.value, s.sub, s.ring, s.icon, s.alert].join('|');

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  return canvas;
}

function drawIcon(ctx, icon) {
  ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE);

  if (icon === 'check') {
    const g = ctx.createLinearGradient(0, 0, ICON_SIZE, ICON_SIZE);
    g.addColorStop(0, '#7fb0ff');
    g.addColorStop(1, '#2f6bff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(70, 40);
    ctx.lineTo(186, 40);
    ctx.quadraticCurveTo(216, 40, 216, 70);
    ctx.lineTo(216, 186);
    ctx.quadraticCurveTo(216, 216, 186, 216);
    ctx.lineTo(70, 216);
    ctx.quadraticCurveTo(40, 216, 40, 186);
    ctx.lineTo(40, 70);
    ctx.quadraticCurveTo(40, 40, 70, 40);
    ctx.fill();

    ctx.strokeStyle = '#06122b';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(88, 132);
    ctx.lineTo(116, 160);
    ctx.lineTo(170, 100);
    ctx.stroke();
  } else if (icon === 'warn') {
    ctx.fillStyle = '#ff4d6a';
    ctx.beginPath();
    ctx.moveTo(128, 36);
    ctx.lineTo(222, 200);
    ctx.lineTo(34, 200);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2a0710';
    ctx.fillRect(118, 90, 20, 60);
    ctx.beginPath();
    ctx.arc(128, 172, 11, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === 'dot') {
    ctx.fillStyle = 'rgba(190,215,255,0.9)';
    ctx.beginPath();
    ctx.arc(128, 128, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * The display printed on the lid plus the icon on the knob. Both are canvas textures
 * that only get redrawn when the visible state actually changes.
 *
 * @param {object} opts
 * @param {number} opts.planeSize  world size of the display plane
 * @param {number} opts.knobX      knob centre in world units, used to place the dial ring
 * @param {number} opts.knobY
 */
export function createReadout({ planeSize, knobX, knobY }) {
  const screenCanvas = makeCanvas(SIZE);
  const screenCtx = screenCanvas.getContext('2d');
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.encoding = THREE.sRGBEncoding;
  screenTexture.anisotropy = 8;

  const iconCanvas = makeCanvas(ICON_SIZE);
  const iconCtx = iconCanvas.getContext('2d');
  const iconTexture = new THREE.CanvasTexture(iconCanvas);
  iconTexture.encoding = THREE.sRGBEncoding;

  const toPx = SIZE / planeSize;
  const px = (x) => SIZE / 2 + x * toPx;
  const py = (y) => SIZE / 2 - y * toPx;

  let lastKey = '';

  function draw(s) {
    const c = screenCtx;
    const tint = s.alert ? '255,120,140' : '188,208,238';
    const color = (a) => `rgba(${tint},${a})`;

    c.clearRect(0, 0, SIZE, SIZE);
    c.textBaseline = 'alphabetic';

    // model badge + status led
    c.fillStyle = color(0.8);
    c.font = `700 26px ${MONO}`;
    c.fillText('RN-1', px(0.62), py(1.38));
    c.fillStyle = 'rgba(235,242,255,0.95)';
    c.beginPath();
    c.arc(px(1.22), py(1.43), 9, 0, Math.PI * 2);
    c.fill();

    // dial ticks around the knob, lit up to `ring`
    const ticks = 72;
    const r0 = 0.37;
    const r1 = 0.47;
    c.lineWidth = 3;
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
      c.strokeStyle = i / ticks < s.ring ? color(0.95) : color(0.2);
      c.beginPath();
      c.moveTo(px(knobX + Math.cos(a) * r0), py(knobY - Math.sin(a) * r0));
      c.lineTo(px(knobX + Math.cos(a) * r1), py(knobY - Math.sin(a) * r1));
      c.stroke();
    }

    if (s.title) {
      const tx = px(knobX + 0.62);
      const ty = py(knobY + 0.2);
      c.fillStyle = color(0.85);
      c.font = `700 22px ${MONO}`;
      c.fillText(s.title, tx, ty);
      c.fillStyle = color(0.95);
      c.font = `400 40px ${MONO}`;
      c.fillText(s.value, tx, ty + 46);
      c.fillStyle = color(0.8);
      c.font = `700 22px ${MONO}`;
      c.fillText(s.sub, tx, ty + 82);
    }
    screenTexture.needsUpdate = true;

    drawIcon(iconCtx, s.icon);
    iconTexture.needsUpdate = true;
  }

  return {
    screenTexture,
    iconTexture,

    update(p, red) {
      const state = readoutState(p, red);
      const key = stateKey(state);
      if (key === lastKey) return;
      lastKey = key;
      draw(state);
    },

    /** Force a redraw next frame, e.g. once the webfont has loaded. */
    invalidate() {
      lastKey = '';
    },
  };
}
