/**
 * The shared behaviour of every horizontal rail on the site.
 *
 * Damien: *"scroll bars bug out when you scroll all the way then try scroll
 * back, been doing this for a while, scrolling must be smoother"*.
 *
 * **What was wrong.** Every rail combined `scroll-snap-align: start` on each
 * card with a `scroll-padding-left` on the container. A card's snap position
 * is its offset minus that padding — and for the *last* cards that position
 * sits beyond `scrollWidth - clientWidth`, which the container can never
 * reach. Having run out of reachable snap points, the browser falls back to
 * the nearest one behind you and pulls you backwards. Scroll to the end and it
 * yanks; try to scroll back and you are fighting a snap engine that is already
 * re-targeting. On the category nav it was worse still, because that rail was
 * `snap-mandatory` and could not rest between points at all.
 *
 * **Why snap is simply removed rather than repaired.** Scroll snapping earns
 * its place when one card fills the viewport and the gesture means "next
 * card". None of these rails are that: cards are a fifth to a quarter of the
 * width, twenty-odd of them, and the gesture means "keep going". At that size
 * the browser re-targets a snap point on every flick, which is the stutter.
 * Free scrolling is both correct and smoother here.
 *
 * **What is kept, and why.**
 *   - `overscroll-x-contain` stops a horizontal flick at the end of a rail
 *     from chaining out and triggering the browser's back gesture.
 *   - `touch-pan-x` keeps vertical page scrolling working from inside a rail
 *     on touch, so a rail is not a dead zone in the middle of the page.
 *   - `data-lenis-prevent` is set by the rails themselves. Lenis owns the
 *     wheel on this site and calls preventDefault, which would swallow a
 *     horizontal trackpad gesture entirely.
 */
export const railScroller =
  "flex touch-pan-x overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
