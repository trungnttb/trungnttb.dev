/**
 * Distance from a flat screen at which a perspective camera looking straight at it sees nothing
 * but the screen: the screen covers the viewport in both directions.
 */
export function coverDistance(
  screenWidth: number,
  screenHeight: number,
  verticalFovDeg: number,
  aspect: number,
): number {
  const tanHalf = Math.tan((verticalFovDeg * Math.PI) / 360);
  const byHeight = screenHeight / 2 / tanHalf;
  const byWidth = screenWidth / 2 / (tanHalf * aspect);
  // The nearer of the two distances overfills the other axis; a small margin hides the bezel edge.
  return Math.min(byHeight, byWidth) * 0.97;
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
