/**
 * Hand-written product names for the Aosom range.
 *
 * Damien: "these aosom titles dont match the website at all, they need to be
 * simple, and unbranded just like every other product and have | kaiku at the
 * end" — and then, of the regex attempt at it, "im not happy with this". He was
 * right. Chopping a marketplace title at seventy characters produced names
 * ending on "Home", "Upholstered" and "Post". Naming a product is judgement,
 * not pattern-matching, so these are written out one at a time.
 *
 * Keyed by slug because a slug never changes, so this file stays correct
 * however many times a title is rewritten.
 *
 * The house style, taken from the products Damien has pointed at as right:
 *
 *     Solenne Table Lamp with Edged Linen Shade | Kaiku
 *     Reclaimed Teak Dining Table 180cm | Kaiku
 *
 * What that means in practice — what a thing is, the one detail that
 * distinguishes it, and the finish. A size stays when it defines the product
 * (3ft Single, 50,000 BTU, 6-Seater) and goes when it is packaging detail.
 * Room lists, "bulbs not included", colour-temperature ranges and wattage all
 * come out of the name; they belong in the specification table, where somebody
 * looking for them will find them.
 *
 * The `| Kaiku` suffix is added by the applying script, not repeated here.
 */
export const AOSOM_TITLES: Record<string, string> = {
  // ---- Beds ------------------------------------------------------------
  "3ft-single-bed-frame-metal-platform-bed-frame-with-ood-slats-no-box-spring-needed-underbed":
    "3ft Single Metal Bed Frame with Underbed Storage, Black",
  "3ft-single-bed-frame-with-headboard-and-footboard-metal-platform-bed-frame-with-32-cm-unde":
    "3ft Single Bed Frame with Headboard and Footboard, Black",
  "3ft-single-bed-frame-with-underbed-storage-metal-platform-bed-frame-with-steel-slat-suppor":
    "3ft Single Bed Frame with Underbed Storage, Black",
  "4ft6-double-bed-frame-with-underbed-storage-and-steel-slat-support-32-5-cm-height-noise-fr":
    "4ft6 Double Bed Frame with Underbed Storage, Black",
  "4ft6-double-ottoman-bed-frame-with-front-drawer-cream":
    "4ft6 Double Ottoman Bed with Front Drawer, Cream",
  "5ft-king-bed-frame-with-headboard-platform-bed-frame-with-hydraulic-storage-led-lights-and":
    "5ft King Bed Frame with Hydraulic Storage and LED Lighting, Grey",
  "king-size-bed-frame-gas-end-lift-under-bed-storage-upholstered-platform-bed-tufted-headboa":
    "King Size Gas-Lift Ottoman Bed with Tufted Headboard",
  "metal-bunk-bed-with-desk-high-sleeper-bed-with-led-light-and-safety-guardrail-for-teens-ad":
    "Metal High Sleeper Bunk Bed with Desk",
  "pine-storage-bed-3ft-single-solid-wooden-bed-frame-with-drawers-headboard-wood-slat-suppor":
    "3ft Single Pine Storage Bed with Drawers",

  // ---- Desks -----------------------------------------------------------
  "compact-computer-desk-with-keyboard-tray-and-drawer-study-desk-writing-desk-for-home-offic":
    "Compact Computer Desk with Keyboard Tray, Grey",
  "compact-folding-desk-for-small-spaces-with-storage-shelf-for-home-office-rustic-brown":
    "Compact Folding Desk with Storage Shelf, Rustic Brown",
  "computer-desk-home-office-study-table-with-hutch-shelf-cup-holder-headphone-hook-black":
    "Computer Desk with Hutch Shelf, Black",
  "computer-desk-with-drawers-and-storage-shelves-office-desk-writing-table-with-printer-stan":
    "Computer Desk with Drawers and Printer Stand, Oak",
  "computer-desk-with-sliding-keyboard-tray-storage-drawer-shelf-home-office-workstation-grey":
    "Computer Desk with Sliding Keyboard Tray, Grey",
  "computer-desk-writing-table-pc-workstation-with-3-storage-shelves-and-drawers-handle-for-h":
    "Computer Desk with Three Shelves and Drawers, Black",
  "folding-convertible-desk-with-blackboard-multi-function-computer-office-workstation-side-s":
    "Folding Convertible Desk with Blackboard, Grey",
  "folding-shelf-and-work-table-natural":
    "Folding Wall-Mounted Work Table, Natural",
  "led-computer-desk-with-power-outlets-and-shelves-carbon-fibre-grey":
    "LED Computer Desk with Power Outlets, Carbon Fibre Grey",
  "led-computer-desk-with-power-outlets-and-shelves-rustic-brown":
    "LED Computer Desk with Power Outlets, Rustic Brown",
  "modern-computer-desk-home-office-table-small-writing-desk-with-storage-shelf-white-wood-gr":
    "Modern Writing Desk with Storage Shelf, White Wood Grain",
  "multi-storage-work-desk-with-sliding-keyboard-tray-brown-black":
    "Multi-Storage Work Desk with Sliding Keyboard Tray, Brown",

  // ---- Fire Pits & Heating --------------------------------------------
  "11-kw-freestanding-gas-patio-heater-adjustable-outdoor-garden-propane-heater-with-tip-over":
    "11kW Freestanding Gas Patio Heater, Black",
  "11kw-adjustable-heat-gas-patio-heater": "11kW Adjustable Gas Patio Heater",
  "14-5-kw-rattan-gas-fire-pit-dining-table-with-rain-cover-wind-guard-lid-lava-rocks-dark-gr":
    "14.5kW Rattan Gas Fire Pit Dining Table, Dark Grey",
  "14-5-kw-rattan-gas-fire-pit-dining-table-with-rain-cover-wind-guard-lid-lava-rocks-grey":
    "14.5kW Rattan Gas Fire Pit Dining Table, Grey",
  "40000-btu-gas-firepit-table-black-dark-grey":
    "40,000 BTU Gas Fire Pit Table, Dark Grey",
  "50-000-btu-gas-fire-pit-table-with-cover-and-glass-screen-dark-grey":
    "50,000 BTU Gas Fire Pit Table with Glass Screen, Dark Grey",
  "50-000-btu-gas-fire-pit-table-with-cover-dark-grey":
    "50,000 BTU Gas Fire Pit Table with Cover, Dark Grey",
  "adjustable-power-1000-2500w-infrared-halogen-electric-patio-light-heater-ceiling-hanging-m":
    "Ceiling-Mounted Infrared Halogen Patio Heater",
  "hanging-electric-patio-heater-with-2-power-settings-1000-2000w-waterproof-ceiling-mounted-":
    "Hanging Electric Patio Heater, Black",
  "outsunny-50-000-btu-gas-fire-pit-table-with-cover-and-glass-screen-grey":
    "50,000 BTU Gas Fire Pit Table with Glass Screen, Grey",
  "outsunny-71-x-71cm-40000-btu-gas-firepit-table-black-grey":
    "40,000 BTU Gas Fire Pit Table 71cm, Grey",
  "outsunny-71cm-50-000-btu-gas-fire-pit-table-with-cover-and-glass-screen-grey":
    "50,000 BTU Gas Fire Pit Table 71cm with Glass Screen, Grey",
  "outsunny-81-x-81cm-50-000-btu-gas-fire-pit-table-grey":
    "50,000 BTU Gas Fire Pit Table 81cm, Grey",
  "outsunny-81cm-50000-btu-gas-fire-pit-table-black":
    "50,000 BTU Gas Fire Pit Table 81cm, Black",
  "outsunny-outdoor-pe-rattan-gas-fire-pit-table-patio-square-propane-heater-with-rain-cover-":
    "PE Rattan Gas Fire Pit Table, Mixed Grey",
  "outsunny-rattan-style-propane-gas-fire-pit-table-with-40-000-btu-burner-square-smokeless-f":
    "Rattan-Style Propane Gas Fire Pit Table, Black",
  "outsunny-square-propane-gas-fire-pit-table-40000-btu-rattan-smokeless-firepit-patio-heater":
    "Square Propane Gas Fire Pit Table, Black",
  "patio-parasol-heater-electric-umbrella-mounted-heater-for-25-70-mm-poles":
    "Parasol-Mounted Electric Patio Heater",
  "propane-gas-fire-pit-table-for-garden-11-7-kw-smokeless-firepit-outdoor-heater-with-wind-g":
    "11.7kW Propane Gas Fire Pit Table, Black",
  "rattan-style-propane-gas-fire-pit-table-with-40-000-btu-burner-square-smokeless-firepit-pa":
    "Rattan-Style Propane Gas Fire Pit Table, Grey",
  "smokeless-fire-pit-portable-wood-burning-firepit-with-poker-for-garden-camping-bonfire-par":
    "Portable Smokeless Wood-Burning Fire Pit, Silver",

  // ---- Garden Furniture ------------------------------------------------
  "outsunny-4-piece-l-shaped-garden-furniture-set-8-seater-aluminium-outdoor-dining-set-conve":
    "L-Shaped 8-Seater Aluminium Garden Dining Set with Bench, Grey",
  "outsunny-5-piece-rattan-patio-furniture-set-with-gas-fire-pit-table-loveseat-sofa-armchair":
    "5-Piece Rattan Garden Set with Gas Fire Pit Table, Grey",
  "outsunny-5-seater-aluminium-garden-furniture-set-garden-sofa-set-with-thick-cushions-for-p":
    "5-Seater Aluminium Garden Sofa Set, Grey",
  "outsunny-6-piece-aluminium-garden-furniture-set-with-fire-pit-table-outdoor-dining-sofa-se":
    "6-Piece Aluminium Garden Set with Fire Pit Table, Grey",
  "outsunny-6-piece-outdoor-couch-sectional-sofa-set-with-aluminum-patio-conversation-furnitu":
    "6-Piece Aluminium Sectional Garden Sofa Set, Grey",
  "outsunny-6-pieces-outdoor-pe-rattan-wicker-corner-sofa-set-with-10cm-thick-padded-cushions":
    "6-Piece Rattan Corner Sofa Set with Glass-Top Table, Grey",
  "outsunny-6-seater-garden-dining-set-with-stackable-chairs-aluminium-frame-rectangular-plas":
    "6-Seater Garden Dining Set with Stackable Chairs",
  "outsunny-6-seater-rattan-dining-set-with-cushions-grey":
    "6-Seater Rattan Dining Set with Cushions, Grey",
  "outsunny-7-seater-patio-wicker-sofa-set-rattan-chair-furniture-w-glass-cushioned-dark-blue":
    "7-Seater Rattan Sofa Set with Glass-Top Table, Dark Blue",
  "outsunny-8-seater-garden-rattan-furniture-rattan-corner-dining-sofa-set-wicker-conservator":
    "8-Seater Rattan Corner Dining Set with Footstool, Black",
  "outsunny-all-season-fire-pit-patio-furniture-set-wicker-sofa-set-with-50000-btu-fire-table":
    "All-Season Rattan Sofa Set with 50,000 BTU Fire Table, Grey",
  "outsunny-five-piece-aluminium-garden-sofa-set-with-glass-top-table-grey":
    "5-Piece Aluminium Garden Sofa Set with Glass-Top Table, Grey",
  "outsunny-seven-piece-firepit-table-rattan-sofa-set-grey":
    "7-Piece Rattan Sofa Set with Fire Pit Table, Grey",
  "outsunny-six-piece-rattan-strong-garden-sofa-set-with-removable-and-washable-covers-grey":
    "6-Piece Rattan Garden Sofa Set with Washable Covers, Grey",

  // ---- Garden Lighting -------------------------------------------------
  "1-8m-traditional-victorian-style-3-way-head-outdoor-garden-solar-post-lamp-sensor-dimmable":
    "1.8m Victorian Three-Head Solar Lamp Post, Black",
  "2-pcs-1-3m-garden-solar-lamp-post-lights-solar-powered-led-lantern-patio-pathway-walkway-o":
    "1.3m Solar Lamp Post Lights, Set of 2, Black",
  "2-pieces-outdoor-garden-solar-post-lamp-sensor-dimmable-led-lantern-bollard-pathway-1-6m-t":
    "1.6m Dimmable Solar Bollard Lights, Set of 2, Black",
  "3-head-solar-lamp-post-street-light-with-planter-automatic-on-6-hour-max-outdoor-ready-led":
    "Three-Head Solar Lamp Post with Planter, Black",
  "boho-rattan-floor-lamp-3-lights-rattan-lamp-with-shelf-freestanding-solar-garden-light-wit":
    "Boho Rattan Solar Floor Lamp with Shelf, Yellow",
  "garden-solar-lamp-post-light-waterproof-led-solar-light-post-with-planter-black":
    "Solar Lamp Post Light with Planter, Black",
  "outdoor-garden-solar-post-lamp-sensor-dimmable-led-lantern-bollard-pathway-1-6m-tall-black":
    "1.6m Dimmable Solar Bollard Light, Black",
  "outdoor-garden-solar-post-lamp-sensor-light-led-lantern-bollard-pathway-torch-light-1-77m-":
    "1.77m Solar Bollard Lantern, Black",
  "rattan-solar-floor-lamp-tall-outdoor-garden-lantern-pathway-light-and-decorative-lighting-with":
    "Rattan Solar Floor Lantern, Grey",
  "rattan-solar-floor-lamp-tall-outdoor-garden-lantern-pathway-light-decorative-lighting-with":
    "Rattan Solar Floor Lantern, Brown",
  "set-of-2-outdoor-garden-solar-post-lamp-sensor-dimmable-led-lantern-bollard-ip44-energy-sa":
    "1.2m Dimmable Solar Bollard Lights, Set of 2, Black",
  "set-of-two-1-8m-traditional-style-solar-lamp-posts-black":
    "1.8m Traditional Solar Lamp Posts, Set of 2, Black",
  "solar-lamp-post-with-dusk-to-dawn-sensor-street-light-with-3-head-planter-185-cm-black":
    "1.85m Three-Head Solar Lamp Post with Planter, Black",

  // ---- Lighting --------------------------------------------------------
  "crystal-ceiling-light-fixture-39-cm-semi-flush-mount-modern-crystal-chandelier-ceiling-lig":
    "39cm Crystal Semi-Flush Ceiling Light, Silver",
  "crystal-ceiling-light-semi-flush-mount-modern-crystal-chandelier-ceiling-light-e14-base-3-":
    "Three-Light Crystal Semi-Flush Ceiling Light",
  "crystal-chandeliers-k9-droplets-ceiling-light-with-3-e14-bulb-base-pendant-lights-for-livi":
    "K9 Crystal Droplet Chandelier, Three-Light",
  "crystal-chandeliers-with-crystal-pendants-8-light-ceiling-light-for-living-room-bedroom-di":
    "Eight-Light Crystal Pendant Chandelier, Silver",
  "led-ceiling-light-modern-dimmable-ceiling-light-with-wall-switch-remote-control-flush-moun":
    "Dimmable LED Flush Ceiling Light with Remote, Black",
  "led-wall-lamp-2-pack-13w-modern-indoor-spiral-wall-light-colour-temperature-adjustable-300":
    "Spiral LED Wall Lights, Set of 2, Black",
  "led-wall-lamp-2-pack-13w-modern-indoor-spiral-wall-light-colour-temperature-adjustable-3000k":
    "Spiral LED Wall Lights, Set of 2, Silver",
  "led-wall-lamp-2-pack-5w-modern-indoor-starry-wall-light-colour-temperature-adjustable-3000k":
    "Starry LED Wall Lights, Set of 2, Gold",
  "led-wall-lamp-2-pack-9w-modern-indoor-geometric-mesh-wall-light-colour-temperature-adjusta":
    "Geometric Mesh LED Wall Lights, Set of 2, Gold",
  "metal-crystal-ceiling-light-chandelier-elegant-pendant-lamp-living-room-stairway-spiral-ra":
    "Spiral Raindrop Crystal Chandelier, Silver",
  "modern-crystal-ceiling-light-square-crystal-chandelier-for-living-room-dining-room-hall-5-":
    "Square Crystal Chandelier, Five-Light, Silver",
  "modern-crystal-chandelier-ceiling-light-pendant-lamp-chrome-finish-glass-droplets-new-for-":
    "Glass Droplet Pendant Chandelier, Chrome",
  "pendant-light-with-3-colour-temperatures-gold-tone":
    "Pendant Light with Three Colour Temperatures, Gold",
  "pendant-light-with-3-colour-temperatures-silver-tone":
    "Pendant Light with Three Colour Temperatures, Silver",
  "semi-flush-mount-modern-crystal-chandelier-ceiling-light-crystal-ceiling-light-fixture-wit":
    "Crystal Semi-Flush Chandelier, Silver",
  "tiffany-style-ceiling-light-vintage-chandelier-with-3-e27-sockets-semi-flush-mount-for-liv":
    "Tiffany Style Semi-Flush Ceiling Light, Three-Light",

  // ---- Outdoor Kitchens ------------------------------------------------
  "outsunny-4-1-burner-gas-bbq-grill-with-clear-view-lid-portable-gas-barbecue-grill-with-bui":
    "4+1 Burner Gas Barbecue with Side Table, Black",
  "outsunny-five-burner-steel-gas-grill-with-thermometer-black":
    "Five-Burner Steel Gas Barbecue with Thermometer, Black",

  // ---- Pergolas --------------------------------------------------------
  "3-5m-x-3-5m-metal-pergola-gazebo-awning-retractable-canopy-outdoor-garden-sun-shade-shelte":
    "3.5 x 3.5m Metal Pergola with Retractable Canopy, Beige",
  "3-m-x-3-m-garden-gazebo-double-roof-outdoor-gazebo-canopy-shelter-with-netting-solid-steel":
    "3 x 3m Double-Roof Garden Gazebo with Netting",
  "hardtop-gazebo-canopy-with-polycarbonate-roof-aluminium-frame-permanent-gazebo-dark-grey":
    "Hardtop Gazebo with Polycarbonate Roof, Dark Grey",
  "lean-to-steel-pergola-with-moving-fabric-canopy-dark-grey":
    "Lean-To Steel Pergola with Sliding Canopy, Dark Grey",
  "m-patio-gazebo-canopy-garden-pavilion-tent-shelter-with-2-tier-water-repellent-roof-mosqui":
    "Two-Tier Patio Gazebo with Netting and Curtains, Beige",
  "metal-outdoor-pergola-with-retractable-roof-outdoor-gazebo-canopy-shelter-with-drainage-ho":
    "Metal Pergola with Retractable Roof and Drainage, Grey",
  "metal-outdoor-pergola-with-retractable-roof-outdoor-gazebo-with-drainage-holes-for-garden-":
    "Metal Garden Pergola with Retractable Roof, Grey",
  "metal-pergola-with-retractable-roof-and-roller-shade-free-standing-gazebo-canopy-pergola-k":
    "Metal Pergola with Retractable Roof and Roller Shade, Beige",
  "metal-pergola-with-retractable-roof-garden-gazebo-metal-pergola-canopy-for-party-bbq-beige":
    "Metal Pergola with Retractable Roof, Beige",
  "metal-retractable-pergola-garden-gazebo-metal-pergola-canopy-outdoor-sun-shade-shelter-for":
    "Retractable Metal Pergola Canopy, Grey",
  "moving-canopy-metal-pergola-with-curtains-grey":
    "Metal Pergola with Sliding Canopy and Curtains, Grey",
  "outdoor-hardtop-gazebo-with-curtains-lean-to-aluminium-pergola-with-polycarbonate-roof-gar":
    "Lean-To Hardtop Gazebo with Curtains, Grey",
  "outdoor-patio-gazebo-pergola-retractable-pergola-canopy-aluminum-post-pc-roof-grey":
    "Aluminium Patio Pergola with Retractable Canopy, Grey",
  "outsunny-3-x-3-m-lean-to-pergola-with-upf-50-waterproof-polycarbonate-roof-wall-mounted-or":
    "3 x 3m Lean-To Pergola with Polycarbonate Roof, Dark Grey",
  "pop-up-gazebo-double-roof-garden-tent-with-netting-and-carry-bag-party-event-shelter-for-o":
    "Pop-Up Double-Roof Gazebo with Netting and Carry Bag",
  "steel-pergola-with-retractable-canopy-khaki":
    "Steel Pergola with Retractable Canopy, Khaki",
  "wooden-pergola-kit-graden-pergola-gazebo-grape-trellis-with-stable-structure-for-climbing-":
    "Wooden Pergola Kit with Climbing Trellis",

  // ---- Planters --------------------------------------------------------
  "garden-planter-box-with-back-trellis-grey":
    "Garden Planter Box with Back Trellis, Grey",
  "wood-planter-with-trellis-for-climbing-plants-raised-bed-planter-box-with-drainage-holes-t":
    "Raised Wooden Planter with Climbing Trellis, Grey",

  // ---- Privacy Screens -------------------------------------------------
  "decorative-garden-privacy-screen-with-stand-freestanding-metal-outdoor-divider-decorative-":
    "Rhombus Metal Privacy Screen with Stand, Black",
  "decorative-outdoor-divider-metal-privacy-screen-with-stand-triangle-style-black":
    "Triangle Metal Privacy Screen with Stand, Black",
  "decorative-privacy-fence-screen-metal-outdoor-privacy-screen-climbing-plant-trellis-with-s":
    "Metal Privacy Screen and Climbing Trellis, Black",
  "decorative-privacy-screen-with-stand-freestanding-metal-outdoor-divider-decorative-privacy":
    "Willow Branch Metal Privacy Screen with Stand, Black",
  "metal-decorative-privacy-screen-outdoor-divider-black-grid":
    "Grid Metal Privacy Screen, Black",
  "metal-decorative-privacy-screen-outdoor-divider-black-leaf":
    "Leaf Metal Privacy Screen, Black",
  "metal-decorative-privacy-screen-outdoor-divider-black-twisted-lines":
    "Twisted Line Metal Privacy Screen, Black",
  "metal-decorative-privacy-screen-outdoor-divider-green-leaf":
    "Leaf Metal Privacy Screen, Green",

  // ---- Water Features --------------------------------------------------
  "5-tier-outdoor-fountain-cascading-waterfall-feature-with-led-lights-adjustable-flow-rustic":
    "Five-Tier Cascading Fountain with LED Lights, Rustic Brown",
  "5-tier-outdoor-waterfall-fountain-freestanding-self-contained-cascading-water-feature-gard":
    "Five-Tier Freestanding Waterfall Fountain",
  "garden-water-feature-with-led-lights-dark-grey":
    "Garden Water Feature with LED Lights, Dark Grey",
  "outdoor-fountain-with-4-tier-rustic-pots-planter-garden-fountain-with-led-lights-rustic-br":
    "Four-Tier Rustic Pot Fountain with Planter, Rustic Brown",
};

