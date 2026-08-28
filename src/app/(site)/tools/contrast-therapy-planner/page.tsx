import type { Metadata } from "next";

import { ContrastTherapyBuilder } from "@/components/shared/contrast-therapy-builder";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Sauna and Cold Plunge Protocol Builder",
  description:
    "How long in the sauna, how long in the cold, how many rounds and in what order — a session plan built around your goal, experience and the time you have.",
  path: "/tools/contrast-therapy-planner",
});

export default function ContrastTherapyPlannerPage() {
  return (
    <ToolPage
      path="/tools/contrast-therapy-planner"
      heading="Sauna and cold plunge: how long, how cold, how many rounds?"
      intro="Contrast therapy is a real skill. How long, how hot, how cold and in what order all depend on what you want from it. Answer three questions and we will build a session plan you can follow."
      method={{
        heading: "The principles behind the plan",
        paragraphs: [
          "Heat first, cold second, is the ordinary order. Going into the sauna warm from the cold is unpleasant and cuts the heat exposure short, whereas going into the cold already hot is what produces the effect people describe. The exception is training: if you are lifting or running afterwards, finishing on heat rather than cold avoids blunting the session.",
          "Rounds matter more than duration. Three moderate rounds do more than one long one, because the response comes from the transition rather than from time spent at either temperature. If you only have twenty minutes, two short rounds beat one long sit.",
          "Finish on cold if the goal is alertness, and on heat if the goal is sleep. This is the single most common mistake — a cold finish late in the evening is stimulating, and people then wonder why they cannot settle.",
          "None of this is medical advice, and it is written for healthy adults. Heat and cold both put load on the heart. If you are pregnant, have a heart condition or high blood pressure, or take medication that affects blood pressure or temperature regulation, ask a doctor before starting rather than after.",
        ],
      }}
      faqs={[
        {
          question: "How long should I stay in a sauna?",
          answer:
            "Eight to fifteen minutes per round suits most people at 70 to 90°C. The honest limit is how you feel rather than the clock: leave when you stop feeling comfortable rather than pushing to a number. Beginners should start at the short end and add time across weeks, not within a single session.",
        },
        {
          question: "How long should I stay in a cold plunge?",
          answer:
            "One to three minutes at 10 to 15°C is enough for most purposes, and colder water means less time rather than more. The first thirty seconds are the hardest and the breath response is normal — controlling your breathing is the skill, and it comes with repetition. Getting out early is always better than staying in badly.",
        },
        {
          question: "Should I finish hot or cold?",
          answer:
            "Cold to feel alert and awake, heat to wind down for sleep. If you plan to train afterwards, finish on heat: cold immediately after resistance training appears to reduce the adaptation you trained for, so leave a few hours between the two.",
        },
        {
          question: "How many rounds of hot and cold should I do?",
          answer:
            "Two to four. Three is the usual answer for a forty-minute session and there is little evidence that more helps. What does help is consistency — three rounds twice a week beats six rounds once a month by a wide margin.",
        },
        {
          question: "Is contrast therapy safe?",
          answer:
            "For healthy adults, used sensibly, yes. It is not safe to combine with alcohol, and it is not the place to test your limits alone. If you are pregnant, have a cardiovascular condition, or take medication affecting blood pressure or temperature regulation, speak to a doctor first. Nothing on this page is medical advice.",
        },
      ]}
      guides={[
        {
          slug: "choosing-a-sauna",
          title: "Barrel vs cabin sauna: how to choose",
        },
      ]}
    >
      <ContrastTherapyBuilder />
    </ToolPage>
  );
}
