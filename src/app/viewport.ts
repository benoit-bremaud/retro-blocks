/** How the logical screen maps onto the window (ADR-0014). */
export interface Viewport {
  /** Integer factor, in device pixels per logical pixel. */
  readonly scale: number;
  readonly deviceWidth: number;
  readonly deviceHeight: number;
  /** CSS size of the visible canvas: the device size divided by the pixel ratio. */
  readonly cssWidth: number;
  readonly cssHeight: number;
}

/**
 * The largest integer scale at which the logical screen fits the window, computed in device
 * pixels and at least 1: pixels stay square (nearest neighbour), and a window too small for the
 * screen scrolls instead of blurring it.
 */
export function computeViewport(
  logicalWidth: number,
  logicalHeight: number,
  cssWidth: number,
  cssHeight: number,
  pixelRatio: number,
): Viewport {
  const fit = Math.min(
    (cssWidth * pixelRatio) / logicalWidth,
    (cssHeight * pixelRatio) / logicalHeight,
  );
  const scale = Math.max(1, Math.floor(fit));
  const deviceWidth = logicalWidth * scale;
  const deviceHeight = logicalHeight * scale;
  return {
    scale,
    deviceWidth,
    deviceHeight,
    cssWidth: deviceWidth / pixelRatio,
    cssHeight: deviceHeight / pixelRatio,
  };
}
