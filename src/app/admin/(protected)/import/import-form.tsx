"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import type { ImportProductResult } from "@/server/actions/admin-import";
import { importProductsFromUrls } from "@/server/actions/admin-import";

export function AdminImportForm() {
  const [pending, setPending] = React.useState(false);
  const [results, setResults] = React.useState<ImportProductResult[] | null>(
    null,
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = formData.get("urls");
    const supplierName = formData.get("supplierName");
    if (typeof raw !== "string" || typeof supplierName !== "string") return;
    if (!supplierName.trim()) return;

    const urls = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!urls.length) return;

    setPending(true);
    setResults(null);
    try {
      const outcome = await importProductsFromUrls(urls, supplierName.trim());
      setResults(outcome);
    } catch {
      setResults([
        { ok: false, error: "Something went wrong. Please try again." },
      ]);
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
      <h1 className="font-display mt-3 text-2xl">Import products from URLs</h1>
      <p className="mt-2 max-w-lg text-sm text-neutral-500">
        Enter the supplier these pages are from, then paste one or more of their
        product pages, one per line (up to 3 at once — each import fetches the
        page, runs an AI extraction, and uploads every photo it can find, so a
        bigger batch risks running past the server&rsquo;s time limit partway
        through). For each, we&rsquo;ll pull out a title, tagline, a full
        multi-paragraph description, price, SKU, brand, badges, highlights,
        specs, dimensions, weight, every product photo, and — only where the
        page genuinely states them — delivery lead time, delivery notes and
        warranty terms. Nothing is invented: a field the page doesn&rsquo;t
        clearly state is just left blank for you to fill in, rather than
        guessed. Saved as a draft product for you to check and publish in Sanity
        Studio — nothing goes live automatically. If a Google Sheet is
        configured, every import is also logged there and the supplier&rsquo;s
        product-page link is saved for easy reordering later.
      </p>

      <form onSubmit={onSubmit} className="mt-6 max-w-lg">
        <label
          htmlFor="supplierName"
          className="text-sm font-medium text-neutral-700"
        >
          Supplier name
        </label>
        <input
          id="supplierName"
          name="supplierName"
          required
          type="text"
          placeholder="e.g. SaunaPlunge"
          className="mt-1 mb-4 w-full rounded-lg border border-neutral-300 p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none"
        />
        <textarea
          name="urls"
          required
          rows={8}
          placeholder={
            "https://supplier.example.com/product/one\nhttps://supplier.example.com/product/two"
          }
          className="w-full rounded-lg border border-neutral-300 p-3 font-mono text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none"
        />
        <Button type="submit" disabled={pending} className="mt-3">
          {pending ? "Importing…" : "Import all"}
        </Button>
      </form>

      {results ? (
        <ul className="mt-6 flex max-w-lg flex-col gap-3">
          {results.map((result, index) => (
            <li
              key={index}
              className="rounded-xl border border-neutral-200 bg-white p-5"
            >
              {result.ok ? (
                <>
                  <p className="font-display text-lg">
                    Draft created: {result.title}
                  </p>
                  {result.url ? (
                    <p className="mt-1 truncate text-[12px] text-neutral-400">
                      {result.url}
                    </p>
                  ) : null}
                  {result.studioUrl ? (
                    <a
                      href={result.studioUrl}
                      className="mt-3 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
                    >
                      Review in Sanity Studio →
                    </a>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="text-[13px] text-red-600" role="alert">
                    {result.error}
                  </p>
                  {result.url ? (
                    <p className="mt-1 truncate text-[12px] text-neutral-400">
                      {result.url}
                    </p>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
