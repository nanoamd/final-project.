/**
 * Writes one product's description, on demand, from that product's own facts.
 *
 * Called by the "Write description" button in the Studio. Damien's point was
 * that a template cannot be specific to a product but a model can, and this is
 * that: the model sees this product's facts and writes this product's page.
 *
 * The route does the part the model cannot be trusted to do on its own. It
 * checks the finished text against every checker in the project and, if
 * anything fires, sends it back once with the specific objections. If the
 * second attempt also fails, the objections are returned instead of the copy.
 * Nothing is saved from here — the Studio writes the result into the document
 * the editor is already looking at, so it is reviewable and undoable like any
 * other edit.
 */
import { NextResponse } from "next/server";

import { env } from "@/env";
import {
  buildPrompt,
  checkWritten,
  parseSections,
  type ProductFacts,
  sectionsToBlocks,
  type WrittenSection,
} from "@/lib/catalog/write-description";
import { getAuthorizedAdmin } from "@/server/auth/admin";
import { getSanityWriteClient } from "@/server/sanity/write-client";

export const runtime = "nodejs";
/** Two model calls plus Sanity, comfortably inside Vercel's ceiling. */
export const maxDuration = 120;

const PRODUCT_QUERY = /* groq */ `*[_id == $id][0]{
  title, summary, dimensions, weight, deliveryLeadTime, specs,
  "category": category->title,
  "colour": primaryColour
}`;

async function write(prompt: string): Promise<WrittenSection[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      // Enough variation that two similar products do not come out identical,
      // which is the entire complaint the button exists to answer.
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    console.error("write-description: model request failed", response.status);
    return [];
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return parseSections(data.choices?.[0]?.message?.content ?? "");
}

export async function POST(request: Request) {
  const admin = await getAuthorizedAdmin();
  if (!admin)
    return NextResponse.json(
      { error: "Sign in at /admin in this browser first." },
      { status: 401 },
    );

  const { id } = (await request.json()) as { id?: string };
  if (!id)
    return NextResponse.json({ error: "No product id." }, { status: 400 });

  // The client is null when no write token is configured, which is a
  // deployment problem rather than a request problem — say so plainly.
  const sanity = getSanityWriteClient();
  if (!sanity)
    return NextResponse.json(
      { error: "No Sanity write token configured on the server." },
      { status: 500 },
    );

  const doc = await sanity.fetch<ProductFacts | null>(PRODUCT_QUERY, { id });
  if (!doc?.title)
    return NextResponse.json({ error: "Product not found." }, { status: 404 });

  // Dimensions are what the page is largely built from; without them there is
  // very little true to say, and padding it out is the fault we keep hitting.
  const d = doc.dimensions;
  const hasSize = [d?.length, d?.width, d?.height].some(
    (n) => typeof n === "number" && n > 0,
  );
  if (!hasSize)
    return NextResponse.json(
      {
        error:
          "No dimensions recorded. Add them first — without a size there is not enough here to write a page that says anything.",
      },
      { status: 422 },
    );

  let sections = await write(buildPrompt(doc));
  let objections = checkWritten(sections, doc);

  if (objections.length) {
    sections = await write(buildPrompt(doc, objections));
    objections = checkWritten(sections, doc);
  }

  if (objections.length)
    return NextResponse.json(
      {
        error: `Two attempts both failed the checks: ${objections.slice(0, 3).join("; ")}`,
      },
      { status: 422 },
    );

  return NextResponse.json({
    blocks: sectionsToBlocks(sections),
    words: sections
      .flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])])
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length,
    sections: sections.length,
  });
}
