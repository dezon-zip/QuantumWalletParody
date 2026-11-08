import * as THREE from 'three';
import {
  HEX_RADIUS,
  circleEdges,
  hexagonPrism,
  hexagonPrismEdges,
  squareEdges,
} from './geometry.js';
import { createReadout } from './readout.js';
import { createCrystalRig } from './crystal.js';

const HINGE_Y = 1.9;
const TOP_Z = 0.77;
const KNOB_X = -0.9;
const KNOB_Y = -1.25;
const READOUT_SIZE = 4.6;

const BASE_COLOR = new THREE.Color(0x142238);
const TOP_COLOR = new THREE.Color(0x0f1a2c);
const ALARM_COLOR = new THREE.Color(0x2a0a10);

/*
 * The device has two looks that cross-fade:
 *  - solid: shaded physical materials, readout and knob
 *  - wire:  flat white faces with dark edge lines (blueprint chapter)
 * Every solid mesh gets a white twin sharing its geometry, and every edge set gets
 * a line material; the wire factor drives both.
 */
export function createDevice(crystalMaterial) {
  const lineMaterials = [];
  const whiteMaterials = [];

  function edges(positions, color = 0x111111) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
    lineMaterials.push(material);
    return new THREE.LineSegments(geometry, material);
  }

  function whiteTwin(mesh) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    whiteMaterials.push(material);
    const twin = new THREE.Mesh(mesh.geometry, material);
    twin.position.copy(mesh.position);
    twin.visible = false;
    return twin;
  }

  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.z = -0.41;
  root.add(body);

  // --- shell -------------------------------------------------------------
  const baseMaterial = new THREE.MeshPhysicalMaterial({
    color: BASE_COLOR,
    metalness: 0.35,
    roughness: 0.3,
    clearcoat: 0.6,
    clearcoatRoughness: 0.35,
    transparent: true,
  });
  const topMaterial = new THREE.MeshPhysicalMaterial({
    color: TOP_COLOR,
    metalness: 0.35,
    roughness: 0.3,
    clearcoat: 0.7,
    clearcoatRoughness: 0.3,
    transparent: true,
  });
  const midMaterial = new THREE.MeshStandardMaterial({
    color: 0x10283a,
    metalness: 0.1,
    roughness: 0.5,
    transparent: true,
  });

  const base = new THREE.Mesh(hexagonPrism(1, 0.34, 0.06), baseMaterial);
  const mid = new THREE.Mesh(hexagonPrism(0.97, 0.05, 0), midMaterial);
  mid.position.z = 0.4;
  const top = new THREE.Mesh(hexagonPrism(1, 0.2, 0.06), topMaterial);
  top.position.z = 0.51;

  const baseWhite = whiteTwin(base);
  const midWhite = whiteTwin(mid);
  const topWhite = whiteTwin(top);

  const baseEdges = edges(hexagonPrismEdges(1, -0.06, 0.4));
  const midEdges = edges(hexagonPrismEdges(0.97, 0.4, 0.45));
  const topEdges = edges(hexagonPrismEdges(1, 0.45, 0.77));
  const topEdgesMaterial = topEdges.material;
  const highlightMaterial = new THREE.LineBasicMaterial({ color: 0x3d7bff, transparent: true });

  const chip = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.9, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x14394f, metalness: 0.4, roughness: 0.4 })
  );
  chip.position.set(0, 0, 0.51);
  const chipEdges = edges([...squareEdges(0.45, 0.45), ...squareEdges(0.45, 0.57)]);

  body.add(base, baseWhite, baseEdges, mid, midWhite, midEdges, chip, chipEdges);

  // --- lid, hinged along the top edge -------------------------------------
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, HINGE_Y, 0);
  const lid = new THREE.Group();
  lid.position.set(0, -HINGE_Y, 0);
  lid.add(top, topWhite, topEdges);
  lidPivot.add(lid);
  body.add(lidPivot);

  // readout printed on the lid + the knob
  const readout = createReadout({ planeSize: READOUT_SIZE, knobX: KNOB_X, knobY: KNOB_Y });
  const screenMaterial = new THREE.MeshBasicMaterial({
    map: readout.screenTexture,
    transparent: true,
    toneMapped: false,
    depthWrite: false,
  });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(READOUT_SIZE, READOUT_SIZE),
    screenMaterial
  );
  screen.position.z = TOP_Z + 0.003;

  const knob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.3, 0.16, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x0a0f18,
      metalness: 0.7,
      roughness: 0.3,
      clearcoat: 0.5,
    })
  );
  knob.rotation.x = Math.PI / 2;
  knob.position.set(KNOB_X, KNOB_Y, TOP_Z + 0.08);

  const knobIcon = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 32),
    new THREE.MeshBasicMaterial({ map: readout.iconTexture, transparent: true, toneMapped: false })
  );
  knobIcon.position.set(KNOB_X, KNOB_Y, TOP_Z + 0.165);

  const knobEdges = [
    edges(circleEdges(KNOB_X, KNOB_Y, 0.3, TOP_Z + 0.16)),
    edges(circleEdges(KNOB_X, KNOB_Y, 0.44, TOP_Z + 0.01)),
  ];
  lid.add(screen, knob, knobIcon, ...knobEdges);

  // --- side details --------------------------------------------------------
  body.add(sideDecal(Math.PI * (7 / 6), 0.8, 0.4, usbPortTexture()));
  body.add(sideDecal(Math.PI * (3 / 2), 1.1, 0.34, speakerGrilleTexture()));

  // --- inside ------------------------------------------------------------
  const rig = createCrystalRig(crystalMaterial);
  body.add(rig.object);

  return {
    object: root,
    readout,

    /**
     * @param {object} s
     * @param {number} s.t         time in ms
     * @param {{rx,ry,rz,x,y,scale}} s.pose
     * @param {number} s.visible   0..1
     * @param {number} s.wire      0..1 solid -> wireframe
     * @param {number} s.explode   0..1 base and lid pull apart
     * @param {number} s.red       0..1 alarm tint
     * @param {number} s.lid       0..1 lid opening
     * @param {boolean} s.highlightTop  tint the lid outline (matching feature list item)
     */
    update({ t, pose, visible, wire, explode, red, lid: open, highlightTop }) {
      root.visible = visible > 0.01;
      root.scale.setScalar(Math.max(0.001, pose.scale * (0.3 + 0.7 * visible)));
      root.position.set(pose.x, pose.y, 0);
      root.rotation.set(pose.rx, pose.ry, pose.rz);

      base.position.z = baseWhite.position.z = baseEdges.position.z = -explode;
      lidPivot.position.z = explode + open * 1.1;
      lidPivot.rotation.x = -open * 0.55;

      const solid = 1 - wire;
      const showSolid = solid > 0.01;
      const showWire = wire > 0.01;

      baseMaterial.opacity = topMaterial.opacity = midMaterial.opacity = solid;
      base.visible = mid.visible = top.visible = showSolid;
      baseWhite.visible = midWhite.visible = topWhite.visible = showWire;
      for (const m of whiteMaterials) m.opacity = wire;
      for (const m of lineMaterials) m.opacity = wire;
      topEdges.material = highlightTop ? highlightMaterial : topEdgesMaterial;

      chip.visible = showSolid || explode > 0.05;
      screenMaterial.opacity = solid;
      screen.visible = knob.visible = knobIcon.visible = showSolid;
      knobEdges[0].visible = knobEdges[1].visible = showWire;

      baseMaterial.color.copy(BASE_COLOR).lerp(ALARM_COLOR, red * 0.9);
      topMaterial.color.copy(TOP_COLOR).lerp(ALARM_COLOR, red * 0.9);
      baseMaterial.emissive.setRGB(0.1 * red, 0, 0.02 * red);

      rig.update(open, t);
    },
  };
}

/** A flat textured plane stuck to one of the hexagon's side faces. */
function sideDecal(angle, width, height, texture) {
  const holder = new THREE.Group();
  holder.rotation.z = angle;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false })
  );
  plane.rotation.y = Math.PI / 2;
  // apothem of the hexagon + a hair so it doesn't z-fight
  plane.position.set(HEX_RADIUS * Math.cos(Math.PI / 6) + 0.075, 0, 0.19);
  holder.add(plane);
  return holder;
}

function usbPortTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#05080c';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(30, 34, 196, 60, 30);
  else ctx.rect(30, 34, 196, 60);
  ctx.fill();
  ctx.strokeStyle = '#6b819e';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#1b2431';
  ctx.fillRect(70, 58, 116, 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  return texture;
}

function speakerGrilleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#04070b';
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      ctx.beginPath();
      ctx.arc(36 + i * 23, 36 + j * 23, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  return texture;
}
