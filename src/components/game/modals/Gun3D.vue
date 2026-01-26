<template>
  <div ref="containerRef" class="gun3d-container"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const containerRef = ref(null);
const actions = new Map();
const finishListeners = new Set();

let scene;
let camera;
let renderer;
let mixer;
let clock;
let frameId;
let modelRoot;
let resizeObserver;
let pendingAmmoType = null;

function disposeScene() {
  if (modelRoot) {
    modelRoot.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose?.());
        } else {
          child.material?.dispose?.();
        }
      }
    });
  }
}

function stopAllActions() {
  finishListeners.forEach((remove) => remove());
  finishListeners.clear();
  mixer?.stopAllAction();
  actions.forEach((action) => action.stop());
}

function playOnce(action) {
  if (!action || !mixer) return Promise.resolve();

  return new Promise((resolve) => {
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.enabled = true;
    action.play();

    const onFinished = (event) => {
      if (event.action !== action) return;
      mixer.removeEventListener('finished', onFinished);
      finishListeners.delete(removeListener);
      resolve();
    };

    const removeListener = () => {
      mixer?.removeEventListener('finished', onFinished);
    };

    finishListeners.add(removeListener);
    mixer.addEventListener('finished', onFinished);
  });
}

function playIdle(action) {
  if (!action) return;
  action.reset();
  action.setLoop(THREE.LoopRepeat);
  action.clampWhenFinished = false;
  action.enabled = true;
  action.play();
}

function playShotSound(ammoType) {
  const src = ammoType === 'BLANK' ? '/sounds/shot_blank.mp3' : '/sounds/shot_real.mp3';
  const audio = new Audio(src);
  audio.play().catch(() => {});
}

async function runSequence(ammoType) {
  if (!mixer || actions.size === 0) {
    pendingAmmoType = ammoType;
    return;
  }

  stopAllActions();

  const reloadAction = actions.get('CarryPistol_Rig|Reload');
  const fireAction = actions.get('CarryPistol_Rig|FireCycle');
  const idleAction = actions.get(
    ammoType === 'BLANK' ? 'CarryPistol_Rig|Idle_Empty' : 'CarryPistol_Rig|Idle'
  );

  await playOnce(reloadAction);
  if (fireAction) {
    playShotSound(ammoType);
    await playOnce(fireAction);
  }
  playIdle(idleAction);
}

function animate() {
  frameId = requestAnimationFrame(animate);
  const delta = clock?.getDelta() ?? 0;
  mixer?.update(delta);
  renderer?.render(scene, camera);
}

function setupRenderer() {
  const container = containerRef.value;
  if (!container) return;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  container.appendChild(renderer.domElement);

  const resize = () => {
    if (!container || !renderer || !camera) return;
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
}

function setupScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 1.6, 3.2);
  camera.lookAt(0, 1.1, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(2, 4, 3);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
  rimLight.position.set(-2, 2, -3);
  scene.add(rimLight);

  clock = new THREE.Clock();
}

function loadModel() {
  const loader = new GLTFLoader();
  loader.load('/3d/animated_carry_pistol.glb', (gltf) => {
    console.log(gltf.animations.map(a => a.name));
    modelRoot = gltf.scene;
    scene.add(modelRoot);
    mixer = new THREE.AnimationMixer(modelRoot);
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      actions.set(clip.name, action);
    });

    if (pendingAmmoType) {
      const ammoType = pendingAmmoType;
      pendingAmmoType = null;
      runSequence(ammoType);
    }
  });
}

function playSequence(ammoType = 'REAL') {
  runSequence(ammoType);
}

defineExpose({ playSequence });

onMounted(() => {
  setupScene();
  setupRenderer();
  loadModel();
  animate();
});

onBeforeUnmount(() => {
  stopAllActions();
  cancelAnimationFrame(frameId);
  resizeObserver?.disconnect();
  disposeScene();
  renderer?.dispose();
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement);
  }
});
</script>

<style scoped>
.gun3d-container {
  width: 100%;
  height: 100%;
}
</style>
