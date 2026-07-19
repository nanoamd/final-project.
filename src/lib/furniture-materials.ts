/**
 * Deterministic, no-AI material recommendation for outdoor furniture.
 * Every fact here is well-established material science / industry knowledge
 * (teak's natural oil content, aluminium's corrosion resistance, natural
 * rattan's unsuitability outdoors, etc.) — nothing product-specific or
 * fabricated, since there's no real garden furniture inventory yet.
 */

export type Exposure = "full" | "partial" | "covered";
export type MaintenanceAppetite = "none" | "low" | "moderate";
export type Priority =
  "low-maintenance" | "natural-look" | "budget" | "lightweight" | "sustainable";

export interface MaterialProfile {
  id: string;
  name: string;
  /** Minimum shelter the material tolerates without damage. */
  minExposureTolerance: Exposure;
  maintenance: MaintenanceAppetite;
  costTier: "budget" | "mid" | "premium";
  strengths: Priority[];
  summary: string;
  tradeOffs: string;
}

const EXPOSURE_RANK: Record<Exposure, number> = {
  covered: 0,
  partial: 1,
  full: 2,
};

export const MATERIALS: MaterialProfile[] = [
  {
    id: "teak",
    name: "Teak",
    minExposureTolerance: "full",
    maintenance: "none",
    costTier: "premium",
    strengths: ["low-maintenance", "natural-look"],
    summary:
      "A dense tropical hardwood with a naturally high oil content that resists rot, insects and water without any treatment.",
    tradeOffs:
      "Can stay outdoors year-round uncovered. Left untreated it silvers to a grey patina within a year or two — cosmetic only, not a sign of decay; an occasional teak oil application keeps the original honey colour if you prefer that look. The most expensive common option, and heavy (which also means stable in wind).",
  },
  {
    id: "eucalyptus",
    name: "Eucalyptus / FSC hardwood",
    minExposureTolerance: "partial",
    maintenance: "low",
    costTier: "mid",
    strengths: ["natural-look", "sustainable", "budget"],
    summary:
      "A faster-growing hardwood with similar natural oils to teak, often FSC-certified, at a significantly lower price.",
    tradeOffs:
      "Less naturally durable long-term than teak — benefits from an annual oil or sealant application, especially where it cycles between wet and dry. A good sustainable, natural-wood look without teak's price.",
  },
  {
    id: "aluminium",
    name: "Powder-coated aluminium",
    minExposureTolerance: "full",
    maintenance: "none",
    costTier: "mid",
    strengths: ["low-maintenance", "lightweight"],
    summary:
      "Aluminium doesn't rust the way steel or iron does, making it one of the lowest-maintenance frame materials outdoors.",
    tradeOffs:
      "Powder coating adds UV and scratch resistance; if it chips, the exposed aluminium underneath still won't rust, though it may look worn. Lightweight enough to move seasonally, which also means it's less stable in high wind than heavier materials. Handles coastal salt air well.",
  },
  {
    id: "wrought-iron",
    name: "Wrought iron / steel",
    minExposureTolerance: "full",
    maintenance: "moderate",
    costTier: "mid",
    strengths: ["natural-look"],
    summary:
      "Heavy, ornate and extremely stable in wind — the classic look for traditional garden furniture.",
    tradeOffs:
      "Prone to rust once paint or powder coating chips, particularly near coastal salt air — needs more vigilant touch-up than aluminium. Usually cheaper than teak but far heavier to move once placed.",
  },
  {
    id: "synthetic-rattan",
    name: "All-weather (synthetic) rattan",
    minExposureTolerance: "full",
    maintenance: "none",
    costTier: "mid",
    strengths: ["low-maintenance"],
    summary:
      "UV-stabilised resin woven over an aluminium or steel frame, built to stay outside year-round without rotting or fading quickly.",
    tradeOffs:
      "Wipes clean, no oiling or sealing needed. The frame material underneath determines rust resistance — aluminium-framed versions handle damp gardens best. Looks similar to natural rattan without its weather vulnerability.",
  },
  {
    id: "natural-rattan",
    name: "Natural rattan / wicker",
    minExposureTolerance: "covered",
    maintenance: "moderate",
    costTier: "budget",
    strengths: ["natural-look", "budget"],
    summary:
      "A genuine woven natural fibre, but not built to handle rain — absorbs moisture and mildews if left exposed.",
    tradeOffs:
      "Best suited to a covered porch, conservatory, or furniture you're happy to bring in or cover whenever it isn't in use. Cheaper than synthetic rattan but a shorter outdoor lifespan if exposed.",
  },
  {
    id: "hdpe",
    name: "Recycled HDPE plastic",
    minExposureTolerance: "full",
    maintenance: "none",
    costTier: "budget",
    strengths: ["low-maintenance", "budget", "sustainable"],
    summary:
      "Solid recycled plastic (the material behind most Adirondack-style furniture) that won't rot, rust or attract insects.",
    tradeOffs:
      "Colour runs through the material, so scratches don't show white through paint the way painted wood does. Fully hose-down washable. Heavier than it looks, which helps it resist tipping in wind. One of the more affordable and environmentally-friendly options.",
  },
];

export interface MaterialQuizAnswers {
  exposure: Exposure;
  maintenance: MaintenanceAppetite;
  priorities: Priority[];
}

const MAINTENANCE_RANK: Record<MaintenanceAppetite, number> = {
  none: 0,
  low: 1,
  moderate: 2,
};

export function recommendMaterials(
  answers: MaterialQuizAnswers,
): MaterialProfile[] {
  const eligible = MATERIALS.filter(
    (m) =>
      EXPOSURE_RANK[m.minExposureTolerance] >= EXPOSURE_RANK[answers.exposure],
  );

  const scored = eligible.map((material) => {
    let score = 0;

    // Closer maintenance match scores higher; penalise materials that need
    // more upkeep than the user wants.
    const maintenanceGap =
      MAINTENANCE_RANK[material.maintenance] -
      MAINTENANCE_RANK[answers.maintenance];
    score += maintenanceGap <= 0 ? 2 : -maintenanceGap;

    for (const priority of answers.priorities) {
      if (material.strengths.includes(priority)) score += 2;
    }

    return { material, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.material);
}
