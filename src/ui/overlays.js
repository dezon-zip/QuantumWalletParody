import { pulse } from '../utils/math.js';

const RISE_PX = 24;
const SLIDE_PX = 60;

function transformFor(motion, v) {
  const hidden = 1 - v;
  switch (motion) {
    case 'none':
      return null;
    case 'phone':
      return `translateY(${-50 + hidden * 14}%)`;
    case 'from-left':
      return `translateX(${-hidden * SLIDE_PX}px)`;
    case 'from-right':
      return `translateX(${hidden * SLIDE_PX}px)`;
    default:
      return `translateY(${(hidden * RISE_PX).toFixed(1)}px)`;
  }
}

/** Fades the chapter overlays in and out according to their timeline windows. */
export function createOverlays(config) {
  const items = config.map((entry) => ({
    ...entry,
    el: document.getElementById(entry.id),
  }));

  return {
    update(p) {
      for (const { el, window: w, motion, motionWindow } of items) {
        const v = pulse(p, ...w);
        el.style.opacity = v.toFixed(3);
        el.style.visibility = v < 0.01 ? 'hidden' : 'visible';

        const mv = motionWindow ? pulse(p, ...motionWindow) : v;
        const transform = transformFor(motion, mv);
        if (transform) el.style.transform = transform;
      }
    },
  };
}

/** Feature list where each line lights up in turn. */
export function createFeatureList(listEl, { start, stagger, end }) {
  const entries = [...listEl.children];

  return {
    update(p) {
      entries.forEach((el, i) => {
        el.classList.toggle('on', p > start + i * stagger && p < end);
      });
    },
  };
}
