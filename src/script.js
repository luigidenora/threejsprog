import "./style.css";
import * as dat from "dat.gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import firefliesVertexShader from "./shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl";
import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";
// Debug
const debugObject = {
  clearColor: "#828D82",
  portalColorStart: "#780f78",
  portalColorEnd: "#ffffff",
};
// Canvas
const canvas = document.querySelector("canvas.webgl");
// Scene
const scene = new THREE.Scene();
// Texture loader
const textureLoader = new THREE.TextureLoader();
// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");
// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
// loading texture
const bakedTexture = textureLoader.load("baked.jpg");
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;
// loading texture
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });
const poleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });
const portalLightMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
    uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
});

gltfLoader.load("portal.glb", (g) => {
  const bakedMesh = g.scene.children.find((pa) => pa.name === "baked");
  const poleLightAMesh = g.scene.children.find(
    (pa) => pa.name === "PoleLightA"
  );
  const pleLightBMesh = g.scene.children.find((pa) => pa.name === "PoleLightB");
  const portalLightMesh = g.scene.children.find(
    (pa) => pa.name === "PortalLight"
  );
  bakedMesh.material = bakedMaterial;
  pleLightBMesh.material = poleMaterial;
  poleLightAMesh.material = poleMaterial;
  portalLightMesh.material = portalLightMaterial;
  scene.add(g.scene);
});

const fireFilesGeometry = new THREE.BufferGeometry();
const fireFliesCount = 30;
const positionArray = new Float32Array(fireFliesCount * 3);
const scaleArray = new Float32Array(fireFliesCount);

for (let i = 0; i < fireFliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 1.5;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;
  scaleArray[i] = Math.random();
}
fireFilesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3)
);
fireFilesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1)
);
const firefliesMaterial = new THREE.ShaderMaterial({
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 200 },
    uTime: { value: 0 },
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
});
const fireFiles = new THREE.Points(fireFilesGeometry, firefliesMaterial);
scene.add(fireFiles);
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(debugObject.clearColor);

/**
 * Animate
 */
const clock = new THREE.Clock();
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  firefliesMaterial.uniforms.uTime.value = elapsedTime;
  portalLightMaterial.uniforms.uTime.value = elapsedTime;
  // Update controls
  controls.update();
  // Render
  renderer.render(scene, camera);
  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

const gui = new dat.GUI({
  width: 400,
});
gui
  .add(firefliesMaterial.uniforms.uSize, "value")
  .min(0)
  .max(500)
  .step(1)
  .name("firefliesSize");
gui.addColor(debugObject, "portalColorStart").onChange((r) => {
  portalLightMaterial.uniforms.uColorStart.value.set(
    debugObject.portalColorStart
  );
});
gui.addColor(debugObject, "portalColorEnd").onChange((r) => {
  console.log("portalEnd");
  portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd);
});
gui
  .addColor(debugObject, "clearColor")
  .onChange((r) => renderer.setClearColor(debugObject.clearColor));
