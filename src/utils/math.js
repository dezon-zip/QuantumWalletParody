export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const lerp = (a, b, t) => a + (b - a) * t;

export function smoothstep(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

/** 0 before `a`, 1 after `b`, eased in between. */
export const ramp = (p, a, b) => smoothstep((p - a) / (b - a));

/** Fades in over [a, b], holds, fades out over [c, d]. */
export const pulse = (p, a, b, c, d) => Math.min(ramp(p, a, b), 1 - ramp(p, c, d));

/**
 * Builds a function that samples a list of [progress, value] keyframes.
 *
 * Smooth tracks use a cubic Hermite spline (Catmull-Rom style tangents), so a value can
 * overshoot a little between keys, which is what makes the device motion feel loose.
 * Stepped tracks just ease between neighbouring keys and never overshoot; use them for
 * things like opacity that must stay in 0..1.
 */
export function createTrack(keys, { stepped = false } = {}) {
  const last = keys.length - 1;

  return (p) => {
    if (p <= keys[0][0]) return keys[0][1];
    if (p >= keys[last][0]) return keys[last][1];

    let i = 1;
    while (keys[i][0] < p) i++;

    const [p0, v0] = keys[i - 1];
    const [p1, v1] = keys[i];
    const t = (p - p0) / (p1 - p0);

    if (stepped) return lerp(v0, v1, smoothstep(t));

    const span = p1 - p0;
    const m0 = i > 1 ? (v1 - keys[i - 2][1]) / (p1 - keys[i - 2][0]) : 0;
    const m1 = i < last ? (keys[i + 1][1] - v0) / (keys[i + 1][0] - p0) : 0;
    const t2 = t * t;
    const t3 = t2 * t;

    return (
      (2 * t3 - 3 * t2 + 1) * v0 +
      (t3 - 2 * t2 + t) * span * m0 +
      (-2 * t3 + 3 * t2) * v1 +
      (t3 - t2) * span * m1
    );
  };
}

/** Small deterministic PRNG (Park-Miller) so the shard field looks the same every load. */
export function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
