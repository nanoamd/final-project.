"use client";

import { Flame, Snowflake } from "lucide-react";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import {
  buildProtocol,
  type ContrastAnswers,
  type ExperienceLevel,
  type Goal,
  SAFETY_NOTE,
  type TimeAvailable,
} from "@/lib/contrast-therapy";

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "recovery", label: "Muscle recovery after training" },
  { value: "stress", label: "Stress relief & mental resilience" },
  { value: "sleep", label: "Better sleep" },
  { value: "energy", label: "Energy & alertness" },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "beginner", label: "New to this" },
  { value: "intermediate", label: "Done it a few times" },
  { value: "experienced", label: "Regular practice" },
];

const TIME_OPTIONS: { value: TimeAvailable; label: string }[] = [
  { value: "quick", label: "About 15 minutes" },
  { value: "standard", label: "About 30 minutes" },
  { value: "extended", label: "45 minutes or more" },
];

/**
 * Deterministic, no-AI contrast therapy protocol builder. Product-agnostic
 * like the buying guides and the furniture material selector — no real
 * sauna/cold plunge inventory is purchasable yet, so this teaches a real,
 * personalised session structure rather than matching against products.
 */
export function ContrastTherapyBuilder() {
  const [goal, setGoal] = React.useState<Goal | null>(null);
  const [experience, setExperience] = React.useState<ExperienceLevel | null>(
    null,
  );
  const [time, setTime] = React.useState<TimeAvailable | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const answers: ContrastAnswers | null =
    goal && experience && time ? { goal, experience, time } : null;

  const protocol = answers ? buildProtocol(answers) : null;

  if (submitted && protocol) {
    return (
      <div>
        <p className="text-ink font-display text-xl">
          Your {protocol.goalLabel.toLowerCase()} protocol
        </p>
        <p className="text-muted mt-2 text-[13px]">
          {protocol.totalTimeEstimate} total
        </p>

        <ol className="mt-6 flex flex-col gap-4">
          {protocol.steps.map((step) => (
            <li
              key={step.index}
              className="border-line flex items-center gap-4 rounded-xl border p-5"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  step.type === "hot"
                    ? "bg-brass/10 text-brass"
                    : "bg-blue-500/10 text-blue-600"
                }`}
              >
                {step.type === "hot" ? (
                  <Flame className="size-5" strokeWidth={1.5} />
                ) : (
                  <Snowflake className="size-5" strokeWidth={1.5} />
                )}
              </span>
              <div>
                <p className="text-ink text-[14px] font-semibold">
                  {step.index}. {step.label}
                </p>
                <p className="text-muted mt-0.5 text-[13px]">
                  {step.tempRange} · {step.duration}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="text-graphite mt-6 text-[13px] leading-relaxed">
          {protocol.closingNote}
        </p>

        <p className="text-muted border-line mt-6 border-t pt-5 text-[12px] leading-relaxed">
          {SAFETY_NOTE}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <AppLink
            href="/shop/room/sauna"
            className="border-ink/25 text-ink hover:border-ink flex h-11 items-center justify-center rounded-lg border px-5 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors"
          >
            Shop saunas
          </AppLink>
          <AppLink
            href="/shop/room/cold-plunge"
            className="border-ink/25 text-ink hover:border-ink flex h-11 items-center justify-center rounded-lg border px-5 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors"
          >
            Shop cold plunges
          </AppLink>
        </div>

        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-brass mt-6 block text-[13px] font-medium"
        >
          ← Start again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-muted text-[13px] font-medium tracking-[0.1em] uppercase">
          What are you trying to get out of it?
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGoal(opt.value)}
              aria-pressed={goal === opt.value}
              className={`rounded-lg border px-4 py-3 text-left text-[14px] transition-colors ${
                goal === opt.value
                  ? "border-brass text-ink bg-brass/[0.06]"
                  : "border-line text-graphite hover:border-ink/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-muted text-[13px] font-medium tracking-[0.1em] uppercase">
          How experienced are you with this?
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setExperience(opt.value)}
              aria-pressed={experience === opt.value}
              className={`rounded-lg border px-4 py-3 text-left text-[14px] transition-colors ${
                experience === opt.value
                  ? "border-brass text-ink bg-brass/[0.06]"
                  : "border-line text-graphite hover:border-ink/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-muted text-[13px] font-medium tracking-[0.1em] uppercase">
          How much time do you have?
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTime(opt.value)}
              aria-pressed={time === opt.value}
              className={`rounded-lg border px-4 py-3 text-left text-[14px] transition-colors ${
                time === opt.value
                  ? "border-brass text-ink bg-brass/[0.06]"
                  : "border-line text-graphite hover:border-ink/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!answers}
        onClick={() => setSubmitted(true)}
        className="bg-ink hover:bg-ink/90 text-canvas disabled:bg-ink/30 flex h-13 w-full items-center justify-center rounded-lg text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors sm:w-auto sm:px-8"
      >
        Build my protocol
      </button>
    </div>
  );
}
