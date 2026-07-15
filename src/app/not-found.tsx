import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-canvas flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-muted text-[13px] font-medium tracking-[0.18em] uppercase">
        404
      </p>
      <h1 className="text-ink font-display mt-3 text-3xl tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="text-muted mt-3 max-w-sm">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Link
        href="/"
        className="bg-ink text-canvas mt-8 inline-flex h-12 items-center justify-center rounded-lg px-8 text-[12px] font-semibold tracking-[0.14em] uppercase"
      >
        Back to Home
      </Link>
    </div>
  );
}
