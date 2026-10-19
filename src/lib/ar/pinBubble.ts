export type PinBubbleSide = 'right' | 'left' | 'below' | 'above';

/**
 * Where a pin's speech bubble may go without leaving the stage that clips it. All sizes are px.
 * `from`/`to` bound the bubble along the edge it hangs from (top to bottom beside the pin, left to right below or
 * above it), measured from the pin center: the CSS keeps the bubble centered on the pin and slides it inward only as
 * far as an edge needs, so it is top-aligned near the top edge and bottom-aligned near the bottom edge.
 */
export interface PinBubbleLayout { side: PinBubbleSide; maxWidth: number; maxHeight: number; from: number; to: number }

/** From the pin center to the bubble's near edge; the tail sits in this gap (see .ar-pin-bubble in ar-exhibit.css). */
export const PIN_BUBBLE_GAP = 24;
const MARGIN = 8;
/** Beside the pin is best once this wide; narrower than SIDE_MIN, a bubble below or above reads better. */
const WANT = 220, SIDE_MIN = 150, DOWN_MIN = 100;
/** Head start for last frame's side, so a pin wobbling on the camera picture does not make its bubble jump. */
const STICK = 24;

/** Picks the bubble's side for a pin at (x, y) on a width x height stage: right of the pin, left of it in the right part of the stage, below or above it when the stage is too narrow for either. */
export function pinBubbleLayout(x: number, y: number, width: number, height: number, previous?: PinBubbleSide): PinBubbleLayout {
  const room: Record<PinBubbleSide, number> = {
    right: width - MARGIN - PIN_BUBBLE_GAP - x, left: x - PIN_BUBBLE_GAP - MARGIN,
    below: height - MARGIN - PIN_BUBBLE_GAP - y, above: y - PIN_BUBBLE_GAP - MARGIN,
  };
  const bonus = (side: PinBubbleSide) => side === previous ? STICK : 0;
  // Beyond WANT more room does not help, so right wins whenever it is wide enough.
  const beside: PinBubbleSide = Math.min(room.right, WANT) + bonus('right') >= Math.min(room.left, WANT) + bonus('left') ? 'right' : 'left';
  const under: PinBubbleSide = room.below + bonus('below') >= room.above + bonus('above') ? 'below' : 'above';
  const wasBeside = previous === 'right' || previous === 'left';
  const side = Math.min(room[beside], WANT) + (wasBeside ? STICK : 0) >= SIDE_MIN || room[under] + bonus(under) < DOWN_MIN ? beside : under;
  const across = side === 'right' || side === 'left';
  const from = Math.ceil(MARGIN - (across ? y : x)), to = Math.floor((across ? height : width) - MARGIN - (across ? y : x));
  const deep = Math.max(0, Math.floor(room[side]));
  return { side, maxWidth: across ? deep : to - from, maxHeight: across ? to - from : deep, from, to };
}
