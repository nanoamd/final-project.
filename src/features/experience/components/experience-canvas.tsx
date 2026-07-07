"use client";

import { Canvas } from "@react-three/fiber";
import * as React from "react";

import { ExperienceScene } from "@/features/experience/components/scene/experience-scene";

export function ExperienceCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 35, position: [4.5, 2.4, 6.5] }}
      className="!absolute inset-0"
    >
      <React.Suspense fallback={null}>
        <ExperienceScene />
      </React.Suspense>
    </Canvas>
  );
}
