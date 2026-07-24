import type { Metadata } from "next";

import { AdminImportForm } from "./import-form";

// Each import in a batch does a page fetch + an AI extraction call + an
// image download/upload, sequentially — well past Vercel's default
// serverless function timeout once you're doing more than a couple. This
// raises the cap for the Server Action this page invokes (see
// MAX_BATCH_URLS in admin-import.ts for the matching batch-size limit).
export const maxDuration = 60;

export const metadata: Metadata = { title: "Import products" };

export default function AdminImportPage() {
  return <AdminImportForm />;
}
