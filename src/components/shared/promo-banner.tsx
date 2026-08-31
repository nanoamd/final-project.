/**
 * The one site-wide top banner. Always shown, on every page it appears on —
 * no dismiss button.
 *
 * It used to be closable, with the dismissal remembered in localStorage.
 * Damien: *"i also dont want that banner to dissapear which it does"* —
 * anyone who had ever clicked the X (which after months of looking at your
 * own shop is everyone who works on it) stopped seeing it, including every
 * future message put in it. A banner that only strangers ever see is not
 * worth having, so there is no longer a way to close it.
 *
 * Colour: back to `bg-brass`, the burnt-orange brand accent. A first pass
 * changed this to grey on the mistaken read of "i like it grey" — Damien
 * meant the header bar in his screenshot, not this banner. "the banner can
 * stay orange!"
 */
export function PromoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brass relative flex items-center justify-center px-10 py-2.5 text-center">
      <p className="text-ink text-[13px] font-medium sm:text-[14px]">
        {children}
      </p>
    </div>
  );
}
