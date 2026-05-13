// three-overlay.js
// Overlay Three.js optionnel. Chargé à la demande; fallback silencieux si CDN indisponible.

let runtime = null;

export async function toggleThreeOverlay(containerId, points, enabled) {
  const container = document.getElementById(containerId);
  if (!container) return { ok: false, message: 'Conteneur 3D introuvable.' };
  if (!enabled) {
    dispose();
    container.innerHTML = '';
    return { ok: true, message: 'Animation 3D désactivée.' };
  }

  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    initScene(THREE, container, points);
    return { ok: true, message: 'Animation Three.js activée.' };
  } catch (err) {
    container.innerHTML = '<div class="text-sm text-yellow-300 p-3">Three.js indisponible: affichage Plotly 3D conservé.</div>';
    return { ok: false, message: String(err) };
  }
}

export function scrubThree(t) {
  if (!runtime) return;
  runtime.progress = t;
  updateArrow();
}

function initScene(THREE, container, points) {
  dispose();
  container.innerHTML = '';
  const width = container.clientWidth || 640;
  const height = 220;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, -18, 8);
  camera.lookAt(20, 0, 1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(5, -10, 10);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const arrow = createProceduralArrow(THREE);
  scene.add(arrow);

  runtime = { THREE, renderer, scene, camera, arrow, points, progress: 0, playing: true, frame: null };
  animate();
}

function createProceduralArrow(THREE) {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 1.8, 16),
    new THREE.MeshStandardMaterial({ color: 0x00f7ff, metalness: 0.2, roughness: 0.35 })
  );
  shaft.rotation.z = Math.PI / 2;
  const point = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.28, 18),
    new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.5, roughness: 0.25 })
  );
  point.position.x = 1.02;
  point.rotation.z = -Math.PI / 2;
  group.add(shaft, point);
  return group;
}

function animate() {
  if (!runtime) return;
  if (runtime.playing) runtime.progress = (runtime.progress + 0.003) % 1;
  updateArrow();
  runtime.renderer.render(runtime.scene, runtime.camera);
  runtime.frame = requestAnimationFrame(animate);
}

function updateArrow() {
  if (!runtime?.points?.length) return;
  const index = Math.min(runtime.points.length - 2, Math.floor(runtime.progress * (runtime.points.length - 1)));
  const p = runtime.points[index];
  const next = runtime.points[index + 1] || p;
  runtime.arrow.position.set(p.x / 5, p.z * 4, p.y);
  const dx = next.x - p.x;
  const dy = next.y - p.y;
  const dz = next.z - p.z;
  runtime.arrow.rotation.y = -Math.atan2(dy, Math.max(0.001, dx));
  runtime.arrow.rotation.z = Math.atan2(dz, Math.max(0.001, dx));
}

function dispose() {
  if (!runtime) return;
  cancelAnimationFrame(runtime.frame);
  runtime.renderer.dispose();
  runtime = null;
}

export function setThreePlaying(playing) {
  if (runtime) runtime.playing = playing;
}
