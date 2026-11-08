import { createTrack } from './utils/math.js';

/*
 * Everything on the page is a function of scroll progress p (0..1).
 *
 * Rough chapter map:
 *   0.00  boot / deploy readout
 *   0.12  wireframe + white background (blueprint, "post-boilerplate" panel)
 *   0.20  exploded view, feature list
 *   0.33  phone dashboard
 *   0.40  "impenetrable defense", threats
 *   0.60  red guard mode
 *   0.70  lid opens, crystal rig
 *   0.86  shards, white again, outro
 */

const stepped = { stepped: true };

// prettier-ignore
export const tracks = {
  // device pose
  rx: createTrack([
    [0, -1.0], [0.075, 0], [0.19, 0], [0.235, -1.5708], [0.3, -1.5708], [0.345, -1.0],
    [0.4, -0.62], [0.5, -0.42], [0.575, -0.06], [0.62, -0.38], [0.7, -0.5], [0.76, -0.62],
    [0.84, -0.5], [0.9, -0.9], [1, -1.2],
  ]),
  ry: createTrack([
    [0, 0], [0.19, 0], [0.3, 0], [0.4, 0.55], [0.5, 0.18], [0.575, 0], [0.66, -0.3],
    [0.76, 0.22], [0.84, 0.1], [1, 0.5],
  ]),
  rz: createTrack([
    [0, 0.25], [0.075, 0], [0.3, 0], [0.4, -0.25], [0.5, 0.1], [0.575, 0], [0.66, 0.1],
    [0.84, 0.2], [1, 0.6],
  ]),
  scale: createTrack([
    [0, 1.0], [0.19, 1.0], [0.235, 1.05], [0.3, 1.05], [0.4, 1.9], [0.5, 1.5], [0.575, 1.45],
    [0.66, 1.25], [0.72, 1.2], [0.8, 1.3], [0.86, 1.2], [0.92, 0.6], [1, 0.3],
  ]),
  x: createTrack([
    [0, 0], [0.38, 0], [0.4, -2.8], [0.5, -0.6], [0.575, 0], [0.66, 0.0], [0.72, 0.6], [0.8, 0],
    [1, 0],
  ]),
  y: createTrack([
    [0, 0.1], [0.38, 0.1], [0.4, -0.5], [0.5, 0.1], [0.575, -0.1], [0.66, -0.2], [0.8, -0.3],
    [0.9, -1.0], [1, -3],
  ]),

  // device states (0..1)
  visible: createTrack(
    [[0, 1], [0.3, 1], [0.335, 0], [0.385, 0], [0.405, 1], [0.84, 1], [0.895, 0], [1, 0]],
    stepped
  ),
  wire: createTrack([[0, 0], [0.115, 0], [0.14, 1], [0.3, 1], [0.325, 0], [1, 0]], stepped),
  explode: createTrack([[0, 0], [0.2, 0], [0.25, 1], [0.3, 1], [0.325, 0]], stepped),
  red: createTrack([[0, 0], [0.605, 0], [0.64, 1], [0.7, 1], [0.735, 0]], stepped),
  lid: createTrack([[0, 0], [0.7, 0], [0.76, 1], [0.85, 1], [0.89, 0]], stepped),

  // page background: 0 = dark, 1 = white
  white: createTrack(
    [[0, 0], [0.118, 0], [0.145, 1], [0.31, 1], [0.335, 0], [0.86, 0], [0.9, 1], [1, 1]],
    stepped
  ),

  // the ruler on the left: bundle size in kB, shrinking all the way to nothing
  bundleSize: createTrack([
    [0, 1440], [0.08, 1350], [0.135, 1130], [0.33, 890], [0.41, 730], [0.49, 660], [0.575, 605],
    [0.66, 400], [0.74, 220], [0.82, 130], [0.9, 0], [1, 0],
  ]),
};

/**
 * DOM overlays: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd].
 * `motion` picks how the element moves while fading; `motionWindow` lets the
 * movement run on a slightly different window than the opacity.
 */
const DEFENSE = [0.4, 0.425, 0.455, 0.475];
const BEST_DEFENSE = [0.625, 0.65, 0.69, 0.715];

export const overlays = [
  { id: 'bp', window: [0.135, 0.15, 0.2, 0.235], motion: 'none' },
  { id: 'pa', window: [0.15, 0.17, 0.205, 0.225] },
  { id: 'items', window: [0.235, 0.25, 0.3, 0.318], motion: 'none' },
  { id: 'phone', window: [0.33, 0.348, 0.385, 0.402], motion: 'phone' },
  { id: 'dl', window: DEFENSE, motion: 'from-left' },
  { id: 'dr', window: [0.4, 0.43, 0.455, 0.475], motion: 'from-right', motionWindow: DEFENSE },
  { id: 'pe', window: [0.48, 0.5, 0.585, 0.605] },
  { id: 't1', window: [0.5, 0.515, 0.535, 0.55] },
  { id: 't2', window: [0.54, 0.555, 0.57, 0.585] },
  { id: 't3', window: [0.575, 0.59, 0.6, 0.615] },
  { id: 'fl', window: BEST_DEFENSE, motion: 'from-left' },
  {
    id: 'fr',
    window: [0.64, 0.665, 0.69, 0.715],
    motion: 'from-right',
    motionWindow: BEST_DEFENSE,
  },
  { id: 'pg', window: [0.795, 0.82, 0.86, 0.885] },
  { id: 'ph', window: [0.935, 0.96, 1.01, 1.02] },
];

/** Feature list items light up one after another inside this range. */
export const featureList = { start: 0.245, stagger: 0.022, end: 0.318 };

/** Dashboard counters, bars and sparklines animate in over this range. */
export const dashboardReveal = [0.345, 0.378];

/** Finale crystal shards fade in over this range. */
export const shardsReveal = [0.86, 0.92];