/**
 * Products whose slug is shared with a different product, keyed by document ID.
 *
 * Four Aosom slugs are held by two genuinely different products each — a grey
 * and a natural pine bed, a willow and a banana-leaf screen, a rhombus and a
 * bamboo screen, and a silver and a gold spiral wall light. Two products cannot
 * occupy one URL, so one of each pair is unreachable on the site.
 *
 * That is a separate fault from naming and is reported by the applying script
 * rather than papered over here. These entries exist only so the eight can
 * still be named correctly in the meantime.
 */
export const AOSOM_TITLES_BY_ID: Record<string, string> = {
  "drafts.product-aosom-83d-032v00gy":
    "3ft Single Pine Storage Bed with Drawers, Grey",
  "drafts.product-aosom-83d-032v00nd":
    "3ft Single Pine Storage Bed with Drawers, Natural",
  "drafts.product-aosom-844-610v00bk":
    "Willow Branch Metal Privacy Screen with Stand, Black",
  "drafts.product-aosom-844-633v00bk":
    "Banana Leaf Metal Privacy Screen with Stand, Black",
  "drafts.product-aosom-84j-042v00bk":
    "Rhombus Metal Privacy Screen with Stand, Black",
  "drafts.product-aosom-84j-043v00bk":
    "Bamboo Metal Privacy Screen with Stand, Black",
  "drafts.product-aosom-b31-562v00sr":
    "Spiral LED Wall Lights, Set of 2, Silver",
  "product-aosom-b31-562v00gd": "Spiral LED Wall Lights, Set of 2, Gold",
};
