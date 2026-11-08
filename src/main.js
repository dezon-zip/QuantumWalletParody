import './styles/index.css';

import { clamp, lerp, ramp, smoothstep } from './utils/math.js';
import { tracks, overlays, featureList, dashboardReveal, shardsReveal } from './timeline.js';
import { createRenderer } from './scene/renderer.js';
import { createLights } from './scene/lights.js';
import { createDevice } from './scene/device.js';
import { createCrystalMaterial, createShardField } from './scene/crystal.js';
import { createStarfield } from './ui/stars.js';
import { createRuler } from './ui/ruler.js';
import { createOverlays, createFeatureList } from './ui/overlays.js';
import { createDashboard } from './ui/dashboard.js';
import { createIntro } from './ui/intro.js';
import { typeHeadline } from './ui/hero.js';

const $ = (id) => document.getElementById(id);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const INTRO_SETTLE_MS = 2600; // device eases from its idle pose into the timeline
const HEADLINE_DELAY_MS = 900;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

let gl;
try {
  gl = createRenderer($('gl'));
} catch (err) {
  console.error(err);
  $('intro').hidden = true;
  $('hint').textContent = 'WebGL is not available, so the 3D device can’t be shown.';
}

if (gl) start(gl);

function start({ renderer, scene, camera, resize: resizeRenderer }) {
  // --- scene -------------------------------------------------------------
  const lights = createLights(scene);
  const crystalMaterial = createCrystalMaterial();
  const device = createDevice(crystalMaterial);
  const shards = createShardField(crystalMaterial);
  scene.add(device.object, shards.object);

  // canvas text needs the webfont, so redraw the readout once it's in
  document.fonts?.ready.then(() => device.readout.invalidate());

  // --- DOM ---------------------------------------------------------------
  const ui = $('ui');
  const bg = $('bg');
  const blobs = $('blobs');
  const hint = $('hint');
  const stars = createStarfield($('stars'));
  const ruler = createRuler($('ruler'), $('rsize'));
  const overlayLayer = createOverlays(overlays);
  const features = createFeatureList($('items'), featureList);
  const dashboard = createDashboard($('phone'));

  let enteredAt = 0;
  const intro = createIntro($('intro'), {
    onEnter() {
      enteredAt = performance.now();
      const lines = [...document.querySelectorAll('.hl')];
      setTimeout(
        () => typeHeadline(lines, { instant: prefersReducedMotion }),
        prefersReducedMotion ? 0 : HEADLINE_DELAY_MS
      );
    },
  });

  const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
  $('join').addEventListener('click', (e) => {
    e.preventDefault();
    intro.enter({ sound: false });
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: scrollBehavior });
  });
  $('totop').addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  });

  // --- input -------------------------------------------------------------
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.targetX = e.clientX / window.innerWidth - 0.5;
    pointer.targetY = e.clientY / window.innerHeight - 0.5;
  });

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    resizeRenderer(w, h);
    stars.resize(w, h, Math.min(window.devicePixelRatio || 1, 2));
  }
  window.addEventListener('resize', onResize);
  onResize();

  // --- frame -------------------------------------------------------------
  let progress = 0;

  function update(t, dt) {
    const root = document.documentElement;
    const maxScroll = root.scrollHeight - window.innerHeight;
    const target = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
    // ease towards the real scroll position so wheel steps don't look jumpy
    progress += (target - progress) * (prefersReducedMotion ? 1 : 1 - Math.exp(-dt * 7));
    const p = progress;

    pointer.x += (pointer.targetX - pointer.x) * 0.05;
    pointer.y += (pointer.targetY - pointer.y) * 0.05;

    let introAmount = 0;
    if (intro.entered) {
      introAmount = prefersReducedMotion
        ? 1
        : smoothstep((performance.now() - enteredAt) / INTRO_SETTLE_MS);
    }

    // shrink the device on narrow / portrait screens
    const fit = Math.min(1, window.innerWidth / window.innerHeight / 1.25);

    const wire = tracks.wire(p);
    const white = tracks.white(p);
    const explode = tracks.explode(p);
    const red = tracks.red(p);
    const x = tracks.x(p) * fit;
    const y = tracks.y(p);

    device.update({
      t,
      pose: {
        rx: tracks.rx(p) * introAmount + pointer.y * 0.06,
        ry: tracks.ry(p) * introAmount + pointer.x * 0.1,
        rz: tracks.rz(p) * introAmount,
        x,
        y,
        scale: lerp(1, tracks.scale(p) * 0.82, introAmount) * fit,
      },
      visible: tracks.visible(p),
      wire,
      explode,
      red,
      lid: tracks.lid(p),
      // first feature item ("Component-grade shell") is on while exploded
      highlightTop: explode > 0.6 && p < 0.265,
    });
    device.readout.update(p, red);
    lights.update({ white, red, x, y });

    const shardAmount = ramp(p, ...shardsReveal);
    crystalMaterial.uniforms.uAlpha.value = Math.max(shardAmount, tracks.lid(p));
    crystalMaterial.uniforms.uTone.value = shardAmount;
    shards.update(shardAmount, p, t);

    // background goes from near-black to off-white and the ink flips with it
    bg.style.backgroundColor = `rgb(${Math.round(lerp(2, 242, white))},${Math.round(lerp(6, 243, white))},${Math.round(lerp(12, 244, white))})`;
    blobs.style.opacity = (1 - white).toFixed(3);
    ui.style.setProperty(
      '--ink',
      `rgb(${Math.round(lerp(232, 17, white))},${Math.round(lerp(240, 17, white))},${Math.round(lerp(255, 20, white))})`
    );
    ui.style.setProperty('--hair', white > 0.5 ? 'rgba(17,17,20,0.12)' : 'rgba(232,240,255,0.1)');
    stars.draw(t, 1 - white, p);

    ruler.update(tracks.bundleSize(p));
    hint.style.opacity = (1 - ramp(p, 0.004, 0.02)).toFixed(2);

    overlayLayer.update(p);
    features.update(p);
    dashboard.update(ramp(p, ...dashboardReveal));
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(now, dt);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
