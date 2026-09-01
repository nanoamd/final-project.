/**
 * Draft-catalogue artefact cleanup — 34 drafts carrying the "admits a gap",
 * "quotes the supplier", markdown, HTML-entity or internal-threshold
 * artefacts, found in the post-emergency re-audit on 1 September.
 *
 * Same rule throughout: where the hedge sentence is pure admission with
 * nothing underneath it ("burn time is not specified"), it's deleted rather
 * than replaced — there's no real fact to write in its place, and deleting
 * a sentence that says nothing loses nothing. Where the surrounding
 * sentence still needs to resolve to something (an assembly FAQ, a care
 * instruction), it's restated as a normal, safe, generic instruction
 * ("check the included instructions") rather than "the supplier/manufacturer
 * does not specify" — same phrase already used successfully on the
 * SaunaPlunge and Provence fixes earlier today.
 *
 * Two are not hedge removals:
 *  - "StellaTable Lamp" FAQ answer leaked the internal "under £50" delivery
 *    threshold rule — the same class of bug as the price-band delivery fix
 *    earlier this session. Fixed by stating this lamp's own answer only.
 *  - "Alora Ceramic Taper Candle Holder" has literal `<br><br>` HTML tags
 *    showing as text in a plain `text` field — replaced with real line
 *    breaks.
 *
 * Blocks are matched by full text and collapsed to a single span, same
 * safety lesson from the supplier-name-leak repair, applied from the start.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-draft-artefacts-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-draft-artefacts-batch1.ts --apply
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

interface Span {
  _type: string;
  text?: string;
  [key: string]: unknown;
}
interface Block {
  _type: string;
  children?: Span[];
  [key: string]: unknown;
}
interface Faq {
  question?: string;
  answer?: string;
  [key: string]: unknown;
}
interface Fix {
  id: string;
  title: string;
  field: "summary" | "description" | "faq";
  from: string;
  to: string;
  faqQuestion?: string;
}

function collapseBlock(block: Block, newText: string): Block {
  const children = block.children ?? [];
  return { ...block, children: [{ ...children[0]!, text: newText }] };
}

const FIXES: Fix[] = [
  {
    id: "drafts.hill-decor-18282",
    title: "Medium Conran Vase",
    field: "description",
    from: "As there are no detailed cleaning guidelines provided, regular dusting is suggested to keep the vase looking its best. For deeper cleaning, consult the supplier for appropriate methods.",
    to: "Regular dusting keeps the vase looking its best.",
  },
  {
    id: "drafts.hill-decor-20729",
    title: "Bloomville Stone Star Lantern",
    field: "summary",
    from: "The Bloomville Stone Star Lantern is a beautifully handcrafted piece made from ceramic, featuring a stunning stone effect. Measuring 18 × 18 × 19 cm, it fits perfectly into any décor, adding a touch of elegance to your home.\n\nDesigned for versatile use, this lantern can be placed in various settings such as living rooms, dining areas, or even outdoor spaces. Its neutral colour blends seamlessly with different styles, making it a great addition to your home accessories.\n\nWith its sturdy construction, this lantern is ideal for creating a warm, inviting atmosphere. However, please note that the burn time and wax type are not specified; inquire with customer support for additional details on its use.",
    to: "The Bloomville Stone Star Lantern is a beautifully handcrafted piece made from ceramic, featuring a stunning stone effect. Measuring 18 × 18 × 19 cm, it fits perfectly into any décor, adding a touch of elegance to your home.\n\nDesigned for versatile use, this lantern can be placed in various settings such as living rooms, dining areas, or even outdoor spaces. Its neutral colour blends seamlessly with different styles, making it a great addition to your home accessories.\n\nWith its sturdy construction, this lantern is ideal for creating a warm, inviting atmosphere.",
  },
  {
    id: "drafts.hill-decor-20782",
    title: "Garda Glazed Gisela Vase",
    field: "summary",
    from: "The Garda Glazed Gisela Vase is a beautifully handcrafted ceramic piece, featuring a subtly distressed glaze in a classic white finish. Measuring 18 × 18 × 51 cm, it stands tall with an elegant profile, making it ideal for showcasing longer-stemmed flowers or decorative foliage.\n\nWeighing 2.5 kg, this vase is designed with versatility in mind, suitable for various indoor settings such as living rooms, dining areas, or hallways. Its neutral colour complements a wide range of decor styles, enhancing the overall aesthetic of your space.\n\nPlease note that the specifications regarding whether it holds water or is suitable for food use are not provided, so it’s best suited for decorative use only. Add this striking piece to your collection for a touch of refined elegance.",
    to: "The Garda Glazed Gisela Vase is a beautifully handcrafted ceramic piece, featuring a subtly distressed glaze in a classic white finish. Measuring 18 × 18 × 51 cm, it stands tall with an elegant profile, making it ideal for showcasing longer-stemmed flowers or decorative foliage.\n\nWeighing 2.5 kg, this vase is designed with versatility in mind, suitable for various indoor settings such as living rooms, dining areas, or hallways. Its neutral colour complements a wide range of decor styles, enhancing the overall aesthetic of your space.\n\nAdd this striking piece to your collection for a touch of refined elegance.",
  },
  {
    id: "drafts.hill-decor-20869",
    title: "Luxe Collection Natural Glow ED White Wax Candle",
    field: "summary",
    from: "The Luxe Collection Natural Glow ED White Wax Candle combines elegance and practicality with its real wax LED design that creates a warm glow. Measuring 15 × 15 × 30 cm and made of plastic, this candle is perfect for indoor and fair weather outdoor use.\n\nFeaturing three wicks, it adds a sophisticated touch to your décor while ensuring safety during use. The clean white exterior makes it an ideal choice for various settings, allowing it to fit seamlessly into your living space.\n\nThis candle can enhance any atmosphere, whether used as a centrepiece or accentuating other decorative elements. Please note that fragrance notes are not specified, but its soft glow mimics the essence of traditional candles perfectly.",
    to: "The Luxe Collection Natural Glow ED White Wax Candle combines elegance and practicality with its real wax LED design that creates a warm glow. Measuring 15 × 15 × 30 cm and made of plastic, this candle is perfect for indoor and fair weather outdoor use.\n\nFeaturing three wicks, it adds a sophisticated touch to your décor while ensuring safety during use. The clean white exterior makes it an ideal choice for various settings, allowing it to fit seamlessly into your living space.\n\nThis candle can enhance any atmosphere, whether used as a centrepiece or accentuating other decorative elements. Its soft glow mimics the essence of traditional candles perfectly.",
  },
  {
    id: "drafts.hill-decor-21187",
    title: "Medium Frosted Eucalyptus Candle Wreath",
    field: "summary",
    from: "Elevate your home décor with the Medium Frosted Eucalyptus Candle Wreath, designed to enhance seasonal celebrations and everyday elegance. Crafted from sturdy plastic, it features a delightful eucalyptus design that brings a touch of winter charm to any space. With dimensions of 8 × 28 × 28 cm, this versatile piece can be showcased as a stunning centrepiece or hung as an eye-catching decoration.\n\nPerfect for festive gatherings or creating a relaxing ambiance, this candle wreath combines functionality and aesthetic appeal. The practical design holds a candle securely while adding a beautiful frosted touch to your interior. Although the exact burn time is not specified, this wreath makes for an excellent addition to your candle collection, complementing other home décor elements seamlessly.\n\nIdeal for placement on a dining table, mantelpiece, or shelf, the Medium Frosted Eucalyptus Candle Wreath is a great way to enhance your home for the holiday season and beyond. Bring this stunning piece into your living space for a festive aesthetic that resonates throughout the year.",
    to: "Elevate your home décor with the Medium Frosted Eucalyptus Candle Wreath, designed to enhance seasonal celebrations and everyday elegance. Crafted from sturdy plastic, it features a delightful eucalyptus design that brings a touch of winter charm to any space. With dimensions of 8 × 28 × 28 cm, this versatile piece can be showcased as a stunning centrepiece or hung as an eye-catching decoration.\n\nPerfect for festive gatherings or creating a relaxing ambiance, this candle wreath combines functionality and aesthetic appeal. The practical design holds a candle securely while adding a beautiful frosted touch to your interior. This wreath makes for an excellent addition to your candle collection, complementing other home décor elements seamlessly.\n\nIdeal for placement on a dining table, mantelpiece, or shelf, the Medium Frosted Eucalyptus Candle Wreath is a great way to enhance your home for the holiday season and beyond. Bring this stunning piece into your living space for a festive aesthetic that resonates throughout the year.",
  },
  {
    id: "drafts.hill-decor-21496",
    title: "Marble Effect Squat Vase",
    field: "description",
    from: "To maintain its beautiful finish, the care and cleaning instructions for this vase are not explicitly stated on the supplier page. It's advisable to use a soft, dry cloth to dust the vase regularly to keep it looking fresh. For grime or stains, a damp cloth with a mild detergent may be considered, though care should be taken not to saturate the ceramic.",
    to: "To maintain its beautiful finish, use a soft, dry cloth to dust the vase regularly. For grime or stains, a damp cloth with a mild detergent may be considered, though care should be taken not to saturate the ceramic.",
  },
  {
    id: "drafts.hill-decor-21499",
    title: "Marble Effect Ellipse Large Vase",
    field: "summary",
    from: "The Marble Effect Ellipse Large Vase is crafted from high-quality ceramic, boasting a unique marbled finish that adds character to your space. With dimensions of 23cm in length, 23cm in width, and 36cm in height, this piece is designed to stand out on its own or complement your existing decor. Weighing 2.18kg, it’s substantial enough to provide stability while being easy to move as needed.\n\nIts contemporary grey colour fits harmoniously with various interior styles, making it perfect for living rooms, bedrooms, or hallways. While it serves as an elegant decorative display, the specifics regarding its capacity to hold water safely are not provided, suggesting it’s mainly for decorative use. This unique vase is sure to catch the eye of guests and become a focal point in your home.\n\nWith its handcrafted nature, each piece reflects a distinct personality, showcasing the artistry involved in its creation. Elevate your interior aesthetics with this exquisite vase, ideal for displaying artificial florals and other decorative arrangements that enhance its luxurious appeal.",
    to: "The Marble Effect Ellipse Large Vase is crafted from high-quality ceramic, boasting a unique marbled finish that adds character to your space. With dimensions of 23cm in length, 23cm in width, and 36cm in height, this piece is designed to stand out on its own or complement your existing decor. Weighing 2.18kg, it’s substantial enough to provide stability while being easy to move as needed.\n\nIts contemporary grey colour fits harmoniously with various interior styles, making it perfect for living rooms, bedrooms, or hallways. It serves as an elegant decorative display and is sure to catch the eye of guests, becoming a focal point in your home.\n\nWith its handcrafted nature, each piece reflects a distinct personality, showcasing the artistry involved in its creation. Elevate your interior aesthetics with this exquisite vase, ideal for displaying artificial florals and other decorative arrangements that enhance its luxurious appeal.",
  },
  {
    id: "drafts.hill-decor-21759",
    title: "Garda Star Candle Lantern",
    field: "summary",
    from: "Crafted from ceramic, the Garda Star Candle Lantern features a subtly distressed grey glaze that adds a touch of sophistication to any environment. It measures 14 × 14 × 10 cm, making it compact enough for various settings while providing a stylish focal point.\n\nThis lantern is ideal for enhancing cosy corners, whether displayed on a mantle or as part of a centrepiece arrangement. The handcrafted nature of this piece ensures unique character, making it an excellent addition to both modern and rustic interiors.\n\nPlace it in your living room, bedroom, or dining area to create an inviting atmosphere. While the burn time and wax type are not specified, its elegant design makes it a versatile decorative item for your home.",
    to: "Crafted from ceramic, the Garda Star Candle Lantern features a subtly distressed grey glaze that adds a touch of sophistication to any environment. It measures 14 × 14 × 10 cm, making it compact enough for various settings while providing a stylish focal point.\n\nThis lantern is ideal for enhancing cosy corners, whether displayed on a mantle or as part of a centrepiece arrangement. The handcrafted nature of this piece ensures unique character, making it an excellent addition to both modern and rustic interiors.\n\nPlace it in your living room, bedroom, or dining area to create an inviting atmosphere. Its elegant design makes it a versatile decorative item for your home.",
  },
  {
    id: "drafts.hill-decor-21760",
    title: "Garda Large Star Candle Lantern",
    field: "summary",
    from: "The Garda Large Star Candle Lantern, crafted from beautifully finished ceramic, is a stunning addition to your home decor. With dimensions of 18 × 18 × 15 cm, its characterful, subtly distressed glaze in a modern grey complements various interior styles smoothly.\n\nPerfect for creating an inviting atmosphere, this lantern adds a touch of elegance whether placed on dining tables, in living rooms, or entryways. Its handcrafted design reflects quality and care, making it a delightful piece for both everyday use and special occasions.\n\nPlease note, fragrance notes and burn time are not specified. This versatile lantern can enhance your home’s aesthetic while making a charming statement. A thoughtful present for loved ones or a lovely addition to your own collection.",
    to: "The Garda Large Star Candle Lantern, crafted from beautifully finished ceramic, is a stunning addition to your home decor. With dimensions of 18 × 18 × 15 cm, its characterful, subtly distressed glaze in a modern grey complements various interior styles smoothly.\n\nPerfect for creating an inviting atmosphere, this lantern adds a touch of elegance whether placed on dining tables, in living rooms, or entryways. Its handcrafted design reflects quality and care, making it a delightful piece for both everyday use and special occasions.\n\nThis versatile lantern can enhance your home’s aesthetic while making a charming statement. A thoughtful present for loved ones or a lovely addition to your own collection.",
  },
  {
    id: "drafts.hill-decor-23043",
    title: "Luxe Collection Melt Effect Grey LED Wax Candle",
    field: "summary",
    from: "The Luxe Collection Melt Effect Grey LED Wax Candle combines a contemporary design with the warmth of traditional candlelight, featuring a realistic melt effect that captivates the eye. Crafted from wax and measuring 8 × 8 × 10 cm, this candle is lightweight yet substantial enough to enhance any decor. Perfect for indoor use, it provides a safe and stylish option for creating ambience in your home.\n\nWith a no-flame safety feature, this battery-operated candle delivers a flickering glow that evokes the charm of a real candle while eliminating risks associated with an open flame. Ideal for use in various settings, it can complement any space, be it the living room, bedroom, or dining area, allowing you to set the mood effortlessly.\n\nDesigned for convenience and elegance, this LED wax candle requires batteries (not specified if included) for operation, ensuring long-lasting beauty without the hassle of maintenance. The sophisticated grey hue fits seamlessly into modern interiors, making it a versatile decorative piece for any occasion.",
    to: "The Luxe Collection Melt Effect Grey LED Wax Candle combines a contemporary design with the warmth of traditional candlelight, featuring a realistic melt effect that captivates the eye. Crafted from wax and measuring 8 × 8 × 10 cm, this candle is lightweight yet substantial enough to enhance any decor. Perfect for indoor use, it provides a safe and stylish option for creating ambience in your home.\n\nWith a no-flame safety feature, this battery-operated candle delivers a flickering glow that evokes the charm of a real candle while eliminating risks associated with an open flame. Ideal for use in various settings, it can complement any space, be it the living room, bedroom, or dining area, allowing you to set the mood effortlessly.\n\nDesigned for convenience and elegance, this LED wax candle requires batteries for operation, ensuring long-lasting beauty without the hassle of maintenance. The sophisticated grey hue fits seamlessly into modern interiors, making it a versatile decorative piece for any occasion.",
  },
  {
    id: "drafts.hill-decor-23197",
    title: "White Ceramic Heart Cut-Out Round Tealight Holder",
    field: "faq",
    faqQuestion: "Does it produce heat or a real flame?",
    from: "The product is designed for tealights and does not produce a real flame. Always ensure proper use according to the manufacturer's guidelines.",
    to: "It's designed for tealights and does not produce a real flame. Always follow the included instructions for proper use.",
  },
  {
    id: "drafts.hill-decor-23806",
    title: "Large Washed Wood Framed Window Mirror",
    field: "summary",
    from: "The Large Washed Wood Framed Window Mirror brings character and elegance to any room. Crafted from mirrored glass and featuring a distressed wood frame, this impressive piece measures 200cm in height, 100cm in width, and 6cm in depth, making it ideal for spaces where a statement piece is desired. \n\nWith a substantial weight of 15.5 kg, the mirror requires securely mounted fixings to ensure stable installation on a suitable wall. Its multi-paned design draws inspiration from traditional window architecture, offering a classic aesthetic with modern appeal.\n\nPerfect for living rooms, bedrooms, and hallways, this mirror's reflective nature can enhance light and space in your home. Please note that specific details about fixings, hanging methods, and cleaning guidelines are not provided, so we recommend consulting the instruction manual or contacting our customer support for further assistance.",
    to: "The Large Washed Wood Framed Window Mirror brings character and elegance to any room. Crafted from mirrored glass and featuring a distressed wood frame, this impressive piece measures 200cm in height, 100cm in width, and 6cm in depth, making it ideal for spaces where a statement piece is desired. \n\nWith a substantial weight of 15.5 kg, the mirror requires securely mounted fixings to ensure stable installation on a suitable wall. Its multi-paned design draws inspiration from traditional window architecture, offering a classic aesthetic with modern appeal.\n\nPerfect for living rooms, bedrooms, and hallways, this mirror's reflective nature can enhance light and space in your home.",
  },
  {
    id: "drafts.hill-decor-23806",
    title: "Large Washed Wood Framed Window Mirror",
    field: "description",
    from: "The supplier page does not provide specific cleaning instructions. We recommend contacting customer support for guidance on maintaining its pristine appearance without damage.",
    to: "Wipe the glass with a soft, dry cloth or standard glass cleaner, and dust the wood frame regularly to keep it looking its best.",
  },
  {
    id: "drafts.hill-decor-23970",
    title: "Lorenzo Tall Fin Vase",
    field: "summary",
    from: "The Lorenzo Tall Fin Vase is a striking ceramic piece that adds sophistication to any interior space. Standing at an impressive 70 cm tall with a unique angular geometry, it serves not only as a vase but also as an artistic statement, ideal for contemporary settings.\n\nCrafted from durable ceramic, this vase measures 27 × 27 × 70 cm and weighs 6.8 kg, making it a substantial addition to your home décor. Perfect for placement on grand entryways, dining tables, or display shelves, its height creates a dynamic visual impact, drawing attention wherever it’s styled.\n\nDesigned for indoor use only, the Lorenzo Tall Fin Vase is perfect for your decorative arrangements, although it is not specified whether it holds water. To maintain its pristine appearance, appropriate cleaning methods are suggested, ensuring this beautiful piece remains a focal point in your home.",
    to: "The Lorenzo Tall Fin Vase is a striking ceramic piece that adds sophistication to any interior space. Standing at an impressive 70 cm tall with a unique angular geometry, it serves not only as a vase but also as an artistic statement, ideal for contemporary settings.\n\nCrafted from durable ceramic, this vase measures 27 × 27 × 70 cm and weighs 6.8 kg, making it a substantial addition to your home décor. Perfect for placement on grand entryways, dining tables, or display shelves, its height creates a dynamic visual impact, drawing attention wherever it’s styled.\n\nDesigned for indoor use only, the Lorenzo Tall Fin Vase suits decorative arrangements. Dust regularly with a soft, dry cloth to keep it looking its best.",
  },
  {
    id: "drafts.hill-decor-24172",
    title: "Alora Ceramic Taper Candle Holder With Handle",
    field: "summary",
    from: "The Alora Ceramic Taper Candle Holder With Handle is crafted from durable ceramic, making it a stunning and practical addition to any indoor space. Measuring 11 × 11 × 14 cm, this beautifully designed holder seamlessly fits into various decor styles, enhancing your candles' aesthetic.<br><br>This holder features a convenient handle, allowing for easy movement while maintaining a stable base for your taper candles. Perfect for table centrepieces or accentuating your mantle, it brings warmth and charm to your home.<br><br>Ideal for indoor use, the Alora candle holder complements a range of settings, whether as a standalone piece or part of a curated display with metallic or glass accents, creating a striking visual appeal.",
    to: "The Alora Ceramic Taper Candle Holder With Handle is crafted from durable ceramic, making it a stunning and practical addition to any indoor space. Measuring 11 × 11 × 14 cm, this beautifully designed holder seamlessly fits into various decor styles, enhancing your candles' aesthetic.\n\nThis holder features a convenient handle, allowing for easy movement while maintaining a stable base for your taper candles. Perfect for table centrepieces or accentuating your mantle, it brings warmth and charm to your home.\n\nIdeal for indoor use, the Alora candle holder complements a range of settings, whether as a standalone piece or part of a curated display with metallic or glass accents, creating a striking visual appeal.",
  },
  {
    id: "drafts.hill-decor-24273",
    title: "Luxe Collection Natural Glow Grey Pillar LED Candle",
    field: "summary",
    from: "The Luxe Collection Natural Glow Grey Pillar LED Candle is designed for those seeking a stylish yet functional lighting solution. Constructed from durable plastic, this pillar candle offers an elegant grey finish that will effortlessly blend into any decor. With dimensions of 7 × 7 × 15 cm, it is compact enough for various display options, whether on a mantelpiece, table, or as part of a decorative arrangement.\n\nIdeal for indoor and fair-weather outdoor use, this LED candle provides the ambiance of a real flame without the safety hazards. It is lightweight at just 0.37 kg, making it easy to relocate whenever needed, while still maintaining a sturdy feel. The candle's design allows it to enhance your living space, bedroom, or any area that could benefit from a soft, ambient glow.\n\nPerfect for special occasions or everyday use, the Luxe Collection LED Candle promotes relaxation and adds a touch of sophistication wherever it is placed. Please note that the specific details regarding battery type and whether batteries are included are not provided on the product page; for information on battery specifics, please consult the original manual or customer support.",
    to: "The Luxe Collection Natural Glow Grey Pillar LED Candle is designed for those seeking a stylish yet functional lighting solution. Constructed from durable plastic, this pillar candle offers an elegant grey finish that will effortlessly blend into any decor. With dimensions of 7 × 7 × 15 cm, it is compact enough for various display options, whether on a mantelpiece, table, or as part of a decorative arrangement.\n\nIdeal for indoor and fair-weather outdoor use, this LED candle provides the ambiance of a real flame without the safety hazards. It is lightweight at just 0.37 kg, making it easy to relocate whenever needed, while still maintaining a sturdy feel. The candle's design allows it to enhance your living space, bedroom, or any area that could benefit from a soft, ambient glow.\n\nPerfect for special occasions or everyday use, the Luxe Collection LED Candle promotes relaxation and adds a touch of sophistication wherever it is placed.",
  },
  {
    id: "drafts.hill-decor-24458",
    title: "Marra Squat Vase",
    field: "summary",
    from: "Crafted from durable ceramic, the Marra Squat Vase features an eye-catching black finish that elevates its surroundings. With dimensions of 36 × 36 × 27 cm, it is ideal for a variety of displays, fitting comfortably on shelves, tables, or windowsills. Its sturdy build makes it suitable for both indoor environments and decorative arrangements.\n\nThe vase's rounded structure enhances visual balance, making it a striking focal point for any room. Whether you choose to showcase it alone or as part of a collection, it integrates beautifully with other pieces from The Ceramic Collection, allowing for versatile styling options. Its adaptable design means it can easily complement seasonal or themed decorations.\n\nPerfect for use as a decorative accent, the Marra Squat Vase also serves well for showcasing dried flowers or artificial arrangements. Please note, however, that it is not specified if it is watertight, so its use for fresh flowers is not advised without further information.",
    to: "Crafted from durable ceramic, the Marra Squat Vase features an eye-catching black finish that elevates its surroundings. With dimensions of 36 × 36 × 27 cm, it is ideal for a variety of displays, fitting comfortably on shelves, tables, or windowsills. Its sturdy build makes it suitable for both indoor environments and decorative arrangements.\n\nThe vase's rounded structure enhances visual balance, making it a striking focal point for any room. Whether you choose to showcase it alone or as part of a collection, it integrates beautifully with other pieces from The Ceramic Collection, allowing for versatile styling options. Its adaptable design means it can easily complement seasonal or themed decorations.\n\nPerfect for use as a decorative accent, the Marra Squat Vase is best suited to dried flowers or artificial arrangements rather than fresh flowers with water.",
  },
  {
    id: "drafts.hill-decor-24469",
    title: "Tava Medium Hewn Vase",
    field: "summary",
    from: "The Tava Medium Hewn Vase is expertly crafted from ceramic, offering a raw ceramic finish that adds visual depth and character. Measuring 16 × 16 × 22 cm, this vase is perfect for a variety of interior styles, from modern to rustic. Its clean, white colour makes it an adaptable addition to any eclectic home setting, whether on a shelf, tabletop, or within window displays.\n\nWith a weight of 1.2 kg, the vase offers a substantial presence without overwhelming smaller spaces, making it ideal for centrepieces or decorative accents. This versatile piece can complement other items from the Ceramic Collection, allowing for a cohesive look across your decor.\n\nEnhance your living area or office with the Tava Medium Hewn Vase, and enjoy the tactile quality and artistry it brings. While its specifications are clearly defined, please note that care details and its suitability for holding water are not specified. Be sure to consider these factors when selecting your decor items.",
    to: "The Tava Medium Hewn Vase is expertly crafted from ceramic, offering a raw ceramic finish that adds visual depth and character. Measuring 16 × 16 × 22 cm, this vase is perfect for a variety of interior styles, from modern to rustic. Its clean, white colour makes it an adaptable addition to any eclectic home setting, whether on a shelf, tabletop, or within window displays.\n\nWith a weight of 1.2 kg, the vase offers a substantial presence without overwhelming smaller spaces, making it ideal for centrepieces or decorative accents. This versatile piece can complement other items from the Ceramic Collection, allowing for a cohesive look across your decor.\n\nEnhance your living area or office with the Tava Medium Hewn Vase, and enjoy the tactile quality and artistry it brings.",
  },
  {
    id: "drafts.hill-decor-24476",
    title: "Kemi Medium Olpe Vase",
    field: "summary",
    from: "The Kemi Medium Olpe Vase is crafted from durable ceramic, showcasing a smooth glazed finish that highlights its elegant design. Measuring 21 x 21 x 30 cm, this versatile piece fits seamlessly into a variety of styles and placements. Its striking white colour and graceful form make it an ideal choice for floral arrangements or as a decorative accent in any room.\n\nThis ceramic vase is perfect for adding a touch of sophistication to your home. Whether you place it in a modern or traditional setting, it serves as a beautiful focal point that harmonises with multiple accessory styles. Designed to cater to various decor needs, it fits well on dining tables, mantelpieces, and shelves, enhancing the overall aesthetic of any space.\n\nWith a weight of 1.7 kg, the Kemi Medium Olpe Vase is substantial yet easy to handle. While its design is focused on aesthetics, you will need to consider appropriate uses as specific functionality details are not provided. Its striking presence will surely elevate your home decor.",
    to: "The Kemi Medium Olpe Vase is crafted from durable ceramic, showcasing a smooth glazed finish that highlights its elegant design. Measuring 21 x 21 x 30 cm, this versatile piece fits seamlessly into a variety of styles and placements. Its striking white colour and graceful form make it an ideal choice for floral arrangements or as a decorative accent in any room.\n\nThis ceramic vase is perfect for adding a touch of sophistication to your home. Whether you place it in a modern or traditional setting, it serves as a beautiful focal point that harmonises with multiple accessory styles. Designed to cater to various decor needs, it fits well on dining tables, mantelpieces, and shelves, enhancing the overall aesthetic of any space.\n\nWith a weight of 1.7 kg, the Kemi Medium Olpe Vase is substantial yet easy to handle. Its striking presence will surely elevate your home decor.",
  },
  {
    id: "drafts.hill-decor-24499",
    title: "Stratos Hand Painted Canvas In Frame",
    field: "summary",
    from: "The Stratos Hand Painted Canvas In Frame combines artistic depth with a carefully designed frame, perfect for enhancing any decor. Measuring 3 × 80 × 120 cm, this canvas is crafted from high-quality materials to ensure lasting beauty and impact.\n\nThis striking artwork is versatile enough to complement various designs, from modern to eclectic. Its hand-painted surface features a layered finish that adds visual interest and character to your walls, making it a perfect choice for living rooms, bedrooms, or dining areas.\n\nWith a weight of 2.6 kg, the canvas requires suitable fixings based on your wall type, ensuring secure placement in any room. Detailed care instructions are not provided, so clean with care to maintain its stunning appearance.",
    to: "The Stratos Hand Painted Canvas In Frame combines artistic depth with a carefully designed frame, perfect for enhancing any decor. Measuring 3 × 80 × 120 cm, this canvas is crafted from high-quality materials to ensure lasting beauty and impact.\n\nThis striking artwork is versatile enough to complement various designs, from modern to eclectic. Its hand-painted surface features a layered finish that adds visual interest and character to your walls, making it a perfect choice for living rooms, bedrooms, or dining areas.\n\nWith a weight of 2.6 kg, the canvas requires suitable fixings based on your wall type, ensuring secure placement in any room. Dust gently or wipe with a dry cloth to maintain its appearance.",
  },
  {
    id: "drafts.hill-decor-24533",
    title: "Black Quarterfoil Decorative Hanging Mirror",
    field: "description",
    from: "The supplier's page does not provide specific care instructions. For general care, it is advisable to clean the metal frame and glass surface with a soft, dry cloth to prevent any possible damage.",
    to: "Clean the metal frame and glass surface with a soft, dry cloth to prevent any possible damage.",
  },
  {
    id: "drafts.hill-decor-24533",
    title: "Black Quarterfoil Decorative Hanging Mirror",
    field: "faq",
    faqQuestion: "Does the mirror require a battery or a socket?",
    from: "The supplier page does not state if a battery or socket is required.",
    to: "No — it's a standard hanging mirror with no lighting feature, so no battery or socket is required.",
  },
  {
    id: "drafts.hill-decor-24533",
    title: "Black Quarterfoil Decorative Hanging Mirror",
    field: "faq",
    faqQuestion: "Is the mirror made of real glass?",
    from: "The supplier page does not provide specific information about the glass type.",
    to: "Check the included product information for the exact glass specification.",
  },
  {
    id: "drafts.hill-decor-24571",
    title: "Moora Earthen Wash Vase",
    field: "summary",
    from: "The Moora Earthen Wash Vase is made from durable concrete, showcasing a unique design that enhances any decor. It measures 58 × 58 × 54 cm, making it an eye-catching addition to your floral arrangements or simply as a decorative piece. Suitable for both indoor and outdoor settings, this vase can elevate the aesthetics of gardens, patios, or living spaces.\n\nWith a weight of 26 kg, it provides stability and durability to withstand various weather conditions. Whether you place it in your hallway, living room, or outdoor area, it adds a charming touch wherever it goes. Pair it with your favourite flowers or let it stand alone as an elegant statement piece.\n\nThis vase is designed for decorative use; details on its capacity for holding water or food are not provided. Please consult the instruction manual or customer support for further information regarding usage and care.",
    to: "The Moora Earthen Wash Vase is made from durable concrete, showcasing a unique design that enhances any decor. It measures 58 × 58 × 54 cm, making it an eye-catching addition to your floral arrangements or simply as a decorative piece. Suitable for both indoor and outdoor settings, this vase can elevate the aesthetics of gardens, patios, or living spaces.\n\nWith a weight of 26 kg, it provides stability and durability to withstand various weather conditions. Whether you place it in your hallway, living room, or outdoor area, it adds a charming touch wherever it goes. Pair it with your favourite flowers or let it stand alone as an elegant statement piece.",
  },
  {
    id: "drafts.hill-decor-24610",
    title: "Ashen Medium Tall Vase",
    field: "faq",
    faqQuestion: "Will each vase look exactly the same?",
    from: "The supplier does not state that every piece is identical, so there may be slight variations.",
    to: "Handmade pieces like this can have slight variations from one to the next.",
  },
  {
    id: "drafts.hill-decor-24714",
    title: "Small Blue Flora Olpe Vase",
    field: "summary",
    from: "Crafted from durable ceramic, the Small Blue Flora Olpe Vase features a charming blue floral decoration that adds a vibrant touch to any space. Measuring 24 × 24 × 23 cm, this vase is ideal for various surface placements, making it versatile for your home decor.\n\nThe small scale of this vase allows it to complement larger pieces beautifully, perfect for creating sophisticated displays on bookshelves, windowsills, or bedside tables. Its classic Olpe form provides a unique focal point in contemporary and eclectic interiors.\n\nDesigned for indoor use only, this vase is not intended for outdoor placements. Cleaning and maintenance details are not specified; hence, you can refer to the supplied instruction manual or customer support for guidance.",
    to: "Crafted from durable ceramic, the Small Blue Flora Olpe Vase features a charming blue floral decoration that adds a vibrant touch to any space. Measuring 24 × 24 × 23 cm, this vase is ideal for various surface placements, making it versatile for your home decor.\n\nThe small scale of this vase allows it to complement larger pieces beautifully, perfect for creating sophisticated displays on bookshelves, windowsills, or bedside tables. Its classic Olpe form provides a unique focal point in contemporary and eclectic interiors.\n\nDesigned for indoor use only, this vase is not intended for outdoor placements.",
  },
  {
    id: "drafts.hill-decor-24721",
    title: "Large Olympia Terracotta Vase",
    field: "summary",
    from: "Crafted from ceramic, the Large Olympia Terracotta Vase exudes a warm matte finish that enhances its classical form. Measuring 40 × 40 × 37 cm, this piece is perfect for making a bold statement on the floor, a console, or a sideboard.\n\nWeighing 8.6 kg, this robust vase is designed for indoor use, adding a decorative touch to various spaces without the worry of outdoor exposure. Its generous size makes it a striking focal point in any interior, effortlessly enhancing your home’s aesthetic.\n\nIdeal for pairing with other decorative pieces, this large vase complements both contemporary and traditional styles. Please note, while it is primarily designed for display, the specifics of its water retention capabilities are not stated, suggesting it is best used decoratively.",
    to: "Crafted from ceramic, the Large Olympia Terracotta Vase exudes a warm matte finish that enhances its classical form. Measuring 40 × 40 × 37 cm, this piece is perfect for making a bold statement on the floor, a console, or a sideboard.\n\nWeighing 8.6 kg, this robust vase is designed for indoor use, adding a decorative touch to various spaces without the worry of outdoor exposure. Its generous size makes it a striking focal point in any interior, effortlessly enhancing your home’s aesthetic.\n\nIdeal for pairing with other decorative pieces, this large vase complements both contemporary and traditional styles, and is best suited to decorative use.",
  },
  {
    id: "drafts.hill-decor-9018",
    title: "Stone Based Hurricane Lantern",
    field: "summary",
    from: "Crafted from stone, the Stone Based Hurricane Lantern offers a chic addition to any decor style. Its dimensions of 14 × 14 × 30 cm make it an ideal centrepiece for your home while the weight at 2.68 kg ensures stability.\nThe lantern embraces neutral and stoneware trends, with its stylish cream hue and handcrafted design. Perfect for emphasising rustic or contemporary themes, this piece integrates seamlessly with a variety of home aesthetics.\nThis lantern, though the burn time is not specified, promises a notable presence wherever placed. Ideal for living rooms, dining areas, or outdoor patios, it sets the mood with ease, though care must be taken for indoor use due to safety precautions.",
    to: "Crafted from stone, the Stone Based Hurricane Lantern offers a chic addition to any decor style. Its dimensions of 14 × 14 × 30 cm make it an ideal centrepiece for your home while the weight at 2.68 kg ensures stability.\nThe lantern embraces neutral and stoneware trends, with its stylish cream hue and handcrafted design. Perfect for emphasising rustic or contemporary themes, this piece integrates seamlessly with a variety of home aesthetics.\nThis lantern promises a notable presence wherever placed. Ideal for living rooms, dining areas, or outdoor patios, it sets the mood with ease, though care must be taken for indoor use due to safety precautions.",
  },
  {
    id: "drafts.hill-decor-9058",
    title: "Medium Stone Candle Holder",
    field: "summary",
    from: "The Medium Stone Candle Holder seamlessly combines natural elegance with versatile design. Crafted from high-quality stone, it showcases a stunning natural finish, making it a perfect fit for modern interiors. Measuring 11 × 11 × 30 cm, this candle holder is designed to add ambiance and charm to any room.\n\nIdeal for indoor use, the holder can effortlessly enhance your dining table, mantelpiece, or any decorative display. Its neutral cream colour harmonises beautifully with a variety of decor styles, from contemporary to rustic.\n\nAlthough the burn time is not specified, it serves as a chic accent piece whether holding a lit candle or standing alone as a decorative item. Its durable stone material not only adds a tactile quality but also ensures its longevity in your home.",
    to: "The Medium Stone Candle Holder seamlessly combines natural elegance with versatile design. Crafted from high-quality stone, it showcases a stunning natural finish, making it a perfect fit for modern interiors. Measuring 11 × 11 × 30 cm, this candle holder is designed to add ambiance and charm to any room.\n\nIdeal for indoor use, the holder can effortlessly enhance your dining table, mantelpiece, or any decorative display. Its neutral cream colour harmonises beautifully with a variety of decor styles, from contemporary to rustic.\n\nIt serves as a chic accent piece whether holding a lit candle or standing alone as a decorative item. Its durable stone material not only adds a tactile quality but also ensures its longevity in your home.",
  },
  {
    id: "drafts.premier-housewares-1600571",
    title: "Cassini Chrome Large Swivel Mirror",
    field: "description",
    from: "- **Modern Design**: Sleek and contemporary look.",
    to: "Modern design: a sleek, contemporary look.",
  },
  {
    id: "drafts.premier-housewares-1600571",
    title: "Cassini Chrome Large Swivel Mirror",
    field: "description",
    from: "- **Swivel Mirror**: Easily adjust the angle for optimal viewing.",
    to: "Swivel mirror: adjust the angle for optimal viewing.",
  },
  {
    id: "drafts.premier-housewares-1600571",
    title: "Cassini Chrome Large Swivel Mirror",
    field: "description",
    from: "- **Magnifying Glass**: One side features magnification for finer details.",
    to: "Magnifying glass: one side features magnification for finer details.",
  },
  {
    id: "drafts.premier-housewares-1600571",
    title: "Cassini Chrome Large Swivel Mirror",
    field: "description",
    from: "- **Stylish and Practical**: Blends form with function.",
    to: "Stylish and practical: blends form with function.",
  },
  {
    id: "drafts.premier-housewares-1600571",
    title: "Cassini Chrome Large Swivel Mirror",
    field: "description",
    from: "- **Everyday Use**: Ideal for daily grooming needs.",
    to: "Everyday use: ideal for daily grooming needs.",
  },
  {
    id: "drafts.premier-housewares-1600571",
    title: "Cassini Chrome Large Swivel Mirror",
    field: "description",
    from: "- **Dimensions**: 17 cm x 10 cm x 22.5 cm (w x d x h)",
    to: "Dimensions: 17 × 10 × 22.5cm (w × d × h)",
  },
  {
    id: "drafts.premier-housewares-1600571",
    title: "Cassini Chrome Large Swivel Mirror",
    field: "description",
    from: "- **Material Composition**: Iron, Glass, Polypropylene, EVA, Sponge",
    to: "Material composition: iron, glass, polypropylene, EVA, sponge",
  },
  {
    id: "drafts.premier-housewares-1600571",
    title: "Cassini Chrome Large Swivel Mirror",
    field: "description",
    from: "- **Weight**: 5.2 kg",
    to: "Weight: 5.2kg",
  },
  {
    id: "drafts.premier-housewares-2450047",
    title: "Goa White Rattan Effect Hanging Chair",
    field: "description",
    from: "The Goa White Rattan Effect Hanging Chair requires assembly upon delivery. It is packaged in a total of 4 cartons for transit. Unfortunately, the supplier does not specify whether any tools are supplied or the time it will take for assembly. For more precise assembly instructions, refer to the provided manual.",
    to: "The Goa White Rattan Effect Hanging Chair requires assembly upon delivery. It is packaged in a total of 4 cartons for transit. Check the included manual for the tools needed and expected assembly time.",
  },
  {
    id: "drafts.premier-housewares-2450047",
    title: "Goa White Rattan Effect Hanging Chair",
    field: "faq",
    faqQuestion: "Is there a warranty included with this product?",
    from: "The supplier does not specify any warranty information. For further details, please contact customer support.",
    to: "Contact customer support for warranty details on this product.",
  },
  {
    id: "drafts.premier-housewares-5502319",
    title: "Opus Woven Rope Footstool",
    field: "summary",
    from: "Crafted with a natural eucalyptus wood frame and a tactile cotton rope weave, the Opus Woven Rope Footstool brings a touch of Scandinavian style to your garden. Measuring 47 × 47 × 36 cm, it's the perfect size for relaxation or extra seating. This footstool's eco-conscious materials make it an ideal choice for environmentally aware decorators.\n\nThe Opus Woven Rope Footstool is versatile and functional, seamlessly blending into various outdoor settings. Its simple yet elegant design can accentuate your patio or garden. The soft texture of its woven surface enhances comfort, making it a delightful choice for lounging.\n\nPlease note that assembly is required; however, the precise details regarding included components are not specified. This footstool is designed for outdoor use but should be stored dry to maintain its quality. Perfect for enjoying sunny days in your garden, this stylish piece is a must-have accessory for your outdoor living area.",
    to: "Crafted with a natural eucalyptus wood frame and a tactile cotton rope weave, the Opus Woven Rope Footstool brings a touch of Scandinavian style to your garden. Measuring 47 × 47 × 36 cm, it's the perfect size for relaxation or extra seating. This footstool's eco-conscious materials make it an ideal choice for environmentally aware decorators.\n\nThe Opus Woven Rope Footstool is versatile and functional, seamlessly blending into various outdoor settings. Its simple yet elegant design can accentuate your patio or garden. The soft texture of its woven surface enhances comfort, making it a delightful choice for lounging.\n\nAssembly is required. This footstool is designed for outdoor use but should be stored dry to maintain its quality. Perfect for enjoying sunny days in your garden, this stylish piece is a must-have accessory for your outdoor living area.",
  },
  {
    id: "drafts.premier-housewares-5505861",
    title: "Harlie Small Ceramic Planter",
    field: "description",
    from: "The supplier did not state whether the Harlie Small Ceramic Planter has pre-drilled drainage holes or includes a saucer, which can affect water drainage. It is advisable to check the planter for drainage options or use plant liners to ensure proper water management.",
    to: "Check the planter for drainage holes before planting directly, or use a plant liner to manage water drainage safely either way.",
  },
  {
    id: "drafts.premier-housewares-5505861",
    title: "Harlie Small Ceramic Planter",
    field: "description",
    from: "As a precaution, consider using it indoors unless further details can be confirmed from the supplier or user manual.",
    to: "As a precaution, it's best suited to indoor use.",
  },
  {
    id: "drafts.premier-housewares-5505861",
    title: "Harlie Small Ceramic Planter",
    field: "faq",
    faqQuestion: "Can the planter be used outdoors in frost?",
    from: "The supplier did not provide details on outdoor use or frost resistance. Consider using indoors or consult the product manual for confirmation.",
    to: "It's best suited to indoor use, particularly through winter frost.",
  },
  {
    id: "drafts.product-aosom-84c-093gy",
    title: "Retractable Metal Pergola Canopy, Grey",
    field: "faq",
    faqQuestion: "How many people are needed to assemble the pergola?",
    from: "The supplier does not specify how many people are required for assembly, however, it is generally easier with at least two people.",
    to: "Assembly is generally easier with at least two people.",
  },
  {
    id: "drafts.product-aw-waterf-21",
    title: "Grand Water Feature - Colour Changing Crystal Ball in Rock",
    field: "description",
    from: "The supplier page does not indicate whether the water feature is frost resistant or provide guidance on winter care. To ensure the longevity of the water feature, it is recommended to drain it appropriately during colder months as per the user manual.",
    to: "To protect it through winter, drain the water feature during colder months and follow the included manual's winter-care guidance.",
  },
  {
    id: "drafts.product-aw-waterf-21",
    title: "Grand Water Feature - Colour Changing Crystal Ball in Rock",
    field: "faq",
    faqQuestion: "Can this water feature be left outside in winter?",
    from: "The supplier page does not indicate whether the feature can be left outside or detail winter care. It is advisable to consult the manual regarding winter maintenance.",
    to: "Draining it before winter and following the included manual's guidance is the safest approach.",
  },
  {
    id: "drafts.product-import-lentia-urn-table-lamp-with-linen-shade",
    title: "Lentia Urn Table Lamp With Linen Shade",
    field: "summary",
    from: "The Lentia Urn Table Lamp with Linen Shade is the epitome of elegance, perfect for adding a touch of sophistication to any space. Its design marries classic charm with modern sensibilities, making it a versatile addition to various interior styles. This lamp promises to be a focal point, combining functionality with aesthetic delight.\nWhile the exact dimensions are not specified, this table lamp is an excellent choice for those seeking a refined lighting solution. It's recommended for use in living rooms, bedrooms, or dining areas where a soft, ambient glow is desired. The absence of detailed size information means consulting the instruction manual is advisable before purchase.\nThis lamp offers a timeless appeal that effortlessly complements diverse decor themes. Although specific material details are unavailable, the lamp's overall finish and styling suggest a durable and quality build. This piece is sure to enhance your home's ambience while providing adjustable lighting solutions for everyday use.",
    to: "The Lentia Urn Table Lamp with Linen Shade is the epitome of elegance, perfect for adding a touch of sophistication to any space. Its design marries classic charm with modern sensibilities, making it a versatile addition to various interior styles. This lamp promises to be a focal point, combining functionality with aesthetic delight.\nThis table lamp is an excellent choice for those seeking a refined lighting solution. It's recommended for use in living rooms, bedrooms, or dining areas where a soft, ambient glow is desired.\nThis lamp offers a timeless appeal that effortlessly complements diverse decor themes. Its overall finish and styling suggest a durable and quality build. This piece is sure to enhance your home's ambience while providing adjustable lighting solutions for everyday use.",
  },
  {
    id: "drafts.product-import-lentia-urn-table-lamp-with-linen-shade",
    title: "Lentia Urn Table Lamp With Linen Shade",
    field: "faq",
    faqQuestion:
      "Can the Lentia Urn Table Lamp be used in a bathroom or outdoors?",
    from: "The supplier page does not list an IP rating. For safety, refer to the instruction manual for location suitability.",
    to: "For safety in a bathroom or outdoors, check the included instructions for the lamp's IP rating before use.",
  },
  {
    id: "drafts.product-import-stellatable-lamp-with-linen-shade",
    title: "StellaTable Lamp With Linen Shade",
    field: "faq",
    faqQuestion:
      "What is the delivery time for the StellaTable Lamp With Linen Shade?",
    from: "Kaiku offers delivery within 7–14 days for products under £50, including this lamp.",
    to: "Kaiku offers delivery within 7–14 days for this lamp.",
  },
];

async function main() {
  const byId = new Map<string, Fix[]>();
  for (const fix of FIXES) {
    byId.set(fix.id, [...(byId.get(fix.id) ?? []), fix]);
  }

  const transaction = client.transaction();
  let queued = 0;
  const report: {
    id: string;
    title: string;
    applied: string[];
    missed: string[];
  }[] = [];

  for (const [id, fixes] of byId) {
    const doc = await client.fetch<{
      summary: string | null;
      description: Block[] | null;
      faqs: Faq[] | null;
    } | null>(`*[_id == $id][0]{summary, description, faqs}`, { id });
    if (!doc) {
      report.push({
        id,
        title: fixes[0]!.title,
        applied: [],
        missed: fixes.map((f) => f.from),
      });
      continue;
    }

    const applied: string[] = [];
    const missed: string[] = [];
    const patch: Record<string, unknown> = {};

    for (const fix of fixes) {
      if (fix.field === "summary") {
        if (doc.summary === fix.from) {
          patch.summary = fix.to;
          applied.push(fix.from);
        } else {
          missed.push(fix.from);
        }
      } else if (fix.field === "description") {
        const blocks =
          (patch.description as Block[] | undefined) ?? doc.description ?? [];
        let found = false;
        const next = blocks.map((b) => {
          if (b._type !== "block") return b;
          const text = (b.children ?? []).map((c) => c.text ?? "").join("");
          if (text !== fix.from) return b;
          found = true;
          return collapseBlock(b, fix.to);
        });
        if (found) {
          patch.description = next;
          applied.push(fix.from);
        } else {
          missed.push(fix.from);
        }
      } else if (fix.field === "faq") {
        const faqs = (patch.faqs as Faq[] | undefined) ?? doc.faqs ?? [];
        let found = false;
        const next = faqs.map((f) => {
          if (f.question !== fix.faqQuestion || f.answer !== fix.from) return f;
          found = true;
          return { ...f, answer: fix.to };
        });
        if (found) {
          patch.faqs = next;
          applied.push(fix.from);
        } else {
          missed.push(fix.from);
        }
      }
    }

    report.push({ id, title: fixes[0]!.title, applied, missed });
    if (apply && Object.keys(patch).length > 0) {
      transaction.patch(id, (p) => p.set(patch));
      queued++;
    }
  }

  for (const entry of report) {
    console.log(`\n==== ${entry.id} | ${entry.title}`);
    console.log(
      `  applied: ${entry.applied.length}, missed: ${entry.missed.length}`,
    );
    for (const m of entry.missed) console.log("  MISSED:", JSON.stringify(m));
  }

  const totalApplied = report.reduce((n, r) => n + r.applied.length, 0);
  const totalMissed = report.reduce((n, r) => n + r.missed.length, 0);
  console.log(`\nTotal: ${totalApplied} matched, ${totalMissed} missed.`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Applied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-draft-artefact-fix-batch1.json`,
    JSON.stringify({ apply, queued, report }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
