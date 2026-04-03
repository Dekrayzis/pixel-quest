/**
 * Utility for building CSS class names conditionally
 * Reduces duplication across components
 */
export function buildClassName(base: string, conditions: Record<string, boolean>): string {
  const classes = [base];
  
  for (const [className, condition] of Object.entries(conditions)) {
    if (condition) {
      classes.push(className);
    }
  }
  
  return classes.join(' ');
}

/**
 * Alternative syntax for dynamic class names with templates
 */
export function buildClassNames(base: string, ...conditionalClasses: (string | null | undefined | false)[]): string {
  const classes = [base, ...conditionalClasses].filter(Boolean);
  return classes.join(' ');
}

/**
 * ID generation utilities to reduce duplication
 */
export const createId = {
  enemy: (index: number) => `enemy-${index}`,
  coin: (index: number) => `coin-${index}`,
  projectile: (timestamp: number) => `proj-${timestamp}`,
  powerup: (timestamp: number, key: string) => `pu-${timestamp}-${key}`,
  popup: (timestamp: number, suffix: string) => `pop-${timestamp}-${suffix}`,
};

/**
 * Time-based utility functions to reduce duplication
 */
export const timeUtils = {
  isActive: (until: number, now: number) => until > now,
  isExpired: (until: number, now: number) => until <= now,
  timeRemaining: (until: number, now: number) => Math.max(0, until - now),
  isExpiringSoon: (until: number, now: number, threshold: number) => 
    until > now && (until - now) < threshold,
  cleanupByAge: <T extends { createdAt: number }>(items: T[], now: number, maxAge: number) =>
    items.filter(item => now - item.createdAt < maxAge),
  cleanupByTimestamp: (record: Record<string, number>, now: number, maxAge: number) => {
    for (const key in record) {
      if (now - record[key] > maxAge) delete record[key];
    }
  },
};

/**
 * Position styling utilities to reduce duplication
 */
export const positionStyle = (x: number, y: number, width?: number, height?: number) => ({
  left: x,
  top: y,
  ...(width !== undefined && { width }),
  ...(height !== undefined && { height }),
});

/**
 * Entity positioning style for game objects
 */
export const entityStyle = (entity: { x: number; y: number; width: number; height: number }) => 
  positionStyle(entity.x, entity.y, entity.width, entity.height);
