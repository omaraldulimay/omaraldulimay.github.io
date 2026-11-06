// Small 3D robot that drops onto the hero line once it has drawn, then sits there.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const hair = document.querySelector('.hair');
const canvas = document.querySelector('.bot3d');
if (hair && canvas) start();

function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dark = matchMedia('(prefers-color-scheme: dark)');

  // Orthographic, level camera: world y=0 maps exactly onto the line.
  const TOP = 2.5, BOTTOM = -0.9, HALF_W = 1.3;
  const camera = new THREE.OrthographicCamera(-HALF_W, HALF_W, TOP, BOTTOM, 0.1, 50);
  camera.position.set(0, 0, 10);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7f93a8, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xdff2ff, 1.4); rim.position.set(-4, 2, -3); scene.add(rim);

  const shell = new THREE.MeshPhysicalMaterial({ color: 0x1f3c6e, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const joint = new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.4, metalness: 0.05 });
  const visor = new THREE.MeshPhysicalMaterial({ color: 0x0b1424, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.4 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.4 });
  const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
  const capsule = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 16);

  const bot = new THREE.Group();
  bot.rotation.y = -0.38;
  scene.add(bot);

  // torso
  bot.add(mesh(new RoundedBoxGeometry(1.0, 0.85, 0.8, 6, 0.28), shell, 0, 0.43, 0));
  const chest = mesh(new THREE.SphereGeometry(0.075, 20, 20), orange, 0, 0.52, 0.41);
  bot.add(chest);

  // head on a neck pivot
  const head = new THREE.Group(); head.position.set(0, 0.86, 0); bot.add(head);
  head.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.12, 20), joint, 0, 0.02, 0));
  head.add(mesh(new RoundedBoxGeometry(1.3, 0.92, 0.95, 6, 0.32), shell, 0, 0.52, 0));
  head.add(mesh(new RoundedBoxGeometry(1.06, 0.58, 0.12, 4, 0.08), visor, 0, 0.52, 0.44));
  const eyes = new THREE.Group(); eyes.position.set(0, 0.54, 0.5); head.add(eyes);
  for (const x of [-0.22, 0.22]) { const e = mesh(new THREE.SphereGeometry(0.095, 20, 20), eyeMat, x, 0, 0); e.scale.set(1, 1.25, 0.45); eyes.add(e); }
  for (const x of [-0.68, 0.68]) { const ear = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 20), joint, x, 0.52, 0); ear.rotation.z = Math.PI / 2; head.add(ear); }
  head.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 10), joint, 0, 1.1, 0));
  const tip = mesh(new THREE.SphereGeometry(0.085, 20, 20), orange, 0, 1.28, 0); head.add(tip);

  // arms, hands resting next to the hips
  const arms = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.6, 0.7, 0); a.rotation.z = s * 0.12; a.rotation.x = -0.15;
    a.add(mesh(capsule(0.11, 0.38), shell, 0, -0.28, 0));
    a.add(mesh(new THREE.SphereGeometry(0.14, 20, 20), joint, 0, -0.58, 0));
    bot.add(a); arms.push(a);
  }

  // legs: thighs forward, shins dangling over the line
  const knees = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.25, 0.13, 0.15); bot.add(hip);
    const thigh = mesh(capsule(0.14, 0.3), shell, 0, 0, 0.22); thigh.rotation.x = Math.PI / 2; hip.add(thigh);
    const knee = new THREE.Group(); knee.position.set(0, 0, 0.45); hip.add(knee);
    knee.add(mesh(new THREE.SphereGeometry(0.13, 20, 20), joint));
    knee.add(mesh(capsule(0.12, 0.3), shell, 0, -0.28, 0));
    knee.add(mesh(new RoundedBoxGeometry(0.3, 0.16, 0.42, 4, 0.07), joint, 0, -0.56, 0.07));
    knees.push(knee);
  }

  function size() {
    // clientWidth ignores the line's scaleX draw animation
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  }
  if (getComputedStyle(canvas).position !== 'absolute') { canvas.remove(); return; }
  size(); addEventListener('resize', size);

  // look towards the pointer
  let tx = 0, ty = 0, hasPointer = false;
  addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
    ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.3)) / (innerHeight / 2)));
    hasPointer = true;
  }, { passive: true });

  // drop in once the line has drawn
  let landedAt = null;
  const land = () => { if (landedAt === null) { size(); landedAt = performance.now(); canvas.classList.add('on'); } };
  hair.addEventListener('animationend', land, { once: true });
  setTimeout(land, 2300);

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  let nextBlink = performance.now() + 2500, blinkUntil = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || landedAt === null) return;
    const t = now / 1000, since = (now - landedAt) / 1000;

    // fall with a small bounce and squash
    let y = 0, squash = 1;
    if (!still && since < 0.9) {
      if (since < 0.38) { const k = since / 0.38; y = 2.6 * (1 - k * k); }
      else { const k = (since - 0.38) / 0.52; y = Math.abs(Math.sin(k * Math.PI)) * 0.18 * (1 - k); squash = 1 - 0.12 * Math.sin(Math.min(1, k * 2.5) * Math.PI) * (1 - k); }
    }
    bot.position.y = y; bot.scale.set(2 - squash, squash, 2 - squash);

    if (!still) {
      const lx = hasPointer ? tx : Math.sin(t * 0.5) * 0.6;
      const ly = hasPointer ? ty : Math.sin(t * 0.37) * 0.25;
      head.rotation.y += (lx * 0.7 - head.rotation.y) * 0.08;
      head.rotation.x += (ly * 0.35 - head.rotation.x) * 0.08;
      head.rotation.z = Math.sin(t * 0.8) * 0.05;
      knees[0].rotation.x = Math.sin(t * 2.4) * 0.35;
      knees[1].rotation.x = Math.sin(t * 2.4 + Math.PI) * 0.35;
      arms[0].rotation.x = -0.15 + Math.sin(t * 1.2) * 0.04;
      arms[1].rotation.x = -0.15 - Math.sin(t * 1.2) * 0.04;
      tip.material.emissiveIntensity = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t * 3));
      if (now > nextBlink) { blinkUntil = now + 130; nextBlink = now + 2500 + Math.random() * 3000; }
      eyes.scale.y = now < blinkUntil ? 0.12 : 1;
    }
    renderer.toneMappingExposure = dark.matches ? 1.05 : 0.95;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
