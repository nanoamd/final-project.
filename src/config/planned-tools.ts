/**
 * Tools & calculators planned per department but not yet built (see the
 * "Tools & Calculators" section of the content strategy blueprint). Shown as
 * "coming soon" placeholders on the product page's Tools column, so the
 * roadmap is visible before each one ships — not a live catalogue, just
 * short display names.
 */
export const PLANNED_TOOLS_BY_DEPARTMENT: Record<string, string[]> = {
  "outdoor-living": [
    "Garden Furniture Material & Weather Resilience Selector",
    "Patio/Deck Size & Furniture Layout Calculator",
  ],
  sauna: ["Sauna Ventilation & Heat Retention Checker"],
  "cold-plunge": [
    "Cold Plunge Chiller Sizing Calculator",
    "Cold Plunge Drainage & Water Change Planner",
  ],
  "outdoor-kitchen": ["Outdoor Kitchen Layout & Utility Planner"],
  "living-room": [
    "Sofa Size & Seating Capacity Calculator",
    "Living Room Rug Size Calculator",
  ],
  bedroom: [
    "Mattress & Bed Frame Size Fit Calculator",
    "Wardrobe & Closet Storage Capacity Calculator",
  ],
  kitchen: [
    "Kitchen Island / Table Clearance Calculator",
    "Kitchen Storage & Pantry Capacity Planner",
  ],
  bathroom: [
    "Bathroom Vanity Size & Clearance Calculator",
    "Small Bathroom Space Optimizer",
  ],
  office: [
    "Desk Size & Ergonomic Fit Calculator",
    "Home Office Layout & Video-Call Background Planner",
  ],
  lighting: [
    "Room Lighting Layer Planner (Lumens & Layering Calculator)",
    "Pendant/Chandelier Drop Height & Size Calculator",
  ],
};
