/**
 * Premier Housewares description rewrites — batch 2 of 5 (15 products).
 *
 * Products 16–30 of the 71-product queue from
 * `scripts/list-description-work-queue.ts --supplier "Premier Housewares"`:
 * the Westford dining set, two outdoor sets, the Goa hanging chair, four
 * lighting products, the Loire bed, the three Opus rope pieces, the Kyra
 * wardrobe, two wall mirrors and the Darnell planter.
 *
 * Same standard as batch 1 — 4–6 product-specific h2 sections, 150–250 words,
 * every fact given its consequence, plain British voice. Facts from each
 * product's own dimensions, specs, existing summary and FAQs only.
 *
 * Two source conflicts worth recording, both resolved by writing round them
 * rather than picking a side:
 *   - Loire bed: its FAQ says "arrives fully assembled" while the same data
 *     lists two flat 16cm-deep cartons. The copy describes the cartons and the
 *     access problem they create, and claims nothing about assembly.
 *   - Opus coffee table: titled "Round", dimensions are 110 x 80cm. The copy
 *     gives both figures and doesn't call it a diameter.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-ph-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-ph-batch2.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

interface Section {
  heading: string;
  paragraphs: string[];
}
interface Written {
  id: string;
  title: string;
  summary: string;
  sections: Section[];
}

export const REWRITES: Written[] = [
  {
    id: "premier-housewares-2405944",
    title: "Westford Rectangle Dining Table with 6 Chairs Set | Kaiku",
    summary:
      "A 160 x 90cm rectangular dining table at 77cm high with six grey microfibre chairs. Ships flat in four cartons at around 71kg all in, and needs assembling.",
    sections: [
      {
        heading: "A Whole Dining Room in One Order",
        paragraphs: [
          "A 160 x 90cm table with six upholstered chairs. 160cm seats six properly — three each side at roughly 50cm of elbow room, which is the width at which people stop knocking arms. Buying the set rather than the parts means the chair height and the table height already match, which is the single most common thing to get wrong when a table and chairs are bought separately.",
        ],
      },
      {
        heading: "Table Build and Chair Upholstery",
        paragraphs: [
          "MDF and iron with glass in the table, and the six chairs upholstered in a grey microfibre over polyurethane foam. Microfibre takes daily use better than a woven fabric and sponges clean rather than needing a wash.",
        ],
      },
      {
        heading: "The Room It Needs",
        paragraphs: [
          "Allow 70cm of clear floor on every side for chairs to pull out, and a 160 x 90cm table wants a room of about 3.0 by 2.3 metres before anything else goes in it. Pushed against a wall on one long side that drops to roughly 3.0 by 1.6.",
        ],
      },
      {
        heading: "Assembly and Delivery Access",
        paragraphs: [
          "It ships flat in four cartons, each about 165 x 96cm and only 9cm deep, and needs assembling. The 165cm length is what to measure against the tightest point of the route in — a stair turn or a narrow hallway is where a box that long stops, not the front door. Around 71kg across the four, so no single piece is unmanageable, but it's a two-person delivery.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe the table with a soft cloth and keep abrasive cleaners off it. It's an indoor set.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2407023",
    title: "Miami Black Rattan 3 Piece Patio Set | Kaiku",
    summary:
      "A three-piece patio set — one table and two chairs — with steel frames, black polyethylene rattan and a tempered glass tabletop, 80 x 80 x 85cm. Ships in three cartons and needs assembling.",
    sections: [
      {
        heading: "What's in the Set",
        paragraphs: ["One patio table and two patio chairs."],
      },
      {
        heading: "Frame, Weave and Glass Top",
        paragraphs: [
          "Steel frames wrapped in black polyethylene rattan, with a tempered glass tabletop. Polyethylene rather than natural cane is the part that matters outdoors — it doesn't dry out and split the way real rattan does after a season in the sun, and it can be hosed down.",
        ],
      },
      {
        heading: "Size, and the Space It Suits",
        paragraphs: [
          "80 x 80cm and 85cm tall overall. That's a two-seater set for a balcony, a small patio or a corner of a garden rather than something to eat a family meal round — the table sits between the chairs at a size for drinks and a plate each.",
        ],
      },
      {
        heading: "Leaving It Out",
        paragraphs: [
          "It's weather resistant, so a shower won't hurt it. Anything soft you add — cushions, a throw — wants bringing in dry rather than left to soak, and we'd cover the set or move it under shelter for the winter months.",
        ],
      },
      {
        heading: "Assembly and Cleaning",
        paragraphs: [
          "Three cartons, around 35.5kg all in, and assembly is required. Wipe the weave and the steel with a damp cloth; nothing abrasive on the glass or the rattan.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2450047",
    title: "Goa White Rattan Effect Hanging Chair | Kaiku",
    summary:
      "A hanging chair on its own white iron frame, with a PE rattan-effect weave and grey polyester cushions. 120 x 105cm on the floor and 203cm tall. Ships in four cartons for assembly.",
    sections: [
      {
        heading: "Frame, Weave and Cushions",
        paragraphs: [
          "A white iron pole frame carrying a seat woven in PE rattan effect, with grey polyester cushions over foam filling. The weave is synthetic rather than natural cane, so it copes with damp and sun far better than the real thing.",
        ],
      },
      {
        heading: "It Brings Its Own Frame",
        paragraphs: [
          "No beam, hook or ceiling fixing needed — the chair hangs from the frame it comes with, so you can put it on a patio, in a conservatory or in a corner of a room and move it later if it's in the wrong place.",
        ],
      },
      {
        heading: "The Space It Takes Up",
        paragraphs: [
          "203cm tall and 120 x 105cm on the floor. Two things worth checking before you order: the ceiling, if it's going indoors, and the swing — a hanging chair needs clear air around it, so it can't be tucked tight into a corner the way a static chair can.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "It arrives in four cartons, around 27kg all in, and needs building. The frame is the two-person part — one to hold it upright while the other bolts it.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe the weave with a damp cloth and keep abrasive cleaners off it. Spot clean the cushions, and take them indoors when you're not using the chair — cushions left out in a British summer are the part that goes first.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2502222",
    title: "Morano 8 Bulb Champagne Glass Chandelier | Kaiku",
    summary:
      "An eight-bulb chandelier in carved champagne-toned glass and K9 crystal on an iron frame, 71cm across with a 143cm drop and 9.4kg. Takes 8 x E14 bulbs up to 40W, not included.",
    sections: [
      {
        heading: "Bulb Requirements",
        paragraphs: [
          "Eight E14 bulbs, 40W maximum each, and they aren't included. With carved glass and crystal doing the work, a clear candle bulb gives you the refraction the fitting is built for — an opaque bulb kills it.",
        ],
      },
      {
        heading: "Glass and Crystal",
        paragraphs: [
          "Translucent carved cognac-toned glass with refractive K9 crystal, on an iron frame. The champagne tint warms the light coming through it rather than throwing it clear and white.",
        ],
      },
      {
        heading: "Drop and Ceiling Height",
        paragraphs: [
          "71cm across with a 143cm drop. That's a stairwell, a double-height hall or a dining table fitting — over a table you want the bottom of the glass around 75 to 85cm above the surface, and on a standard 2.4m ceiling a 143cm drop has to be shortened at the chain or the flex.",
        ],
      },
      {
        heading: "Weight and Fixing",
        paragraphs: [
          "9.4kg, which is well beyond what a plasterboard ceiling rose will hold on its own — it needs fixing into a joist or a rated ceiling box. Get an electrician to fit it.",
        ],
      },
      {
        heading: "Assembly and Cleaning",
        paragraphs: [
          "The glass and crystal are fitted on assembly, so allow time for it before the electrician arrives. Wipe with a soft cloth, nothing abrasive, and it's for indoor use — not a bathroom fitting.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2502224",
    title: "Morano 6 Bulb Smoked Crystal Glass Chandelier | Kaiku",
    summary:
      "A six-bulb chandelier in carved smoked glass and K9 crystal, 60cm across with an adjustable drop up to 156cm and 8.4kg. Takes 6 x E14 bulbs up to 40W, not included.",
    sections: [
      {
        heading: "Bulb Requirements",
        paragraphs: [
          "Six E14 bulbs at 40W maximum each, not supplied. Smoked glass swallows a fair amount of light, so if the chandelier is the only fitting in the room, buy at the top of that wattage rather than the bottom.",
        ],
      },
      {
        heading: "Smoked Glass and K9 Crystal",
        paragraphs: [
          "Carved smoked glass in a chrome-grey tone with refractive K9 crystal. The smoke tint mutes the glare from a bare bulb and puts the sparkle in the crystal instead — a different effect from clear glass, and a darker one.",
        ],
      },
      {
        heading: "Adjustable Drop",
        paragraphs: [
          "60cm across with a drop that adjusts up to 156cm, so it suits a tall room or a stairwell but can be shortened for a standard ceiling. Over a dining table, hang the bottom of the glass roughly 75 to 85cm above the top.",
        ],
      },
      {
        heading: "Weight and Fixing",
        paragraphs: [
          "8.4kg. That's more than a plasterboard ceiling rose is rated for, so it wants a fixing into a joist or a proper ceiling box, wired in by an electrician.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe the glass and crystal with a soft cloth. No abrasive cleaners — the carving holds dust, and a soft brush gets into it better than a cloth does.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2502352",
    title: "Revive Chrome Finish Metal Floor Lamp | Kaiku",
    summary:
      "A slim floor lamp in chrome-finished metal, 157cm tall on a 28cm footprint. Narrow enough to stand beside a sofa arm or in a hall.",
    sections: [
      {
        heading: "Height and Footprint",
        paragraphs: [
          "157cm tall and 28cm across. Those two numbers are what decide where it goes: 157cm puts the light source above head height when you're sitting down, so it lights the room rather than shining into your eyes, and a 28cm base slots into the gap beside a sofa arm or an armchair without pushing the furniture out.",
        ],
      },
      {
        heading: "Chrome-Finished Metal",
        paragraphs: [
          "Metal throughout, in a chrome finish. Chrome bounces light back into the room instead of absorbing it, which is worth having on a lamp this slim — there isn't much of it, so what there is works harder.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Beside a chair for reading, in the dead corner of a room that the ceiling light doesn't reach, or in a hallway where a table lamp has nowhere to stand. Run the flex behind the furniture rather than across the floor and it disappears.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe it with a soft cloth. Chrome shows fingerprints and dust more than a painted finish does, so a dry cloth every couple of weeks keeps it looking right — and buff it dry rather than leaving it damp.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2502389",
    title: "Wyra Champagne Gold Frame Pendant light | Kaiku",
    summary:
      "An open iron cage pendant in a champagne gold finish, 30cm across with a 150cm drop and 1.8kg. Takes one E27 bulb up to 60W, not included.",
    sections: [
      {
        heading: "An Open Cage, and the Shadows It Casts",
        paragraphs: [
          "30cm across and 150cm long, built as an open iron cage in a champagne gold finish. There's no shade, so the bulb is visible and the frame itself does the work — the light passes through the cage and throws its pattern onto whatever is behind and below it.",
          "That makes it a fitting to hang where the shadow lands somewhere worth looking at: against a wall, over a table, in a hall. In the middle of a big ceiling with nothing near it, the effect is lost.",
        ],
      },
      {
        heading: "Bulb and Drop",
        paragraphs: [
          "One E27 bulb up to 60W, not included. With a bare bulb in an open frame the bulb is part of the design, so a clear filament lamp suits the cage far better than a plain opaque one, which will simply glare.",
          "At 150cm of drop it's built for height. Over a dining table that's right; in a room with a standard ceiling it'll need shortening, and the flex is where you do that.",
        ],
      },
      {
        heading: "Weight and Fitting",
        paragraphs: [
          "1.8kg, so any sound ceiling rose will take it and it's a straight swap for an existing pendant — done by an electrician, or by you if you're confident with the wiring. It arrives assembled.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe the frame with a soft cloth. An open cage collects dust on the top edges where you can't see it, so that's the part to check.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5502122",
    title: "Loire White Super Kingsize Bed | Kaiku",
    summary:
      "A super king bed frame in bayur wood and MDF with a weathered white finish and a fabric-covered headboard, 194cm wide x 210cm long and 114cm tall. Delivered in two flat cartons.",
    sections: [
      {
        heading: "Built for a Super King Mattress",
        paragraphs: [
          "194cm wide and 210cm long — sized for a UK super king mattress at 180 x 200cm, with the frame allowance a headboard and footboard need. At 114cm the headboard stands tall enough to be the thing you notice in the room rather than disappearing behind the pillows.",
        ],
      },
      {
        heading: "Bayur Wood and the Weathered Finish",
        paragraphs: [
          "71% bayur wood with 25% MDF for the structure, in a weathered white finish. Weathered rather than solid-painted means the grain still reads through, and the colour varies naturally across the frame — that variation is the finish, not a fault.",
        ],
      },
      {
        heading: "The Headboard",
        paragraphs: [
          "The remaining few per cent is a polyester and cotton fabric on the headboard, so it's soft to lean back against reading in bed rather than a hard board.",
        ],
      },
      {
        heading: "Delivery Access",
        paragraphs: [
          "It comes in two cartons, each about 199 x 119cm and only 16cm deep. Long, slim boxes want a straight run to the bedroom — measure any turn on the stairs and the width of the bedroom door before delivery day, because a 199cm box can't be angled round a tight landing.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe it down with a lint-free cloth, and keep the bed out of direct sunlight — a painted white finish in a sunny window will shift colour over a few summers.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5502318",
    title: "Opus 3 Seater Woven Rope Sofa | Kaiku",
    summary:
      "A three-seater outdoor sofa with a eucalyptus frame and a woven polyester-cotton rope seat, 178cm wide x 63cm deep x 76cm high and 26kg. Cushions included; ships in one carton for assembly.",
    sections: [
      {
        heading: "What's Included",
        paragraphs: ["The sofa and its cushions, in one carton."],
      },
      {
        heading: "Eucalyptus Frame and Rope Weave",
        paragraphs: [
          "A eucalyptus wood frame with a seat and back woven from polyester and cotton rope in a latte tone, under light grey cushions. Rope gives slightly as you sit where a slatted timber seat doesn't, which is what makes a hard-frame outdoor sofa comfortable enough to stay on.",
        ],
      },
      {
        heading: "Size, and Who Actually Fits",
        paragraphs: [
          "178cm wide, 63cm deep, 76cm high. Called a three-seater, and it is — three across at 178cm, though two adults with a cushion between them is the more honest everyday use. The 63cm depth is shallow for a sofa, which is what lets it work on a narrow terrace or against a wall in a small garden.",
        ],
      },
      {
        heading: "Leaving It Out",
        paragraphs: [
          "Eucalyptus and cotton rope will take the weather but won't thank you for standing in it all year. Bring the cushions in, and cover the sofa or move it under shelter over winter — that's the difference between this looking good in five years and looking tired in two.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "One carton, 26kg, and assembly is required. Two people for the lift, and build it where it's going to live rather than carrying it assembled.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5502319",
    title: "Opus Woven Rope Footstool | Kaiku",
    summary:
      "An outdoor footstool with a eucalyptus frame and a woven cotton rope top, 47 x 47cm and 36cm tall, 5kg and rated to 160kg. Ships in one carton for assembly.",
    sections: [
      {
        heading: "47cm Square, Rated to 160kg",
        paragraphs: [
          "47 x 47cm and 36cm tall — footstool height rather than seat height, so it sits low in front of a chair. It's rated to 160kg, so it takes an adult perching on it as extra seating even though it's built for feet.",
        ],
      },
      {
        heading: "Eucalyptus and Cotton Rope",
        paragraphs: [
          "A eucalyptus wood frame with a cotton rope top woven across it. The whole thing weighs 5kg, so it moves with one hand — worth knowing on a windy terrace, where light furniture is the furniture that shifts.",
        ],
      },
      {
        heading: "Doubling as a Side Table",
        paragraphs: [
          "The top is flat enough for a tray, but it's rope, so a glass put straight down will sit at an angle. Keep a tray on it if that's the job you want it for.",
        ],
      },
      {
        heading: "Keeping It Dry",
        paragraphs: [
          "Cotton rope holds water, so this is a fine-weather piece rather than an all-year one. Store it somewhere dry between uses and keep it out of standing rain, and the rope keeps its colour and its tension.",
        ],
      },
      {
        heading: "Assembly and Cleaning",
        paragraphs: [
          "One carton, and it needs assembling — legs to the frame, nothing complicated. Wipe the weave with a damp cloth and keep harsh chemicals off it.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5502321",
    title: "Opus Grey Woven Rope and Stone Round Coffee Table | Kaiku",
    summary:
      "An outdoor coffee table with a grey stone top on a PE rope, steel and eucalyptus base, 110 x 80cm and 47cm high. Weighs 33kg, arrives assembled and is rated to 75kg.",
    sections: [
      {
        heading: "Stone Top on a Rope Base",
        paragraphs: [
          "The top is stone — 45% of the table's make-up, and where most of the 33kg sits. Underneath, a steel and eucalyptus frame wrapped in PE rope. The rope is synthetic rather than natural fibre, so it handles rain and sun without going brittle, and the stone doesn't mind either.",
        ],
      },
      {
        heading: "Size and Height",
        paragraphs: [
          "110 x 80cm across the top and 47cm high. That's at the taller end for a coffee table, which suits a deep outdoor sofa — you can reach a drink without leaning forward off the cushions. The 80cm depth also means it doesn't strand itself in the middle of a small terrace.",
        ],
      },
      {
        heading: "Weight and What It'll Take",
        paragraphs: [
          "33kg, so wind won't move it and it doesn't need weighting down. It's rated to 75kg on the top, which is a load rating for things you put on it — not an invitation to sit on it.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "It arrives assembled. It's a two-person lift out of the carton and into position, though — 33kg of stone in one piece.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A damp cloth on both the stone top and the rope base. No harsh chemicals; stone marks if you use anything acidic on it.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5502407",
    title: "Kyra Grey Wash Elm Wood Wardrobe | Kaiku",
    summary:
      "A double wardrobe in new elm with a grey wash finish and iron detailing, 95cm wide x 50cm deep x 190cm tall. Delivered fully assembled in one carton at around 71kg.",
    sections: [
      {
        heading: "Elm, Grey-Washed Rather Than Stained Solid",
        paragraphs: [
          "95% new elm with 5% iron for the detailing and handles. The grey wash sits on the timber, so the grain still reads through it instead of being buried under a solid stain — no two doors come out looking quite the same.",
        ],
      },
      {
        heading: "Inside: Rail and Compartments",
        paragraphs: [
          "A hanging rail plus four compartments, so it takes hanging clothes and folded ones without you buying boxes to make it work.",
        ],
      },
      {
        heading: "Size in the Room",
        paragraphs: [
          "95cm wide, 50cm deep and 190cm tall — a full-height double rather than a single. 190cm clears a standard 2.4m ceiling with room above it, and 50cm of depth is enough to hang a coat on a standard hanger without the shoulders touching the door.",
        ],
      },
      {
        heading: "Delivered Assembled — Check the Route",
        paragraphs: [
          "It arrives fully assembled, which saves you a long afternoon but moves the problem to the doorway. One carton, 100 x 54 x 197cm and around 71kg. A 197cm box can't be tilted round a tight turn on the stairs, so measure the whole route before ordering rather than just the bedroom door, and have two people ready.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe with a soft cloth and keep abrasive cleaners off the wash finish.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5503975",
    title: "Palu Rectangular Black Wall Mirror with Shell Inlay | Kaiku",
    summary:
      "A tall wall mirror with a black resin frame set with shell inlay, 60cm wide x 160cm tall and only 2cm deep, weighing 12.8kg. For indoor use.",
    sections: [
      {
        heading: "Tall, Narrow and Nearly Flush",
        paragraphs: [
          "160cm tall by 60cm wide, and only 2cm deep. At that depth it sits almost flat to the wall, which is what makes a mirror this tall workable in a hallway or at the end of a landing where anything with a deep frame would catch a shoulder.",
        ],
      },
      {
        heading: "The Shell Inlay Frame",
        paragraphs: [
          "The frame is resin with shell inlay and stone worked into it. That gives the surface texture and a bit of shift as the light moves across it, where a painted frame stays flat all day.",
        ],
      },
      {
        heading: "Hanging and Fixings",
        paragraphs: [
          "It weighs 12.8kg, so you'll want to source fixings to suit your wall type — two into masonry with plug and screw, or proper hollow-wall anchors into plasterboard. Never the plug that comes in a pack. Hang it portrait, and if it's the mirror you'll be dressing in front of, centre it around 150cm off the floor.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe the glass with a soft cloth, and spray the cloth rather than the mirror so nothing runs down into the shell inlay. It's for indoor use.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5504031",
    title: "Jensen Rectangular Silver Wall Mirror | Kaiku",
    summary:
      "A rectangular wall mirror in real glass with a silver-finished MDF frame, 80 x 120cm and 3.5cm deep, weighing 19.5kg. Fixings aren't included.",
    sections: [
      {
        heading: "Size and Where It Suits",
        paragraphs: [
          "80 x 120cm. That's a room mirror rather than a bathroom one — big enough to work over a chest of drawers, above a fireplace or on the long wall of a hallway, and big enough to bounce a decent amount of daylight back into a dark room.",
        ],
      },
      {
        heading: "Frame and Glass",
        paragraphs: [
          "Real glass, not acrylic, in a silver-finished MDF frame 3.5cm deep. Real glass is flatter than acrylic and won't distort at the edges, and it's most of the reason this weighs what it does.",
        ],
      },
      {
        heading: "Weight and Fixings",
        paragraphs: [
          "19.5kg, and fixings aren't supplied — source them to suit your wall type. Into masonry that's two plugs and screws sized for the weight; into plasterboard, find the studs or use heavy-duty hollow-wall anchors, because 19.5kg on a single plasterboard plug will pull out eventually. Two fixings, level with each other, not one in the middle.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A damp soft cloth. Spray the cloth rather than the glass — cleaner running down into the join between glass and MDF is what swells a frame edge over time.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5505801",
    title: "Darnell Small Black And White Finish Planter | Kaiku",
    summary:
      "A planter on beech wood legs with a magnesia composite bowl in a black and white finish, 21.5cm across and 42cm tall, weighing 12.7kg empty. Arrives fully assembled.",
    sections: [
      {
        heading: "A Pot on Beech Legs",
        paragraphs: [
          "21.5cm across the bowl and 42cm tall overall, so the plant sits at about knee height rather than on the floor. The legs are the point: they lift the foliage where you can see it and leave the floor underneath clear.",
        ],
      },
      {
        heading: "Magnesia Composite, Not Plastic",
        paragraphs: [
          "The bowl is a magnesia composite with fibreglass and inorganic resin — the mix used for planters that need the look of stone at a weight you can still carry. It's 12.7kg empty, which is worth knowing before you add soil: decide where it's going first, then plant it.",
        ],
      },
      {
        heading: "Planting",
        paragraphs: [
          "We'd plant into a plastic pot and drop that in rather than potting straight into the bowl. Water stays off the composite, and swapping the plant out becomes a lift rather than a repot.",
        ],
      },
      {
        heading: "The Beech Legs",
        paragraphs: [
          "Natural beech, so the colour varies from leg to leg and from one planter to the next. They need no treatment, but we'd keep them off permanently wet ground and bring the whole thing under cover in a hard frost.",
        ],
      },
      {
        heading: "Assembly and Cleaning",
        paragraphs: [
          "It arrives fully assembled. Wipe it with a soft cloth and keep abrasive cleaners off the finish.",
        ],
      },
    ],
  },
];

function toBlocks(sections: Section[], key: string): unknown[] {
  const blocks: unknown[] = [];
  let index = 0;
  const b = (text: string, style: string) => {
    const id = `${key}-${index++}`;
    return {
      _type: "block",
      _key: id,
      style,
      markDefs: [],
      children: [{ _type: "span", _key: `${id}s`, text, marks: [] }],
    };
  };
  for (const section of sections) {
    blocks.push(b(section.heading, "h2"));
    for (const paragraph of section.paragraphs)
      blocks.push(b(paragraph, "normal"));
  }
  return blocks;
}

function keyFor(id: string): string {
  return id.replace(/[^a-z0-9]+/g, "-").slice(0, 40);
}

async function main() {
  const results: {
    id: string;
    title: string;
    found: boolean;
    sections: number;
    words: number;
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const written of REWRITES) {
    const doc = await client.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{_id}`,
      { id: written.id },
    );
    const words = written.sections
      .flatMap((s) => [s.heading, ...s.paragraphs])
      .join(" ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    results.push({
      id: written.id,
      title: written.title,
      found: !!doc,
      sections: written.sections.length,
      words,
    });
    if (!doc) continue;
    if (apply) {
      transaction.patch(written.id, (p) =>
        p.set({
          description: toBlocks(written.sections, keyFor(written.id)),
          summary: written.summary,
        }),
      );
      queued += 1;
    }
  }

  console.table(results);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-ph-description-rewrites-batch2.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
