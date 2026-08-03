/** Shared loading state for every /admin page — the sidebar shell from
 * layout.tsx stays put; only this content area shows the spinner. */
export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="size-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-500"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
