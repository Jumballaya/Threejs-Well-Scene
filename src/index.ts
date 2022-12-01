import './styles/main.css';
import * as THREE from 'three';
import { Core } from './core/Core';
import { createEntryOverlay, setupEntryLoader } from './loading-screen';

const publicPath = process?.env?.PUBLIC_PATH || '/';

const state = {
  core: new Core(window.location.hash === '#debug'),

  attributes: {
    loaded: false,
    backgroundColor: new THREE.Color(0xbfa888),
  },
};

const getSceneModel = async () => {
  const model = await state.core.loader.loadGltf(
    'well',
    `${publicPath}models/well.glb`,
  );
  model.scene.scale.set(0.1, 0.1, 0.1);
  return model;
};

const getBakedMaterial = async () => {
  const texture = await state.core.loader.loadTexture(
    'well',
    `${publicPath}textures/well.jpg`,
  );
  texture.flipY = false;
  texture.encoding = THREE.sRGBEncoding;
  const bakedMaterial = new THREE.MeshBasicMaterial({ map: texture });
  return bakedMaterial;
};

const setupBaseModel = async () => {
  const bakedMaterial = await getBakedMaterial();
  const model = await getSceneModel();

  model.scene.traverse((child) => {
    if (child.type === 'Mesh') {
      const mesh = child as THREE.Mesh;
      mesh.material = bakedMaterial;
    }
  });
  return model.scene;
};

const createWellScene = async () => {
  const baseModel = await setupBaseModel();
  return [baseModel];
};

// Main function
const main = async () => {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({
      color: 0x7d6340,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;

  state.core.add(floor);

  const fog = new THREE.Fog(state.attributes.backgroundColor, 0, 20);
  state.core.setFog(fog);

  state.core.setBackgroundColor(state.attributes.backgroundColor);

  const entryLoader = setupEntryLoader(state.attributes);
  state.core.loader.onProgress = entryLoader;
  const overlay = createEntryOverlay();
  state.core.scene.add(overlay);

  const objects = await createWellScene();

  state.core.add(...objects);
  const clock = new THREE.Clock();
  state.core.loop((deltaT: number) => {
    if (state.attributes.loaded && overlay.material.uniforms.uAlpha.value > 0) {
      overlay.material.uniforms.uAlpha.value -= 0.05;
      if (!state.core.controls.enabled) {
        state.core.controls.enabled = true;
      }
    }
    if (
      state.attributes.loaded &&
      overlay.material.uniforms.uAlpha.value <= 0.1
    ) {
      state.core.scene.remove(overlay);
      overlay.material.dispose();
      overlay.geometry.dispose();
    }
  });
};

main();
