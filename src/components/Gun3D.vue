<template>
  <div ref="container" class="gun-3d-container"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const props = defineProps({
  rotation: { type: Number, default: 0 },
  isShooting: Boolean
});

const container = ref(null);
let scene, camera, renderer, gun;
let frameId;

const init = () => {
  scene = new THREE.Scene();
  
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.z = 3;
  camera.position.y = 0;
  camera.position.x = 0.5;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);
  container.value.appendChild(renderer.domElement);

  // Enhanced Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(3, 3, 5);
  scene.add(directionalLight);

  const pointLight1 = new THREE.PointLight(0xf2b36d, 1.5, 15);
  pointLight1.position.set(-3, 2, 3);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffffff, 1, 10);
  pointLight2.position.set(2, -1, 2);
  scene.add(pointLight2);

  // Loader
  const loader = new OBJLoader();
  loader.load(
    '/src/assets/3d/Gun.obj',
    (object) => {
      gun = object;
      
      // Center and scale
      const box = new THREE.Box3().setFromObject(gun);
      const center = box.getCenter(new THREE.Vector3());
      gun.position.sub(center);
      
      // Material - more visible
      gun.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.3,
            emissive: 0x111111,
          });
        }
      });

      gun.scale.set(2, 2, 2);
      gun.rotation.y = Math.PI / 2;
      gun.rotation.x = -0.2;
      scene.add(gun);
    },
    (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% loaded'); },
    (error) => { console.error('Error loading gun:', error); }
  );

  const animate = () => {
    frameId = requestAnimationFrame(animate);
    if (gun) {
      // Subtle idle animation
      gun.position.y = Math.sin(Date.now() * 0.001) * 0.03;
      
      // Apply rotation prop
      gun.rotation.z = THREE.MathUtils.lerp(gun.rotation.z, props.rotation * (Math.PI / 180), 0.15);
    }
    renderer.render(scene, camera);
  };
  
  animate();
};

const handleResize = () => {
  if (!container.value || !renderer) return;
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

onMounted(() => {
  init();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId);
  window.removeEventListener('resize', handleResize);
  if (renderer) {
    renderer.dispose();
  }
});
</script>

<style scoped>
.gun-3d-container {
  width: 100%;
  height: 100%;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
