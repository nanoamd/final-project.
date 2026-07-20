/**
 * Deterministic, no-AI contrast therapy (hot/cold) protocol builder.
 * Temperatures, durations and cycle counts reflect commonly-cited general
 * wellness guidance for sauna + cold plunge contrast bathing — not a
 * specific medical study, and not medical advice. Nothing here is tied to
 * a real product; it's category-level guidance, same approach as the
 * buying guides and the furniture material selector.
 */

export type Goal = "recovery" | "stress" | "sleep" | "energy";
export type ExperienceLevel = "beginner" | "intermediate" | "experienced";
export type TimeAvailable = "quick" | "standard" | "extended";

export interface ContrastAnswers {
  goal: Goal;
  experience: ExperienceLevel;
  time: TimeAvailable;
}

export interface ProtocolStep {
  type: "hot" | "cold";
  index: number;
  label: string;
  tempRange: string;
  duration: string;
}

export interface Protocol {
  goalLabel: string;
  steps: ProtocolStep[];
  totalTimeEstimate: string;
  closingNote: string;
}

const GOAL_LABELS: Record<Goal, string> = {
  recovery: "Muscle recovery",
  stress: "Stress relief & resilience",
  sleep: "Better sleep",
  energy: "Energy & alertness",
};

const COLD_BY_EXPERIENCE: Record<
  ExperienceLevel,
  { temp: string; duration: string; minutes: number }
> = {
  beginner: {
    temp: "12–15°C (54–59°F)",
    duration: "1–2 minutes",
    minutes: 1.5,
  },
  intermediate: {
    temp: "8–12°C (46–54°F)",
    duration: "2–3 minutes",
    minutes: 2.5,
  },
  experienced: {
    temp: "3–8°C (37–46°F)",
    duration: "3–5 minutes",
    minutes: 4,
  },
};

const HOT_BY_EXPERIENCE: Record<
  ExperienceLevel,
  { temp: string; duration: string; minutes: number }
> = {
  beginner: {
    temp: "70–80°C (158–176°F)",
    duration: "10–15 minutes",
    minutes: 12,
  },
  intermediate: {
    temp: "80–90°C (176–194°F)",
    duration: "15–18 minutes",
    minutes: 16,
  },
  experienced: {
    temp: "90–100°C (194–212°F)",
    duration: "15–20 minutes",
    minutes: 18,
  },
};

const BASE_CYCLES_BY_TIME: Record<TimeAvailable, number> = {
  quick: 1,
  standard: 2,
  extended: 3,
};

// hot-first ends the session cold; cold-first ends the session hot — the
// closing note below explains why each goal picks the order it does.
const ORDER_BY_GOAL: Record<Goal, "hot-first" | "cold-first"> = {
  recovery: "hot-first",
  stress: "cold-first",
  sleep: "hot-first",
  energy: "cold-first",
};

// Whether the sequence should finish on cold or hot, independent of which
// one it opens with.
const END_ON_BY_GOAL: Record<Goal, "hot" | "cold"> = {
  recovery: "cold",
  stress: "cold",
  sleep: "hot",
  energy: "cold",
};

const CLOSING_NOTE_BY_GOAL: Record<Goal, string> = {
  recovery:
    "Rehydrate well afterwards — contrast bathing is a genuine physical stressor, and recovering from the session matters too.",
  stress:
    "The final stretch in the cold is deliberately the hardest part — that's the point. Focus on steady, controlled breathing rather than fighting the urge to get out.",
  sleep:
    "Finishing on heat lets your body temperature drop naturally afterwards, which is part of what helps with sleep onset — do this 1–2 hours before bed, not right before.",
  energy:
    "Finishing on cold is what makes this energising — expect a real adrenaline lift for the next hour or so, so this isn't the best choice right before bed.",
};

export const SAFETY_NOTE =
  "This is general wellness guidance, not medical advice. Cold water immersion and high heat both place real stress on your cardiovascular system — if you're pregnant, have a heart condition, high or low blood pressure, or any circulatory condition, speak to a doctor before trying contrast therapy. Never cold plunge alone if you're new to it, and get out immediately if you feel dizzy, numb, or unwell in either the heat or the cold.";

function buildSequence(
  order: "hot-first" | "cold-first",
  cycles: number,
  endOn: "hot" | "cold",
): ("hot" | "cold")[] {
  const pair: ("hot" | "cold")[] =
    order === "hot-first" ? ["hot", "cold"] : ["cold", "hot"];
  const seq: ("hot" | "cold")[] = [];
  for (let i = 0; i < cycles; i++) seq.push(...pair);
  if (seq[seq.length - 1] !== endOn) seq.push(endOn);
  return seq;
}

export function buildProtocol(answers: ContrastAnswers): Protocol {
  const { goal, experience, time } = answers;

  let cycles = BASE_CYCLES_BY_TIME[time];
  if (time === "extended" && experience === "experienced") cycles += 1;

  const sequence = buildSequence(
    ORDER_BY_GOAL[goal],
    cycles,
    END_ON_BY_GOAL[goal],
  );

  const cold = COLD_BY_EXPERIENCE[experience];
  const hot = HOT_BY_EXPERIENCE[experience];

  let totalMinutes = 0;
  const steps: ProtocolStep[] = sequence.map((type, i) => {
    const profile = type === "hot" ? hot : cold;
    totalMinutes += profile.minutes;
    return {
      type,
      index: i + 1,
      label: type === "hot" ? "Sauna" : "Cold plunge",
      tempRange: profile.temp,
      duration: profile.duration,
    };
  });

  const roundedMinutes = Math.round(totalMinutes);
  const totalTimeEstimate =
    roundedMinutes < 60
      ? `About ${roundedMinutes} minutes`
      : `About ${Math.round(roundedMinutes / 5) * 5} minutes`;

  return {
    goalLabel: GOAL_LABELS[goal],
    steps,
    totalTimeEstimate,
    closingNote: CLOSING_NOTE_BY_GOAL[goal],
  };
}
