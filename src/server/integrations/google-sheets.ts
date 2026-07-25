import "server-only";

import { JWT } from "google-auth-library";

import { env } from "@/env";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// The two tabs this feature writes to. Create them in the target sheet
// yourself with these exact names and header rows — this module never
// creates sheets or tabs, only appends/updates rows in ones that already
// exist, so a missing tab fails loudly in the log rather than silently
// creating an unexpected one.
const IMPORT_LOG_TAB = "Import Log";
const SUPPLIERS_TAB = "Suppliers";

interface ProductImportLogEntry {
  title: string;
  price?: number;
  currency?: string;
  sku?: string;
  categoryName?: string;
  supplierName: string;
  sourceUrl: string;
  studioUrl: string;
}

function getCredentials() {
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const rawKey = env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!spreadsheetId || !clientEmail || !rawKey) return null;
  // Service-account keys are usually pasted into env var UIs as a single
  // line with literal "\n" sequences standing in for real newlines.
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return { spreadsheetId, clientEmail, privateKey };
}

async function getAccessToken(
  clientEmail: string,
  privateKey: string,
): Promise<string | null> {
  const client = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
  const { access_token: token } = await client.authorize();
  return token ?? null;
}

async function sheetsFetch(
  spreadsheetId: string,
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${SHEETS_API}/${spreadsheetId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

async function appendRow(
  spreadsheetId: string,
  token: string,
  tab: string,
  row: (string | number)[],
): Promise<void> {
  const range = encodeURIComponent(`${tab}!A:Z`);
  const response = await sheetsFetch(
    spreadsheetId,
    token,
    `/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [row] }) },
  );
  if (!response.ok) {
    throw new Error(
      `Sheets append to "${tab}" failed with ${response.status}: ${await response.text()}`,
    );
  }
}

/** Finds the row for `supplierName` in the Suppliers tab and appends
 * `link` to its links cell (column B), or creates a new row if the
 * supplier isn't listed yet. */
async function upsertSupplierLink(
  spreadsheetId: string,
  token: string,
  supplierName: string,
  link: string,
): Promise<void> {
  const range = encodeURIComponent(`${SUPPLIERS_TAB}!A:B`);
  const getResponse = await sheetsFetch(
    spreadsheetId,
    token,
    `/values/${range}`,
  );
  if (!getResponse.ok) {
    throw new Error(
      `Sheets read of "${SUPPLIERS_TAB}" failed with ${getResponse.status}: ${await getResponse.text()}`,
    );
  }
  const data = (await getResponse.json()) as { values?: string[][] };
  const rows = data.values ?? [];

  const normalizedTarget = supplierName.trim().toLowerCase();
  const rowIndex = rows.findIndex(
    (row) => row[0]?.trim().toLowerCase() === normalizedTarget,
  );

  if (rowIndex === -1) {
    await appendRow(spreadsheetId, token, SUPPLIERS_TAB, [supplierName, link]);
    return;
  }

  const existingLinks = rows[rowIndex]?.[1] ?? "";
  const updatedLinks = existingLinks ? `${existingLinks}\n${link}` : link;
  const cellRange = encodeURIComponent(`${SUPPLIERS_TAB}!B${rowIndex + 1}`);
  const updateResponse = await sheetsFetch(
    spreadsheetId,
    token,
    `/values/${cellRange}?valueInputOption=USER_ENTERED`,
    { method: "PUT", body: JSON.stringify({ values: [[updatedLinks]] }) },
  );
  if (!updateResponse.ok) {
    throw new Error(
      `Sheets update of "${SUPPLIERS_TAB}" row ${rowIndex + 1} failed with ${updateResponse.status}: ${await updateResponse.text()}`,
    );
  }
}

/**
 * Logs a completed URL import to the configured Google Sheet: one row in
 * "Import Log", and the supplier's product-page link appended in
 * "Suppliers" (so a supplier bought from repeatedly accumulates every
 * product page you've imported from them, for easy reordering later).
 *
 * Fails soft — a Sheets error is logged and swallowed, never thrown, since
 * losing the log entry should never undo an already-created Sanity draft.
 * Returns silently (feature disabled) if the three env vars aren't set.
 */
export async function logProductImportToSheet(
  entry: ProductImportLogEntry,
): Promise<void> {
  const creds = getCredentials();
  if (!creds) return;

  try {
    const token = await getAccessToken(creds.clientEmail, creds.privateKey);
    if (!token) throw new Error("Could not obtain a Google access token");

    await appendRow(creds.spreadsheetId, token, IMPORT_LOG_TAB, [
      new Date().toISOString().slice(0, 10),
      entry.title,
      entry.price ?? "",
      entry.currency ?? "",
      entry.sku ?? "",
      entry.categoryName ?? "",
      entry.supplierName,
      entry.sourceUrl,
      entry.studioUrl,
    ]);

    await upsertSupplierLink(
      creds.spreadsheetId,
      token,
      entry.supplierName,
      entry.sourceUrl,
    );
  } catch (err) {
    console.error("logProductImportToSheet: failed", err);
  }
}
