/**
 * Axis-Aligned Bounding Box helpers.
 * All entities are treated as { x, y, width, height } rectangles.
 */

interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Check if two AABBs overlap */
export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Return the overlap vector (penetration) of a into b, or null if no overlap */
export function aabbPenetration(a: AABB, b: AABB): { x: number; y: number } | null {
  const overlapX =
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY =
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

  if (overlapX <= 0 || overlapY <= 0) return null;

  return { x: overlapX, y: overlapY };
}

/**
 * Determine collision side.
 * Returns 'top', 'bottom', 'left', or 'right' — the side of `b` that `a` hit.
 */
export function collisionSide(a: AABB, b: AABB, pen: { x: number; y: number }): 'top' | 'bottom' | 'left' | 'right' {
  if (pen.y < pen.x) {
    // Vertical collision
    const aCenterY = a.y + a.height / 2;
    const bCenterY = b.y + b.height / 2;
    return aCenterY < bCenterY ? 'top' : 'bottom';
  } else {
    // Horizontal collision
    const aCenterX = a.x + a.width / 2;
    const bCenterX = b.x + b.width / 2;
    return aCenterX < bCenterX ? 'left' : 'right';
  }
}
