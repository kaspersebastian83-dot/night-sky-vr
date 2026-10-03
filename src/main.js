import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import './style.css';

const app = document.querySelector('#app');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  500
);

camera.position.set(0, 1.65, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

app.appendChild(renderer.domElement);

// -----------------------------------------------------------------------------
// WEBXR / QUEST 3
// -----------------------------------------------------------------------------

const vrButton = VRButton.createButton(renderer, {
  optionalFeatures: ['local-floor'],
});

document.body.appendChild(vrButton);

// Hide the normal webpage overlay once VR actually starts.
renderer.xr.addEventListener('sessionstart', () => {
  const intro = document.querySelector('.intro');

  if (intro) {
    intro.style.display = 'none';
  }

  console.log('WebXR session started');
});

// Restore the overlay when VR ends.
renderer.xr.addEventListener('sessionend', () => {
  const intro = document.querySelector('.intro');

  if (intro) {
    intro.style.display = '';
  }

  console.log('WebXR session ended');
});

// -----------------------------------------------------------------------------
// MILESTONE 1 STAR FIELD
// -----------------------------------------------------------------------------
// These stars are procedural for now.
// Later we will replace them with real astronomical catalogue data.

const STAR_COUNT = 9000;
const STAR_RADIUS = 110;

const positions = new Float32Array(STAR_COUNT * 3);
const colors = new Float32Array(STAR_COUNT * 3);
const sizes = new Float32Array(STAR_COUNT);
const brightness = new Float32Array(STAR_COUNT);

// Deterministic random generator so the star field stays identical
// every time the app loads.
let seed = 0x5f3759df;

function random() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;

  return (seed >>> 0) / 4294967296;
}

function starColor() {
  const r = random();

  // Keep colours subtle.
  // Most real stars appear fairly close to white to dark-adapted human vision.
  if (r < 0.10) {
    return [0.72, 0.82, 1.00]; // blue-white
  }

  if (r < 0.78) {
    return [1.00, 0.98, 0.92]; // white / warm white
  }

  if (r < 0.96) {
    return [1.00, 0.84, 0.62]; // yellow-orange
  }

  return [1.00, 0.62, 0.45]; // orange-red
}

for (let i = 0; i < STAR_COUNT; i++) {
  // Uniform distribution over a sphere.
  const u = random();
  const v = random();

  const theta = 2 * Math.PI * u;
  const z = 2 * v - 1;
  const xy = Math.sqrt(1 - z * z);

  const i3 = i * 3;

  positions[i3] =
    STAR_RADIUS * xy * Math.cos(theta);

  positions[i3 + 1] =
    STAR_RADIUS * z;

  positions[i3 + 2] =
    STAR_RADIUS * xy * Math.sin(theta);

  // Most stars should be faint.
  // Only a small fraction should appear conspicuously bright.
  const b = Math.pow(random(), 5.5);

  brightness[i] = b;
  sizes[i] = 1.15 + b * 3.4;

  const c = starColor();

  const colorGain =
    0.55 + b * 0.75;

  colors[i3] =
    c[0] * colorGain;

  colors[i3 + 1] =
    c[1] * colorGain;

  colors[i3 + 2] =
    c[2] * colorGain;
}

// -----------------------------------------------------------------------------
// THREE.JS STAR GEOMETRY
// -----------------------------------------------------------------------------

const geometry = new THREE.BufferGeometry();

geometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positions, 3)
);

geometry.setAttribute(
  'color',
  new THREE.BufferAttribute(colors, 3)
);

geometry.setAttribute(
  'aSize',
  new THREE.BufferAttribute(sizes, 1)
);

geometry.setAttribute(
  'aBrightness',
  new THREE.BufferAttribute(brightness, 1)
);

// -----------------------------------------------------------------------------
// STAR SHADER
// -----------------------------------------------------------------------------

const material = new THREE.ShaderMaterial({
  uniforms: {
    uReveal: {
      value: 0,
    },

    uPixelRatio: {
      value: Math.min(window.devicePixelRatio, 2),
    },
  },

  vertexShader: /* glsl */ `
    attribute float aSize;
    attribute float aBrightness;
    attribute vec3 color;

    varying float vBrightness;
    varying vec3 vColor;

    uniform float uPixelRatio;

    void main() {

      vBrightness = aBrightness;
      vColor = color;

      vec4 mvPosition =
        modelViewMatrix *
        vec4(position, 1.0);

      gl_Position =
        projectionMatrix *
        mvPosition;

      gl_PointSize =
        aSize *
        uPixelRatio;
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;

    varying float vBrightness;
    varying vec3 vColor;

    uniform float uReveal;

    void main() {

      vec2 p =
        gl_PointCoord -
        vec2(0.5);

      float r =
        length(p) *
        2.0;

      if (r > 1.0) {
        discard;
      }

      // Bright stars appear first.
      // Faint stars emerge progressively as simulated
      // dark adaptation increases.
      float threshold =
        mix(
          0.78,
          0.015,
          uReveal
        );

      float visible =
        smoothstep(
          threshold,
          threshold + 0.12,
          vBrightness + 0.03
        );

      // Tight stellar core.
      float core =
        exp(
          -r *
          r *
          14.0
        );

      // Very subtle halo.
      float halo =
        exp(
          -r *
          r *
          3.0
        ) *
        0.14;

      float alpha =
        (core + halo) *
        visible *
        (
          0.45 +
          vBrightness *
          1.25
        );

      gl_FragColor =
        vec4(
          vColor,
          alpha
        );
    }
  `,

  transparent: true,

  depthWrite: false,
  depthTest: false,

  blending:
    THREE.AdditiveBlending,

  vertexColors: true,
});

// -----------------------------------------------------------------------------
// STAR OBJECT
// -----------------------------------------------------------------------------

const stars =
  new THREE.Points(
    geometry,
    material
  );

scene.add(stars);

// -----------------------------------------------------------------------------
// ANIMATION
// -----------------------------------------------------------------------------

const clock =
  new THREE.Clock();

const viewerPosition =
  new THREE.Vector3();

renderer.setAnimationLoop(() => {

  const elapsed =
    clock.getElapsedTime();

  // Wait roughly 3 seconds.
  // Then reveal progressively fainter stars
  // over approximately 24 seconds.
  material.uniforms.uReveal.value =
    THREE.MathUtils.smoothstep(
      elapsed,
      3,
      27
    );

  // ---------------------------------------------------------------------------
  // Prevent false stellar parallax
  // ---------------------------------------------------------------------------
  //
  // In real life stars are effectively infinitely distant.
  //
  // When the user's head physically moves sideways,
  // the stellar sphere should therefore remain centred on them.
  //
  // Rotation still works normally,
  // so looking around reveals different parts of the sky.

  if (renderer.xr.isPresenting) {

    renderer.xr
      .getCamera(camera)
      .getWorldPosition(
        viewerPosition
      );

    stars.position.copy(
      viewerPosition
    );

  } else {

    stars.position.copy(
      camera.position
    );

    // Very slow motion on the ordinary browser page.
    stars.rotation.y +=
      0.00002;
  }

  renderer.render(
    scene,
    camera
  );
});

// -----------------------------------------------------------------------------
// WINDOW RESIZE
// -----------------------------------------------------------------------------

function onResize() {

  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  material.uniforms
    .uPixelRatio
    .value =
      Math.min(
        window.devicePixelRatio,
        2
      );
}

window.addEventListener(
  'resize',
  onResize
);
