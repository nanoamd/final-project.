"use client";

import { Canvas } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as React from "react";
import { NoToneMapping } from "three";

import { ExperienceScene } from "@/features/experience/components/scene/experience-scene";

export function ExperienceCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 35, position: [4.5, 2.4, 6.5] }}
      className="!absolute inset-0"
      gl={{ toneMapping: NoToneMapping }}
    >
      <React.Suspense fallback={null}>
        <ExperienceScene />
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.6}
            luminanceThreshold={0.35}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette
            eskil={false}
            offset={0.25}
            darkness={0.55}
            blendFunction={BlendFunction.NORMAL}
          />
          <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
        </EffectComposer>
      </React.Suspense>
    </Canvas>
  );
}
