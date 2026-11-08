import * as THREE from 'three';
import { crystalGeometry } from './geometry.js';
import { seededRandom } from '../utils/math.js';

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

// Fresnel-ish glass. uTone shifts from cyan (inside the device) to violet (finale shards).
const fragmentShader = /* glsl */ `
  uniform float uAlpha;
  uniform float uTone;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    float fresnel = pow(1.0 - abs(dot(n, v)), 1.6);
    float light = 0.55 + 0.45 * dot(n, normalize(vec3(0.4, 0.8, 0.5)));

    vec3 cool = mix(vec3(0.35, 0.9, 1.0), vec3(0.2, 0.5, 1.0), fresnel);
    vec3 warm = mix(vec3(0.45, 0.8, 1.0), vec3(0.65, 0.5, 1.0), fresnel);
    vec3 color = mix(cool, warm, uTone) * light;
    color += vec3(0.9, 0.55, 1.0) * pow(fresnel, 3.0) * 0.5;

    gl_FragColor = vec4(color, (0.78 + 0.2 * fresnel) * uAlpha);
  }
`;

export function createCrystalMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: { uAlpha: { value: 1 }, uTone: { value: 0 } },
    vertexShader,
    fragmentShader,
  });
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(160,240,255,1)');
  g.addColorStop(0.3, 'rgba(70,190,255,0.5)');
  g.addColorStop(1, 'rgba(40,120,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

/** The glowing crystal and rings sitting inside the device, seen when the lid opens. */
export function createCrystalRig(material) {
  const rig = new THREE.Group();
  rig.position.set(0, 0, 0.47);
  rig.visible = false;

  const well = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.06, 64),
    new THREE.MeshStandardMaterial({ color: 0x060b14, metalness: 0.6, roughness: 0.4 })
  );
  well.rotation.x = Math.PI / 2;

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.045, 12, 96),
    new THREE.MeshStandardMaterial({ color: 0xcfe3ff, metalness: 0.9, roughness: 0.25 })
  );
  outerRing.position.z = 0.04;

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.03, 12, 96),
    new THREE.MeshStandardMaterial({
      color: 0x8fd6ff,
      metalness: 0.9,
      roughness: 0.3,
      emissive: 0x1a6bff,
      emissiveIntensity: 0.6,
    })
  );
  innerRing.position.z = 0.6;
  innerRing.rotation.x = 0.35;

  const crystal = new THREE.Mesh(crystalGeometry(1.7), material);
  crystal.scale.setScalar(0.7);
  crystal.rotation.x = Math.PI / 2;
  crystal.position.z = 0.6;

  const light = new THREE.PointLight(0x66ddff, 0, 8);
  light.position.set(0, 0, 1.6);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  );
  glow.scale.set(3.2, 3.2, 1);
  glow.position.z = 0.6;

  rig.add(well, outerRing, innerRing, crystal, light, glow);

  const studMaterial = new THREE.MeshStandardMaterial({
    color: 0xdfeaff,
    metalness: 0.9,
    roughness: 0.2,
  });
  const studGeometry = new THREE.SphereGeometry(0.11, 16, 12);
  for (const [x, y] of [
    [1.45, 0],
    [-1.45, 0],
    [0.72, 1.25],
    [-0.72, -1.25],
  ]) {
    const stud = new THREE.Mesh(studGeometry, studMaterial);
    stud.position.set(x, y, 0.12);
    rig.add(stud);
  }

  return {
    object: rig,

    /** @param {number} open 0..1 how far the lid is open; @param {number} t time in ms */
    update(open, t) {
      rig.visible = open > 0.02;
      if (!rig.visible) return;

      rig.scale.setScalar(0.3 + 0.7 * open);
      crystal.rotation.z = t * 0.0006;
      crystal.rotation.y = t * 0.0004;
      innerRing.rotation.z = t * 0.0005;
      innerRing.rotation.y = Math.sin(t * 0.0006) * 0.4;
      outerRing.rotation.z = -t * 0.0002;
      light.intensity = 5 * open;
      glow.material.opacity = open * (0.85 + 0.15 * Math.sin(t * 0.004));
    },
  };
}

/** Field of floating crystal shards for the finale. */
export function createShardField(material, count = 46) {
  const group = new THREE.Group();
  group.visible = false;

  const rnd = seededRandom(7);
  const shards = [];

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(crystalGeometry(1 + rnd() * 5), material);
    const s = 0.3 + rnd() * 0.75;
    mesh.scale.set(s, s * (0.9 + rnd() * 0.8), s);
    mesh.position.set((rnd() - 0.5) * 13, (rnd() - 0.5) * 11, -5 + rnd() * 6);
    mesh.userData = {
      spinX: (rnd() - 0.5) * 1.2,
      spinY: (rnd() - 0.5) * 1.2,
      offset: rnd() * 6,
      speed: 0.5 + rnd() * 1.4,
    };
    group.add(mesh);
    shards.push(mesh);
  }

  return {
    object: group,

    update(amount, p, t) {
      group.visible = amount > 0.01;
      if (!group.visible) return;

      // drift upward as you keep scrolling
      group.position.y = (p - 0.86) * 34 - 2;
      for (const m of shards) {
        const u = m.userData;
        m.rotation.set(
          u.offset + t * 0.0003 * u.speed + p * 14 * u.spinX,
          u.offset * 2 + t * 0.0004 * u.speed + p * 10 * u.spinY,
          0
        );
      }
    },
  };
}
