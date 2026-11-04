/*
 * Pure geometry for the spotlight guide. No React Native imports, so it can be tested on its own.
 * All rectangles are in the same coordinate space (the guide overlay) unless stated otherwise.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Area {
  top: number;
  bottom: number;
}

export interface CardPlacement {
  top: number;
  left: number;
  side: "above" | "below" | "center";
  /** Horizontal position of the little arrow inside the card, or null when there is no arrow. */
  arrowX: number | null;
}

/** The smallest rectangle that contains every given rectangle. */
export function unionRects(rects: readonly Rect[]): Rect | null {
  if (rects.length === 0) {
    return null;
  }

  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.w));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.h));

  return { x: left, y: top, w: right - left, h: bottom - top };
}

/** Grow a rectangle by `pad` on every side, but never past the edges of the overlay. */
export function padRect(
  rect: Rect,
  pad: number,
  bounds: { w: number; h: number },
): Rect {
  const left = Math.max(0, rect.x - pad);
  const top = Math.max(0, rect.y - pad);
  const right = Math.min(bounds.w, rect.x + rect.w + pad);
  const bottom = Math.min(bounds.h, rect.y + rect.h + pad);

  return {
    x: left,
    y: top,
    w: Math.max(0, right - left),
    h: Math.max(0, bottom - top),
  };
}

/** Space the explanation card needs next to the target (card height plus margins). */
export const CARD_ROOM = 190;

/**
 * Should the screen scroll before pointing at this target?
 * Yes when it is not fully visible, or when there is no room for the card above or below it.
 */
export function needsScroll(
  rect: Rect,
  area: Area,
  room: number = CARD_ROOM,
): boolean {
  const visible = rect.y >= area.top && rect.y + rect.h <= area.bottom;
  const below = area.bottom - (rect.y + rect.h);
  const above = rect.y - area.top;

  return !visible || (below < room && above < room);
}

/**
 * How far to scroll (positive = further down the content) so the target sits near the top of the
 * visible area with the card below it. A very tall target just gets aligned to the top.
 */
export function scrollDelta(rect: Rect, area: Area): number {
  const tall = rect.h > (area.bottom - area.top) * 0.6;
  const desiredTop = area.top + (tall ? 8 : 24);

  return rect.y - desiredTop;
}

/**
 * Where the explanation card goes. Below the target when it fits, otherwise above it, otherwise on
 * the side with more room (overlapping the target a little, without an arrow). Without a target it is
 * centered in the free area.
 */
export function placeCard(
  spot: Rect | null,
  card: { w: number; h: number },
  area: Area,
  bounds: { w: number },
  gap: number = 14,
  margin: number = 16,
): CardPlacement {
  const clampLeft = (centerX: number) =>
    Math.min(
      Math.max(centerX - card.w / 2, margin),
      bounds.w - margin - card.w,
    );

  if (!spot) {
    const free = area.bottom - area.top;

    return {
      top: area.top + Math.max((free - card.h) / 2, 0),
      left: clampLeft(bounds.w / 2),
      side: "center",
      arrowX: null,
    };
  }

  const below = area.bottom - (spot.y + spot.h);
  const above = spot.y - area.top;
  const centerX = spot.x + spot.w / 2;
  const left = clampLeft(centerX);
  const arrowX = Math.min(Math.max(centerX - left - 7, 22), card.w - 36);

  if (below >= card.h + gap) {
    return { top: spot.y + spot.h + gap, left, side: "below", arrowX };
  }

  if (above >= card.h + gap) {
    return { top: spot.y - gap - card.h, left, side: "above", arrowX };
  }

  /* No clean spot: use the roomier side and drop the arrow because the card overlaps the target. */
  if (below >= above) {
    const top = Math.min(
      Math.max(spot.y + spot.h + gap, area.top),
      area.bottom - card.h,
    );

    return { top: Math.max(top, area.top), left, side: "below", arrowX: null };
  }

  return {
    top: Math.max(spot.y - gap - card.h, area.top),
    left,
    side: "above",
    arrowX: null,
  };
}

/** SVG path of a rounded rectangle. It runs inside an animated-props worklet. */
export function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string {
  "worklet";

  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  const right = x + w;
  const bottom = y + h;

  return (
    `M${x + radius} ${y}H${right - radius}A${radius} ${radius} 0 0 1 ${right} ${y + radius}` +
    `V${bottom - radius}A${radius} ${radius} 0 0 1 ${right - radius} ${bottom}` +
    `H${x + radius}A${radius} ${radius} 0 0 1 ${x} ${bottom - radius}` +
    `V${y + radius}A${radius} ${radius} 0 0 1 ${x + radius} ${y}Z`
  );
}

/** Anything with React Native's measureInWindow, so tests can pass a fake. */
export interface Measurable {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

/** Position of a native view in the window, or null when it cannot be measured (not mounted, zero size). */
export function measureNode(
  node: Measurable | null | undefined,
  timeoutMs: number = 500,
): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!node) {
      resolve(null);

      return;
    }

    const timer = setTimeout(() => resolve(null), timeoutMs);

    try {
      node.measureInWindow((x, y, w, h) => {
        clearTimeout(timer);
        resolve(
          Number.isFinite(x) && Number.isFinite(y) && w > 0 && h > 0
            ? { x, y, w, h }
            : null,
        );
      });
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}
