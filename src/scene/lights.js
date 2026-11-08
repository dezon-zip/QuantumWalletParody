import * as THREE from 'three';

const KEY_INTENSITY = 1.5;
const RIM_INTENSITY = 2.2;
const RED_INTENSITY = 2.2;

export function createLights(scene) {
  scene.add(new THREE.HemisphereLight(0x6fa8d0, 0x0a1220, 0.55));
  scene.add(new THREE.AmbientLight(0x4060a0, 0.35));

  const fill = new THREE.DirectionalLight(0x3f70e0, 0.8);
  fill.position.set(5, -2, 5);

  const key = new THREE.DirectionalLight(0xbfe4ff, KEY_INTENSITY);
  key.position.set(-4, 5, 6);

  const rim = new THREE.PointLight(0x2a6cff, RIM_INTENSITY, 30);
  rim.position.set(4, -3, -2);

  // only switched on during the "guard" chapter
  const alarm = new THREE.PointLight(0xff2040, 0, 18);
  alarm.position.set(0, -3, 2);

  scene.add(fill, key, rim, alarm);

  return {
    /**
     * @param {object} s
     * @param {number} s.white  0..1, background going white dims the key light
     * @param {number} s.red    0..1, guard chapter
     * @param {number} s.x      device x, so the red glow follows it
     * @param {number} s.y      device y
     */
    update({ white, red, x, y }) {
      key.intensity = KEY_INTENSITY * (0.4 + 0.6 * (1 - white)) * (1 - red * 0.75);
      rim.intensity = RIM_INTENSITY * (1 - red * 0.6);
      alarm.intensity = red * RED_INTENSITY;
      alarm.position.set(x, y - 2.4, 2);
    },
  };
}
