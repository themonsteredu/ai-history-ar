import { describe, expect, it } from 'vitest';
import { PIN_BUBBLE_GAP, pinBubbleLayout, type PinBubbleLayout } from './pinBubble';

/** The largest box the bubble can take for this layout, in stage px. */
function reach(x: number, y: number, layout: PinBubbleLayout) {
  const { side, maxWidth, maxHeight, from, to } = layout;
  if (side === 'right') return { left: x + PIN_BUBBLE_GAP, right: x + PIN_BUBBLE_GAP + maxWidth, top: y + from, bottom: y + to, height: maxHeight };
  if (side === 'left') return { left: x - PIN_BUBBLE_GAP - maxWidth, right: x - PIN_BUBBLE_GAP, top: y + from, bottom: y + to, height: maxHeight };
  if (side === 'below') return { left: x + from, right: x + to, top: y + PIN_BUBBLE_GAP, bottom: y + PIN_BUBBLE_GAP + maxHeight, width: maxWidth };
  return { left: x + from, right: x + to, top: y - PIN_BUBBLE_GAP - maxHeight, bottom: y - PIN_BUBBLE_GAP, width: maxWidth };
}

describe('pin speech bubble layout', () => {
  it('hangs the bubble right of a pin with room, centered on it and as tall as the stage allows', () => {
    expect(pinBubbleLayout(150, 205, 600, 410)).toEqual({ side: 'right', maxWidth: 418, maxHeight: 394, from: -197, to: 197 });
  });
  it('turns to the left in the right part of the stage', () => {
    expect(pinBubbleLayout(480, 205, 600, 410)).toMatchObject({ side: 'left', maxWidth: 448 });
    expect(pinBubbleLayout(560, 60, 600, 410).side).toBe('left');
  });
  it('lets a pin near the top or bottom edge slide its bubble down or up instead of cutting it', () => {
    expect(pinBubbleLayout(100, 30, 600, 410)).toMatchObject({ side: 'right', from: -22, to: 372 });
    expect(pinBubbleLayout(100, 390, 600, 410)).toMatchObject({ side: 'right', from: -382, to: 12 });
  });
  it('puts the bubble below or above the pin on a phone-narrow stage, using the full width', () => {
    expect(pinBubbleLayout(150, 100, 300, 360)).toEqual({ side: 'below', maxWidth: 284, maxHeight: 228, from: -142, to: 142 });
    expect(pinBubbleLayout(150, 330, 300, 360)).toMatchObject({ side: 'above', maxHeight: 298 });
    expect(pinBubbleLayout(60, 180, 300, 360)).toMatchObject({ side: 'right', maxWidth: 208 });
  });
  it('stays beside the pin when neither below nor above has a useful amount of room', () => {
    expect(pinBubbleLayout(150, 90, 300, 180).side).toMatch(/right|left/);
  });
  it('keeps the side it had while the pin wobbles across a boundary', () => {
    expect(pinBubbleLayout(330, 205, 600, 410).side).toBe('right');
    expect(pinBubbleLayout(330, 205, 600, 410, 'left').side).toBe('left');
    expect(pinBubbleLayout(370, 205, 600, 410).side).toBe('left');
    expect(pinBubbleLayout(370, 205, 600, 410, 'right').side).toBe('right');
    // 140px beside is too narrow for a fresh bubble, but one already hanging there stays.
    expect(pinBubbleLayout(128, 120, 300, 360).side).toBe('below');
    expect(pinBubbleLayout(128, 120, 300, 360, 'right').side).toBe('right');
    expect(pinBubbleLayout(128, 120, 300, 360, 'below').side).toBe('below');
  });
  it('never reaches outside the stage, wherever a visible pin is', () => {
    for (const [width, height] of [[300, 360], [360, 360], [620, 410], [1024, 700], [400, 260]]) {
      for (let x = 22.4; x <= width - 22; x += 9) for (let y = 22.7; y <= height - 22; y += 9) {
        const layout = pinBubbleLayout(x, y, width, height);
        const box = reach(x, y, layout);
        expect(box.left).toBeGreaterThanOrEqual(8); expect(box.top).toBeGreaterThanOrEqual(8);
        expect(box.right).toBeLessThanOrEqual(width - 8); expect(box.bottom).toBeLessThanOrEqual(height - 8);
        // The pin center stays inside the bubble's span, so the tail always touches it.
        expect(layout.from).toBeLessThanOrEqual(0); expect(layout.to).toBeGreaterThanOrEqual(0);
        if (box.height !== undefined) expect(box.height).toBeLessThanOrEqual(layout.to - layout.from);
        if (box.width !== undefined) expect(box.width).toBeLessThanOrEqual(layout.to - layout.from);
      }
    }
  });
});
