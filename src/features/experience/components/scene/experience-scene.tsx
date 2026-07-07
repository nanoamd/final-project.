"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";

import { progressStore } from "@/features/experience/lib/progress-store";

/**
 * The live 3D scene for "The Becoming". Everything here reads
 * `progressStore.value` inside useFrame — never React state — so the scroll
 * timeline drives 60fps updates without re-rendering the component tree.
 *
 * This is a first vertical slice: ground colour, sky/light journey, and three
 * approved props (sauna, lounge/fire-pit, fire-pit + chair) staged in on
 * scroll. Materials are flat placeholder tones for now — the full
 * art-directed "skin" pass (Phase 4/5) comes once more props are approved.
 */

const SKY_START = new THREE.Color("#c7c2b8"); // flat, overcast
const SKY_END = new THREE.Color("#141b2c"); // deep blue-hour dusk

const GROUND_START = new THREE.Color("#8a8672"); // patchy, dry
const GROUND_END = new THREE.Color("#233d22"); // rich, deep green

const SAUNA_TIMBER = new THREE.Color("#2a1d14");
const LOUNGE_TONE = new THREE.Color("#3a362c");
const FIRE_PIT_TONE = new THREE.Color("#26221d");

const FIRE_GLOW = new THREE.Color("#ff7a2e");
const SAUNA_GLOW = new THREE.Color("#ffb15c");

const PATIO_STONE = new THREE.Color("#a39a8a");

const TREE_TRUNK = new THREE.Color("#4a3826");
const TREE_CANOPY_A = new THREE.Color("#24462b");
const TREE_CANOPY_B = new THREE.Color("#2f5233");

/**
 * A distant tree line framing the garden. Previously the ground was a bare
 * 40x40 plane, small enough that its edge was visible within the camera's
 * dolly range — reading as a floating disc/stage rather than a garden that
 * actually extends past what the camera can see. These sit beyond the
 * planting/props, always present, with the enlarged ground + fog (below)
 * hiding the plane's edge behind them instead of showing it directly.
 */
const TREES: { position: readonly [number, number, number]; scale: number }[] =
  [
    { position: [-8, 0, -4], scale: 1.6 },
    { position: [7.5, 0, -5], scale: 1.3 },
    { position: [-9.5, 0, 3], scale: 1.8 },
    { position: [9, 0, 4], scale: 1.5 },
    { position: [-3, 0, -9], scale: 1.4 },
    { position: [4, 0, -10], scale: 1.7 },
  ];

/** A simple trunk + overlapping canopy clusters — same low-poly language as the shrubs. */
function Tree({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 1.2, 6]} />
        <meshStandardMaterial color={TREE_TRUNK} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <icosahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial
          color={TREE_CANOPY_A}
          roughness={0.9}
          flatShading
        />
      </mesh>
      <mesh position={[0.4, 1.3, 0.3]}>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color={TREE_CANOPY_B}
          roughness={0.9}
          flatShading
        />
      </mesh>
      <mesh position={[-0.35, 1.25, -0.25]}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color={TREE_CANOPY_A}
          roughness={0.9}
          flatShading
        />
      </mesh>
    </group>
  );
}

const FLAME_INNER = new THREE.Color("#ffe08a");
const FLAME_OUTER = new THREE.Color("#ff7a2e");

/** Flame tongues: small offsets from the fire-pit's log pile, each flickering independently. */
const FLAME_TONGUES: {
  xOffset: number;
  zOffset: number;
  height: number;
  radius: number;
  freq: number;
  phase: number;
  color: THREE.Color;
}[] = [
  {
    xOffset: 0,
    zOffset: 0,
    height: 0.5,
    radius: 0.1,
    freq: 5.4,
    phase: 0,
    color: FLAME_OUTER,
  },
  {
    xOffset: 0.09,
    zOffset: 0.05,
    height: 0.38,
    radius: 0.07,
    freq: 6.3,
    phase: 1.4,
    color: FLAME_INNER,
  },
  {
    xOffset: -0.1,
    zOffset: -0.02,
    height: 0.42,
    radius: 0.08,
    freq: 5.9,
    phase: 2.6,
    color: FLAME_OUTER,
  },
  {
    xOffset: 0.01,
    zOffset: -0.1,
    height: 0.33,
    radius: 0.06,
    freq: 6.8,
    phase: 3.7,
    color: FLAME_INNER,
  },
];

