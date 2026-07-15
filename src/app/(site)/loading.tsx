/**
 * Shared loading state for storefront routes. Transparent background — it
 * sits between the header and footer regardless of whether the route it's
 * loading into is dark (Home/Collection) or light (Product/content pages).
 */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        className="border-brass/30 border-t-brass size-8 animate-spin rounded-full border-2"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
