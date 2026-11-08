import * as THREE from 'three';

export const HEX_RADIUS = 2.2;
const HEX_CORNER = 0.2; // how much of each edge the rounded corner eats

/**
 * Rounded hexagon outline. Vertices sit at 0°, 60°, ... so the points face left and right.
 * Each corner is a quadratic curve; `corners` holds the index of each curve's midpoint,
 * used to draw the vertical edges of the wireframe.
 */
export function hexagonPoints(radius, cornerAmount = HEX_CORNER, segments = 8) {
  const vertices = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    vertices.push(new THREE.Vector2(Math.cos(a) * radius, Math.sin(a) * radius));
  }

  const points = [];
  const corners = [];

  for (let i = 0; i < 6; i++) {
    const prev = vertices[(i + 5) % 6];
    const corner = vertices[i];
    const next = vertices[(i + 1) % 6];
    const start = corner.clone().lerp(prev, cornerAmount);
    const end = corner.clone().lerp(next, cornerAmount);

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const u = 1 - t;
      if (j === segments / 2) corners.push(points.length);
      points.push(
        new THREE.Vector2(
          u * u * start.x + 2 * u * t * corner.x + t * t * end.x,
          u * u * start.y + 2 * u * t * corner.y + t * t * end.y
        )
      );
    }
  }

  return { points, corners };
}

export function hexagonPrism(scale, depth, bevel) {
  const { points } = hexagonPoints(HEX_RADIUS * scale);
  return new THREE.ExtrudeGeometry(new THREE.Shape(points), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 4,
  });
}

/** Line positions for a hexagonal prism: top loop, bottom loop and the six corner edges. */
export function hexagonPrismEdges(scale, z0, z1) {
  const { points, corners } = hexagonPoints(HEX_RADIUS * scale);
  const out = [];

  for (const z of [z0, z1]) {
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      out.push(a.x, a.y, z, b.x, b.y, z);
    }
  }
  for (const i of corners) {
    const p = points[i];
    out.push(p.x, p.y, z0, p.x, p.y, z1);
  }

  return out;
}

export function circleEdges(cx, cy, r, z, segments = 48) {
  const out = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const b = ((i + 1) / segments) * Math.PI * 2;
    out.push(
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
      z,
      cx + Math.cos(b) * r,
      cy + Math.sin(b) * r,
      z
    );
  }
  return out;
}

export function squareEdges(half, z) {
  const c = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ];
  const out = [];
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = c[i];
    const [bx, by] = c[(i + 1) % 4];
    out.push(ax, ay, z, bx, by, z);
  }
  return out;
}

/** Slightly squashed, randomly jittered octahedron. */
export function crystalGeometry(seed = 1) {
  const geo = new THREE.OctahedronGeometry(1, 0);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let r = Math.sin(i * 12.9898 * seed) * 43758.5453;
    r -= Math.floor(r);
    pos.setXYZ(
      i,
      pos.getX(i) * (0.55 + r * 0.1),
      pos.getY(i) * (1 + (r - 0.5) * 0.25),
      pos.getZ(i) * (0.55 + r * 0.1)
    );
  }

  // polyhedron geometry is already non-indexed, so this gives flat facets
  geo.computeVertexNormals();
  return geo;
}
