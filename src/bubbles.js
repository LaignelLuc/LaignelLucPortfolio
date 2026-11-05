import * as THREE from "three";

const BUBBLE_COUNT = 180;

export function createBubbles() {
  const positions = new Float32Array(BUBBLE_COUNT * 3);
  const speeds = new Float32Array(BUBBLE_COUNT);
  const sizeFactors = new Float32Array(BUBBLE_COUNT);

  for (let i = 0; i < BUBBLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    speeds[i] = 0.2 + Math.random() * 0.6;
    sizeFactors[i] = 0.65 + Math.random() * 0.65;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizeFactors, 1));

  // Round point sprites with a glassy rim, refraction-ish tint and two
  // specular highlights. The highlight is upper-right, matching the scene sun.
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uSize: { value: 0.14 },
      uScale: { value: 1 },
      uOpacity: { value: 0.9 },
    },
    vertexShader: `
      attribute float aSize;
      uniform float uSize;
      uniform float uScale;
      varying float vFade;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = uSize * aSize * (uScale / max(1.0, -mvPosition.z));
        vFade =
          smoothstep(-7.0, -5.0, position.y) *
          (1.0 - smoothstep(5.0, 7.0, position.y));
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vFade;

      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float r = length(p);
        float edgeFade = 1.0 - smoothstep(0.47, 0.5, r);
        if (edgeFade <= 0.001) discard;

        float rim = smoothstep(0.37, 0.47, r) * (1.0 - smoothstep(0.485, 0.5, r));
        float fill = (1.0 - smoothstep(0.0, 0.5, r)) * 0.035;
        vec2 hiPos = p - vec2(0.16, -0.16);
        vec2 glintPos = p - vec2(-0.18, 0.15);
        float highlight = exp(-dot(hiPos, hiPos) * 230.0);
        float glint = exp(-dot(glintPos, glintPos) * 330.0) * 0.18;

        vec3 rimColor = mix(
          vec3(0.45, 0.78, 0.93),
          vec3(0.95, 1.0, 1.0),
          smoothstep(0.37, 0.47, r)
        );
        vec3 color = mix(vec3(0.72, 0.92, 1.0), rimColor, smoothstep(0.2, 0.46, r));
        color = mix(color, vec3(1.0), highlight);

        float alpha =
          (fill + rim * 0.42 + highlight * 0.75 + glint) *
          edgeFade * vFade * uOpacity;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);

  function update(dt, t, cameraY, reduceMotion) {
    if (!reduceMotion) {
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        positions[i * 3 + 1] += speeds[i] * dt;
        positions[i * 3] += Math.sin(t + i) * 0.002;
        if (positions[i * 3 + 1] > 7) positions[i * 3 + 1] = -7;
      }
      geometry.attributes.position.needsUpdate = true;
    }
    points.position.y = cameraY;
  }

  function resize(renderer, camera) {
    material.uniforms.uScale.value =
      (window.innerHeight * renderer.getPixelRatio()) /
      (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  }

  return { points, update, resize };
}
