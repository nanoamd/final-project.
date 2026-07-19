"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImportProductResult } from "@/server/actions/admin-import";
import { importProductFromUrl } from "@/server/actions/admin-import";

export default function AdminImportPage() {
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<ImportProductResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = new FormData(event.currentTarget).get("url");
    if (typeof url !== "string" || !url.trim()) return;

    setPending(true);
    setResult(null);
    try {
      const outcome = await importProductFromUrl(url.trim());
      setResult(outcome);
    } catch {
      setResult({
        ok: false,
        error: "Something went wrong. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Link
        href="/admin"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Dashboard
      </Link>
      <h1 className="font-display mt-3 text-2xl">Import product from URL</h1>
      <p className="mt-2 max-w-lg text-sm text-neutral-500">
        Paste a supplier&rsquo;s product page. We&rsquo;ll pull out a title,
        price, description, specs and hero image, and save it as a draft product
        for you to check and publish in Sanity Studio — nothing goes live
        automatically.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex max-w-lg gap-3">
        <Input
          type="url"
          name="url"
          required
          placeholder="https://supplier.example.com/product/..."
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Importing…" : "Import"}
        </Button>
      </form>

      {result ? (
        result.ok ? (
          <div className="mt-6 max-w-lg rounded-xl border border-neutral-200 bg-white p-6">
            <p className="font-display text-lg">
              Draft created: {result.title}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Review the extracted details, fix anything the importer missed,
              and publish when it&rsquo;s ready.
            </p>
            {result.studioUrl ? (
              <a
                href={result.studioUrl}
                className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
              >
                Review in Sanity Studio →
              </a>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 max-w-lg text-[13px] text-red-600" role="alert">
            {result.error}
          </p>
        )
      ) : null}
    </div>
  );
}
