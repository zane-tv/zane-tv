/** Compact number for SVG attributes: fixed precision, trailing zeros trimmed. */
export const n = (v: number, digits = 2): string => {
  const s = v.toFixed(digits);
  return s.includes(".") ? s.replace(/\.?0+$/, "") || "0" : s;
};

export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Point on a circle. Angle in degrees: 0 is 12 o'clock, positive is clockwise. */
export const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

export function svgDoc(o: {
  width: number;
  height: number;
  title: string;
  style?: string;
  defs?: string;
  body: string;
}): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" ` +
    `viewBox="0 0 ${o.width} ${o.height}" role="img" aria-label="${esc(o.title)}">` +
    `<title>${esc(o.title)}</title>` +
    (o.style ? `<style>${o.style}</style>` : "") +
    (o.defs ? `<defs>${o.defs}</defs>` : "") +
    o.body +
    `</svg>\n`
  );
}
