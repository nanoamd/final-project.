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
const SKY_END = new THREE.Color("#1c2436"); // blue-hour dusk

const GROUND_START = new THREE.Color("#8a8672"); // patchy, dry
const GROUND_END = new THREE.Color("#33502f"); // lush green

const SAUNA_TIMBER = new THREE.Color("#2a1d14");
const LOUNGE_TONE = new THREE.Color("#3a362c");
const FIRE_PIT_TONE = new THREE.Color("#26221d");

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

  const groundRef = React.useRef<THREE.Mesh>(null);
  const sunRef = React.useRef<THREE.DirectionalLight>(null);
  const ambientRef = React.useRef<THREE.AmbientLight>(null);
  const saunaGroupRef = React.useRef<THREE.Group>(null);
  const loungeGroupRef = React.useRef<THREE.Group>(null);
  const firePitGroupRef = React.useRef<THREE.Group>(null);

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

  useFrame(() => {
    const p = progressStore.value;

    // Sky & ground colour journey — the through-line of the whole piece.
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(SKY_START).lerp(SKY_END, p);
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
      <ambientLight ref={ambientRef} intensity={0.5} />
      <directionalLight ref={sunRef} position={[4, 6, 3]} intensity={0.6} />

      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={GROUND_START} roughness={0.95} />
      </mesh>

      <group ref={saunaGroupRef} position={[-1.4, 0, -0.5]}>
        <primitive object={sauna.scene} />
      </group>

      <group ref={loungeGroupRef} position={[1.6, 0, 0.8]} scale={0.6}>
        <primitive object={lounge.scene} />
      </group>

      <group ref={firePitGroupRef} position={[-0.3, 0, 1.5]} scale={0.7}>
        <primitive object={firePit.scene} />
      </group>
    </>
  );
}

useGLTF.preload("/experience/models/sauna.glb");
useGLTF.preload("/experience/models/lounge-fire-pit.glb");
useGLTF.preload("/experience/models/fire-pit-chair.glb");