const FAIRY_LIGHT_COLOR = new THREE.Color("#ffcf8a");
const FAIRY_LIGHT_COUNT = 12;
const FAIRY_LIGHT_RADIUS = 3.1;

/** A ring of small ground-level string lights bordering the patio. */
const FAIRY_LIGHTS: {
  position: readonly [number, number, number];
  phase: number;
}[] = Array.from({ length: FAIRY_LIGHT_COUNT }, (_, i) => {
  const angle = (i / FAIRY_LIGHT_COUNT) * Math.PI * 2;
  return {
    position: [
      Math.sin(angle) * FAIRY_LIGHT_RADIUS,
      0.12,
      Math.cos(angle) * FAIRY_LIGHT_RADIUS - 0.2,
    ] as const,
    phase: i * 0.7,
  };
});

/**
 * A fixed per-angle radius multiplier so the patio reads as a natural,
 * irregular stone terrace instead of a perfect circle — seen mostly from its
 * near half at the camera's low angle, a true circle looked like a flat
 * geometric semi-circle sitting on the grass rather than part of a garden.
 */
const PATIO_RADIUS_JITTER = [
  1, 0.93, 1.06, 0.88, 1.1, 0.95, 1.03, 0.9, 1.08, 0.96, 1.02, 0.85, 1.12, 0.94,
  1.05, 0.89, 1.07, 0.97, 1.01, 0.86, 1.11, 0.93, 1.04, 0.98,
];

function buildPatioShape(): THREE.Shape {
  const shape = new THREE.Shape();
  const count = PATIO_RADIUS_JITTER.length;
  for (let i = 0; i <= count; i++) {
    const idx = i % count;
    const angle = (idx / count) * Math.PI * 2;
    const r = 3.4 * (PATIO_RADIUS_JITTER[idx] ?? 1);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  return shape;
}

const SOIL_TONE = new THREE.Color("#3b2f22");

const SHRUB_TONE_A = new THREE.Color("#2f5233");
const SHRUB_TONE_B = new THREE.Color("#3f6b3f");

/** Procedural shrubs: position, final scale, and the progress range they grow in over. */
const SHRUBS: {
  position: readonly [number, number, number];
  base: number;
  range: readonly [number, number];
}[] = [
  { position: [-3.2, 0, -1.4], base: 0.9, range: [0.08, 0.28] },
  { position: [3.0, 0, -1.0], base: 0.75, range: [0.14, 0.34] },
  { position: [-3.6, 0, 1.6], base: 1.0, range: [0.22, 0.42] },
  { position: [3.7, 0, 1.9], base: 0.85, range: [0.3, 0.5] },
  { position: [-1.1, 0, -2.6], base: 0.7, range: [0.38, 0.58] },
  { position: [1.4, 0, -2.9], base: 0.95, range: [0.46, 0.66] },
];

/** A small cluster of overlapping low-poly spheres reads as a shrub without needing a modelled asset. */
function Shrub() {
  return (
    <>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 12]} />
        <meshStandardMaterial color={SOIL_TONE} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={SHRUB_TONE_A}
          roughness={0.9}
          flatShading
        />
      </mesh>
      <mesh position={[0.25, 0.22, 0.1]}>
        <icosahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial
          color={SHRUB_TONE_B}
          roughness={0.9}
          flatShading
        />
      </mesh>
      <mesh position={[-0.2, 0.18, -0.15]}>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color={SHRUB_TONE_A}
          roughness={0.9}
          flatShading
        />
      </mesh>
    </>
  );
}

