const STAR_COUNT = 150;

/** Twinkling starfield that parallaxes with scroll. Drawn on a 2D canvas behind the scene. */
export function createStarfield(canvas) {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;

  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    depth: 0.2 + Math.random() * 0.8,
    radius: 0.5 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
  }));

  return {
    resize(w, h, dpr) {
      width = w;
      height = h;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    /**
     * @param {number} t        time in ms
     * @param {number} alpha    overall visibility, 0 hides the field
     * @param {number} progress scroll progress, moves the stars up
     */
    draw(t, alpha, progress) {
      ctx.clearRect(0, 0, width, height);
      if (alpha < 0.02) return;

      for (const s of stars) {
        const y = (((s.y * height - progress * 3000 * s.depth) % height) + height) % height;
        const twinkle = 0.5 + 0.5 * Math.sin(t * 0.001 * (0.5 + s.depth) + s.phase);
        const a = alpha * (0.2 + 0.55 * twinkle * s.depth);

        ctx.fillStyle = `rgba(120,220,235,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x * width, y, s.radius * s.depth, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
