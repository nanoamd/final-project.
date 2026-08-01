"use client";

/** Builds the CSV in the browser from data already on the page — no extra
 * endpoint to secure, nothing new to break. */
export function ExportCsvButton({
  rows,
}: {
  rows: { email: string; subscribedAt: string }[];
}) {
  function handleExport() {
    const header = "email,subscribed_at";
    const lines = rows.map(
      (row) => `${row.email},${row.subscribedAt.slice(0, 10)}`,
    );
    const blob = new Blob([[header, ...lines].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kaiku-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-400"
    >
      Download CSV
    </button>
  );
}
