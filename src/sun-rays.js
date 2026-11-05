import * as THREE from "three";

export function createSunRays() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;

      void main() {
        float rays = 0.0;
        float width = 0.02 + (1.0 - vUv.y) * 0.05;

        for (int i = 0; i < 7; i++) {
          float index = float(i);
          float origin = (index + 0.5) / 7.0;
          float drift = sin(uTime * 0.18 + index * 1.7) * 0.018;
          float center = origin + (1.0 - vUv.y) * 0.14 + drift;
          float beam = 1.0 - smoothstep(0.0, width, abs(vUv.x - center));
          rays += beam * (0.55 + 0.45 * sin(index * 2.3 + 1.0));
        }

        float fadeFromSurface = smoothstep(0.0, 0.18, vUv.y);
        float intensity = min(rays * 0.24, 0.4) * fadeFromSurface * uIntensity;
        gl_FragColor = vec4(vec3(0.78, 0.94, 1.0), intensity);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.position.z = -13;
  mesh.renderOrder = 1;

  function resize(camera) {
    const distance = camera.position.z - mesh.position.z;
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    mesh.scale.set(height * camera.aspect, height, 1);
  }

  function update(t, progress, cameraY, reduceMotion) {
    mesh.position.y = cameraY;
    material.uniforms.uTime.value = reduceMotion ? 0 : t;
    material.uniforms.uIntensity.value =
      1 - THREE.MathUtils.smoothstep(progress, 0, 0.42);
  }

  return { mesh, resize, update };
}
