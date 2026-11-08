import { clamp } from '../utils/math.js';

const LABEL_COUNT = 9;
const STEP = 25; // kB between tick lines

const formatTick = (kb) => `${kb.toLocaleString('en-US')} kB`;

function formatSize(kb) {
  if (kb >= 1000) return `${(kb / 1000).toFixed(2)} MB`;
  return `${Math.round(kb)} kB`;
}

/** Bundle size ruler on the left edge. The marker stays centred and the ticks slide past it. */
export function createRuler(rulerEl, readoutEl) {
  const marker = rulerEl.querySelector('#rmark');
  const lines = [];

  for (let i = 0; i < LABEL_COUNT; i++) {
    const line = document.createElement('div');
    line.className = 'rl';
    line.appendChild(document.createElement('b'));
    rulerEl.insertBefore(line, marker);
    lines.push(line);
  }

  return {
    update(sizeKb) {
      // the spline can dip a hair below zero at the end; a bundle can't
      const size = Math.max(0, sizeKb);
      const gap = Math.max(96, window.innerHeight * 0.15);
      const centre = window.innerHeight / 2;
      const first = Math.floor(size / STEP) - Math.floor(LABEL_COUNT / 2);

      readoutEl.textContent = formatSize(size);

      lines.forEach((line, i) => {
        const value = (first + i) * STEP;
        const y = centre + ((size - value) / STEP) * gap;
        // fade out the ticks that would collide with the marker
        const distance = Math.abs(y - centre) / (gap * 0.75);

        line.style.top = `${y}px`;
        line.firstChild.textContent = formatTick(value);
        line.style.opacity = value < 0 ? '0' : clamp(distance, 0, 1).toFixed(2);
      });
    },
  };
}
