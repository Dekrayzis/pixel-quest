// Simple AABB overlap test
export function aabbOverlap(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Minimum translation vector to resolve overlap
export function aabbPenetration(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): { x: number; y: number } | null {
  const overlapX = Math.min(a.x + a.width - b.x, b.x + b.width - a.x);
  const overlapY = Math.min(a.y + a.height - b.y, b.y + b.height - a.y);
  
  if (overlapX <= 0 || overlapY <= 0) return null;
  
  // Return the smaller overlap as the penetration vector
  if (overlapX < overlapY) {
    return { x: overlapX * (a.x < b.x ? -1 : 1), y: 0 };
  } else {
    return { x: 0, y: overlapY * (a.y < b.y ? -1 : 1) };
  }
}

// Determine which side of tile the player hit
export function collisionSide(player: { x: number; y: number; width: number; height: number }, tile: { x: number; y: number; width: number; height: number }, _penetration: { x: number; y: number }): 'top' | 'bottom' | 'left' | 'right' {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const tileCenterX = tile.x + tile.width / 2;
  const tileCenterY = tile.y + tile.height / 2;
  
  const dx = playerCenterX - tileCenterX;
  const dy = playerCenterY - tileCenterY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'bottom' : 'top';
  }
}
