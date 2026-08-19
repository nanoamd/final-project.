import { describe, expect, it } from "vitest";

import { EMAIL_KINDS } from "@/lib/emails/catalogue";
import { ALL_STAGES } from "@/server/hq/workflows";

/**
 * The catalogue's own tests live in `src/lib/emails/`, but these two need the
 * real workflow stage list, and `lib` is not allowed to depend on `server`.
 * They belong on this side of that boundary rather than being dropped — they
 * are the checks that catch a stage name which does not exist.
 */
describe("email catalogue against the real order workflow", () => {
  it("names only stages that actually exist", () => {
    // The failure this guards against is silent: a stage misspelled here — the
    // real names are `review`, `ready_dispatch`, `follow_up`, not the longer
    // ones they read like — means that email simply never sends, with nothing
    // anywhere to say so.
    for (const kind of EMAIL_KINDS) {
      if (!kind.stage) continue;
      expect(ALL_STAGES, `${kind.key} -> ${kind.stage}`).toContain(kind.stage);
    }
  });

  it("accounts for every stage: it either emails or is listed as internal", () => {
    // So a stage added to the workflow later cannot quietly join the silent
    // set without somebody deciding that is what it should do.
    const emailing = EMAIL_KINDS.map((kind) => kind.stage).filter(Boolean);
    const silent = [
      "paid",
      "review",
      "supplier_notified",
      "supplier_confirmed",
      "ready_dispatch",
      "in_transit",
      "follow_up",
      "closed",
    ];
    expect([...emailing, ...silent].sort()).toEqual([...ALL_STAGES].sort());
  });
});
