import * as THREE from 'three';

export function initScene3D() {
  // ---- Vérifications préalables ----
  const canvas = document.getElementById('scene-3d-canvas');
  const container = document.getElementById('scene-3d');
  if (!canvas || !container) return;

  // Désactive sur mobile et tablette
  //const isMobile = window.innerWidth < 1024;
  //if (isMobile) {
    //container.style.display = 'none';
   // return;
 // }

  // Vérifie le support WebGL
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
  if (!gl) {
    container.style.display = 'none';
    return;
  }

  // Récupère les couleurs du thème actif
  const styles = getComputedStyle(document.documentElement);
  const accentColor = new THREE.Color(styles.getPropertyValue('--accent').trim() || '#FF5B04');
  const bgColor = new THREE.Color(styles.getPropertyValue('--bg').trim() || '#FAFAFA');

  // ---- Setup Three.js ----
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ---- Lumières ----
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(5, 5, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 20;
  scene.add(keyLight);

  // Lumière d'accent orange pour le glow
  const accentLight = new THREE.PointLight(accentColor, 2, 10);
  accentLight.position.set(-3, -2, 3);
  scene.add(accentLight);

  // ---- Groupe principal (pour tout faire pivoter ensemble) ----
  const group = new THREE.Group();
  scene.add(group);

  // ---- MATÉRIAU PRINCIPAL : colis en carton clair ----
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0xE8D5B7, // carton clair
    roughness: 0.85,
    metalness: 0.05,
  });

  // ---- COLIS PRINCIPAL (cube) ----
  const boxGeometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
  const mainBox = new THREE.Mesh(boxGeometry, boxMaterial);
  mainBox.castShadow = true;
  mainBox.receiveShadow = true;
  group.add(mainBox);

  // ---- RUBAN ORANGE (bande verticale + horizontale) ----
  const ribbonMaterial = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.4,
    metalness: 0.1,
  });

  // Ruban vertical (largeur fine, fait le tour)
  const ribbonV = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 1.82, 1.82),
    ribbonMaterial
  );
  ribbonV.castShadow = true;
  group.add(ribbonV);

  // Ruban horizontal
  const ribbonH = new THREE.Mesh(
    new THREE.BoxGeometry(1.82, 1.82, 0.32),
    ribbonMaterial
  );
  ribbonH.castShadow = true;
  group.add(ribbonH);

  // ---- PETITS COLIS EN ORBITE ----
  const smallBoxGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);

  const orbitGroup = new THREE.Group();
  group.add(orbitGroup);

  const smallBoxes = [];
  const orbitCount = 3;

  for (let i = 0; i < orbitCount; i++) {
    const smallBox = new THREE.Mesh(smallBoxGeo, boxMaterial.clone());
    smallBox.castShadow = true;
    smallBox.receiveShadow = true;

    // Position initiale sur un cercle
    const angle = (i / orbitCount) * Math.PI * 2;
    const radius = 2.6;
    smallBox.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.3) * 0.8,
      Math.sin(angle) * radius
    );

    // Rotation initiale aléatoire
    smallBox.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    orbitGroup.add(smallBox);
    smallBoxes.push({ mesh: smallBox, angle, radius, speed: 0.15 + Math.random() * 0.1 });
  }

  // ---- SOL avec ombre (invisible, juste pour recevoir l'ombre) ----
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.15 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- INTERACTION SOURIS ----
  let mouseX = 0;
  let mouseY = 0;
  let targetRotX = 0;
  let targetRotY = 0;

  window.addEventListener('mousemove', (e) => {
    // Normalise entre -1 et 1
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

    targetRotY = mouseX * 0.6;
    targetRotX = -mouseY * 0.4;
  });

  // ---- ANIMATION LOOP ----
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    // Rotation automatique du groupe principal
    group.rotation.y += 0.003;

    // Rotation réactive à la souris (interpolée doucement)
    group.rotation.y += (targetRotY - (group.rotation.y % (Math.PI * 2))) * 0.02;
    group.rotation.x += (targetRotX - group.rotation.x) * 0.03;

    // Légère oscillation verticale (effet "flottant")
    group.position.y = Math.sin(elapsed * 0.8) * 0.12;

    // Orbite des petits colis
    smallBoxes.forEach((item, i) => {
      const t = elapsed * item.speed + item.angle;
      item.mesh.position.x = Math.cos(t) * item.radius;
      item.mesh.position.z = Math.sin(t) * item.radius;
      item.mesh.position.y = Math.sin(t * 1.5 + i) * 0.9;

      // Rotation sur eux-mêmes
      item.mesh.rotation.x += 0.008;
      item.mesh.rotation.y += 0.012;
    });

    renderer.render(scene, camera);
  }

  animate();

  // ---- RESIZE ----
  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // ---- RÉACTION AU CHANGEMENT DE THÈME ----
  const observer = new MutationObserver(() => {
    const newStyles = getComputedStyle(document.documentElement);
    const newAccent = newStyles.getPropertyValue('--accent').trim() || '#FF5B04';
    accentColor.set(newAccent);
    accentLight.color.set(newAccent);
    ribbonMaterial.color.set(newAccent);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}