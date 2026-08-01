/**
 * mShots serves a flat grey placeholder while it generates a screenshot.
 * That decodes like any other image, so extraction happily returns five
 * near-identical greys — which would then be saved as the item's palette
 * forever. Detect that shape and skip it.
 *
 * Deliberately narrow: only near-zero saturation AND a narrow luminance
 * spread counts. A real black-and-white photograph has a wide spread, and a
 * minimal near-white site has at least one dark accent, so both pass through.
 */
export function isPlaceholderPalette(hexes: string[]): boolean {
  if (hexes.length < 2) return true;

  const rgb = hexes.map((h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  });

  const saturation = ([r, g, b]: readonly [number, number, number]) =>
    Math.max(r, g, b) - Math.min(r, g, b);
  const luminance = ([r, g, b]: readonly [number, number, number]) =>
    0.299 * r + 0.587 * g + 0.114 * b;

  const maxSaturation = Math.max(...rgb.map(saturation));
  const lums = rgb.map(luminance);
  const spread = Math.max(...lums) - Math.min(...lums);

  return maxSaturation <= 12 && spread <= 40;
}
