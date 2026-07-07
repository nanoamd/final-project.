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
 * This is a first vertical slice: ground colour, sky/light journey, and the
 * two approved props (sauna, lounge/fire-pit) staged in on scroll. Materials
 * are flat placeholder tones for now — the full art-directed "skin" pass
 * (Phase 4/5) comes once more props are approved.
 */

const SKY_START = new THREE.Color("#c7c2b8"); // flat, overcast
const SKY_END = new THREE.Color("#1c2436"); // blue-hour dusk

const GROUND_START = new THREE.Color("#8a8672"); // patchy, dry
const GROUND_END = new THREE.Color("#33502f"); // lush green

const SAUNA_TIMBER = new THREE.Color("#2a1d14");
const LOUNGE_TONE = new THREE.Color("#3a362c");

/** Remap a value from [inMin, inMax] to [0, 1], clamped. */
function remap(value: number, inMin: number, inMax: number) {
  return Math.min(1, Math.max(0, (value - inMin) / (inMax - inMin)));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function ExperienceScene() {
  const { scene, camera } = useThree();

  const groundRef = React.useRef<THREE.Mesh>(null);
  const sunRef = React.useRef<THREE.DirectionalLight>(null);
  const ambientRef = React.useRef<THREE.AmbientLight>(null);
  const saunaGroupRef = React.useRef<THREE.Group>(null);
  const loungeGroupRef = React.useRef<THREE.Group>(null);

  const sauna = useGLTF("/experience/models/sauna.glb");
  const lounge = useGLTF("/experience/models/lounge-fire-pit.glb");

  // Apply a single flat placeholder tone per prop (real materials come later).
  React.useEffect(() => {
    sauna.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: SAUNA_TIMBER,
          roughness: 0.75,
          metalness: 0.05,
        });
      }
    });
    lounge.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: LOUNGE_TONE,
          roughness: 0.7,
          metalness: 0.1,
        });
      }
    });
  }, [sauna, lounge]);

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
      saunaGroupRef.current.position.y = -1.2 + reveal * 1.2;
      saunaGroupRef.current.scale.setScalar(0.85 + reveal * 0.15);
    }

    // Lounge/fire-pit set arrives after the sauna.
    if (loungeGroupRef.current) {
      const reveal = easeOutCubic(remap(p, 0.55, 0.8));
      loungeGroupRef.current.position.y = -1.2 + reveal * 1.2;
      loungeGroupRef.current.scale.setScalar(0.85 + reveal * 0.15);
    }

    // A slow, cinematic camera dolly — pulls back and rises slightly.
    const camReveal = easeOutCubic(p);
    camera.position.set(
      4.5 - camReveal * 1.5,
      2.4 + camReveal * 0.8,
      6.5 - camReveal * 2,
    );
    camera.lookAt(0, 0.4, 0);
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} />
      <directionalLight ref={sunRef} position={[4, 6, 3]} intensity={0.6} />

      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={GROUND_START} roughness={0.95} />
      </mesh>

      <group ref={saunaGroupRef} position={[-1.4, -1.2, -0.5]}>
        <primitive object={sauna.scene} />
      </group>

      <group ref={loungeGroupRef} position={[1.6, -1.2, 0.8]} scale={0.6}>
        <primitive object={lounge.scene} />
      </group>
    </>
  );
}

useGLTF.preload("/experience/models/sauna.glb");
useGLTF.preload("/experience/models/lounge-fire-pit.glb");