/** Remap a value from [inMin, inMax] to [0, 1], clamped. */
function remap(value: number, inMin: number, inMax: number) {
  return Math.min(1, Math.max(0, (value - inMin) / (inMax - inMin)));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ground-relative Y offsets for a loaded model, computed from its actual
 * bounding box rather than a guessed constant — "hidden" fully submerges the
 * model below the ground plane; "resting" sits its base exactly at y=0.
 */
function getGroundOffsets(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  return {
    hidden: -box.max.y - 0.1,
    resting: -box.min.y,
  };
}

function applyFlatMaterial(object: THREE.Object3D, color: THREE.Color) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.75,
        metalness: 0.05,
      });
    }
  });
}

export function ExperienceScene() {
  const { scene, camera } = useThree();

  const patioShape = React.useMemo(() => buildPatioShape(), []);

  const groundRef = React.useRef<THREE.Mesh>(null);
  const sunRef = React.useRef<THREE.DirectionalLight>(null);
  const ambientRef = React.useRef<THREE.AmbientLight>(null);
  const saunaGroupRef = React.useRef<THREE.Group>(null);
  const loungeGroupRef = React.useRef<THREE.Group>(null);
  const firePitGroupRef = React.useRef<THREE.Group>(null);
  const fireGlowRef = React.useRef<THREE.PointLight>(null);
  const saunaGlowRef = React.useRef<THREE.PointLight>(null);
  const fogRef = React.useRef<THREE.Fog>(null);
  const patioRef = React.useRef<THREE.Mesh>(null);
  const shrubRefs = React.useRef<(THREE.Group | null)[]>([]);
  const flameRefs = React.useRef<(THREE.Mesh | null)[]>([]);
  const fairyLightRefs = React.useRef<(THREE.Mesh | null)[]>([]);

  const sauna = useGLTF("/experience/models/sauna.glb");
  const lounge = useGLTF("/experience/models/lounge-fire-pit.glb");
  const firePit = useGLTF("/experience/models/fire-pit-chair.glb");

  // Per-model ground offsets, computed once the geometry is available.
  const offsets = React.useMemo(
    () => ({
      sauna: getGroundOffsets(sauna.scene),
      lounge: getGroundOffsets(lounge.scene),
      firePit: getGroundOffsets(firePit.scene),
    }),
    [sauna, lounge, firePit],
  );

  // Apply a single flat placeholder tone per prop (real materials come later).
  React.useEffect(() => {
    applyFlatMaterial(sauna.scene, SAUNA_TIMBER);
    applyFlatMaterial(lounge.scene, LOUNGE_TONE);
    applyFlatMaterial(firePit.scene, FIRE_PIT_TONE);
  }, [sauna, lounge, firePit]);

  React.useEffect(() => {
    // react-three-fiber's scene graph is imperative by design: `scene` and
    // `camera` from useThree() are meant to be mutated directly, unlike
    // typical React hook return values.
    // eslint-disable-next-line react-hooks/immutability
    scene.background = SKY_START.clone();
    // eslint-disable-next-line react-hooks/immutability
    camera.near = 0.1;

    camera.far = 100;
    camera.updateProjectionMatrix();
  }, [scene, camera]);

  useFrame((state) => {
    const p = progressStore.value;
    const elapsed = state.clock.getElapsedTime();

    // Sky & ground colour journey — the through-line of the whole piece.
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(SKY_START).lerp(SKY_END, p);
      if (fogRef.current) {
        fogRef.current.color.copy(scene.background);
      }
    }
    if (groundRef.current) {
      const mat = groundRef.current.material as THREE.MeshStandardMaterial;
      mat.color
        .copy(GROUND_START)
        .lerp(GROUND_END, easeOutCubic(remap(p, 0.05, 0.35)));
    }

    // Light journey: flat/cool -> warm/golden, and brightening overall.
    if (sunRef.current) {
      sunRef.current.intensity = 0.6 + p * 1.8;
      sunRef.current.color.setHSL(
        0.13 - p * 0.05,
        0.5 + p * 0.3,
        0.55 + p * 0.15,
      );
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.5 + p * 0.3;
    }

    // Sauna rises into view mid-timeline.
    if (saunaGroupRef.current) {
      const reveal = easeOutCubic(remap(p, 0.35, 0.6));
      saunaGroupRef.current.position.y = THREE.MathUtils.lerp(
        offsets.sauna.hidden,
        offsets.sauna.resting,
        reveal,
      );
      saunaGroupRef.current.scale.setScalar(0.85 + reveal * 0.15);
    }

    // Lounge/fire-pit set arrives after the sauna.
    if (loungeGroupRef.current) {
      const reveal = easeOutCubic(remap(p, 0.55, 0.8));
      loungeGroupRef.current.position.y = THREE.MathUtils.lerp(
        offsets.lounge.hidden,
        offsets.lounge.resting,
        reveal,
      );
      loungeGroupRef.current.scale.setScalar(0.85 + reveal * 0.15);
    }

    // The standalone fire pit + chair arrives last, completing the scene.
    if (firePitGroupRef.current) {
      const reveal = easeOutCubic(remap(p, 0.72, 0.95));
      firePitGroupRef.current.position.y = THREE.MathUtils.lerp(
        offsets.firePit.hidden,
        offsets.firePit.resting,
        reveal,
      );
      firePitGroupRef.current.scale.setScalar(0.85 + reveal * 0.15);
    }

    // Warm glow lights ignite as their props settle in — this is what the
    // bloom pass catches to give the scene actual atmosphere instead of flat
    // shading. Sauna glow suggests warmth glimpsed through the door; the fire
    // pit glow anticipates the eventual flame.
    if (saunaGlowRef.current) {
      const reveal = easeOutCubic(remap(p, 0.45, 0.65));
      saunaGlowRef.current.intensity = reveal * 3.5;
    }
    const fireReveal = easeOutCubic(remap(p, 0.8, 1));
    if (fireGlowRef.current) {
      fireGlowRef.current.intensity = fireReveal * 6;
    }

    // Flame tongues ignite alongside the glow light — each flickers on its
    // own frequency/phase so the fire reads as alive rather than a uniform
    // pulse.
    FLAME_TONGUES.forEach((tongue, i) => {
      const mesh = flameRefs.current[i];
      if (!mesh) return;
      const flicker = Math.sin(elapsed * tongue.freq + tongue.phase);
      mesh.scale.set(
        1 + flicker * 0.08,
        1 + flicker * 0.15,
        1 + flicker * 0.08,
      );
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = fireReveal * 0.95;
    });

    // Fairy lights come on before the fire, then twinkle gently.
    const fairyReveal = easeOutCubic(remap(p, 0.5, 0.7));
    FAIRY_LIGHTS.forEach((light, i) => {
      const mesh = fairyLightRefs.current[i];
      if (!mesh) return;
      const twinkle = 0.75 + Math.sin(elapsed * 2 + light.phase) * 0.25;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = fairyReveal * twinkle;
    });

    // Paving fades in as the ground transforms, grounding the sauna in an
    // actual gathering space rather than bare earth.
    if (patioRef.current) {
      const mat = patioRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = easeOutCubic(remap(p, 0.15, 0.4));
    }

    // Shrubs grow in one by one across the timeline, staggered so the garden
    // fills in gradually rather than popping in all at once.
    SHRUBS.forEach((shrub, i) => {
      const group = shrubRefs.current[i];
      if (!group) return;
      const reveal = easeOutCubic(remap(p, shrub.range[0], shrub.range[1]));
      group.scale.setScalar(reveal * shrub.base);
    });

    // A slow, cinematic camera dolly — pulls back and rises slightly. The
    // look-at target rises with it too, so the horizon (and sky) comes into
    // frame by the end instead of the camera staying pitched down at the
    // ground the whole time.
    const camReveal = easeOutCubic(p);
    camera.position.set(
      4.5 - camReveal * 1.5,
      2.4 + camReveal * 0.8,
      6.5 - camReveal * 2,
    );
    camera.lookAt(0, 0.4 + camReveal * 1.3, 0);
  });

  return (
    <>
      <fog ref={fogRef} attach="fog" args={[SKY_START, 18, 62]} />

      <ambientLight ref={ambientRef} intensity={0.5} />
      <directionalLight ref={sunRef} position={[4, 6, 3]} intensity={0.6} />

      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color={GROUND_START} roughness={0.95} />
      </mesh>

      {TREES.map((tree) => (
        <group
          key={tree.position.join(",")}
          position={[tree.position[0], tree.position[1], tree.position[2]]}
        >
          <Tree scale={tree.scale} />
        </group>
      ))}

      <mesh
        ref={patioRef}
        position={[0, 0.02, -0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <shapeGeometry args={[patioShape]} />
        <meshStandardMaterial
          color={PATIO_STONE}
          roughness={0.85}
          transparent
          opacity={0}
        />
      </mesh>

      {SHRUBS.map((shrub, i) => (
        <group
          key={shrub.position.join(",")}
          ref={(el) => {
            shrubRefs.current[i] = el;
          }}
          position={[shrub.position[0], shrub.position[1], shrub.position[2]]}
          scale={0}
        >
          <Shrub />
        </group>
      ))}

      <group
        ref={saunaGroupRef}
        position={[0, 0, -0.6]}
        rotation={[0, THREE.MathUtils.degToRad(35), 0]}
      >
        <primitive object={sauna.scene} />
      </group>

      <group
        ref={loungeGroupRef}
        position={[2.1, 0, 0.9]}
        scale={0.6}
        rotation={[0, THREE.MathUtils.degToRad(-25), 0]}
      >
        <primitive object={lounge.scene} />
      </group>

      <group
        ref={firePitGroupRef}
        position={[-2.0, 0, 0.9]}
        scale={0.7}
        rotation={[0, THREE.MathUtils.degToRad(25), 0]}
      >
        <primitive object={firePit.scene} />
      </group>

      <pointLight
        ref={saunaGlowRef}
        color={SAUNA_GLOW}
        position={[0.3, 0.5, -0.2]}
        intensity={0}
        distance={4}
        decay={2}
      />
      <pointLight
        ref={fireGlowRef}
        color={FIRE_GLOW}
        position={[-1.8, 0.3, 0.9]}
        intensity={0}
        distance={5}
        decay={2}
      />

      <group position={[-1.8, 0.08, 0.9]}>
        {FLAME_TONGUES.map((tongue, i) => (
          <mesh
            key={`${tongue.xOffset}-${tongue.zOffset}`}
            ref={(el) => {
              flameRefs.current[i] = el;
            }}
            position={[tongue.xOffset, tongue.height / 2, tongue.zOffset]}
          >
            <coneGeometry args={[tongue.radius, tongue.height, 6]} />
            <meshBasicMaterial color={tongue.color} transparent opacity={0} />
          </mesh>
        ))}
      </group>

      {FAIRY_LIGHTS.map((light, i) => (
        <mesh
          key={light.position.join(",")}
          ref={(el) => {
            fairyLightRefs.current[i] = el;
          }}
          position={[light.position[0], light.position[1], light.position[2]]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial
            color={FAIRY_LIGHT_COLOR}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </>
  );
}

useGLTF.preload("/experience/models/sauna.glb");
useGLTF.preload("/experience/models/lounge-fire-pit.glb");
useGLTF.preload("/experience/models/fire-pit-chair.glb");
