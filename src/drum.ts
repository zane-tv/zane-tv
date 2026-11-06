import { n, polar } from "./svg";

/**
 * Ornament vocabulary of a Đông Sơn bronze drum face (Ngọc Lũ type): a
 * fourteen-ray sun, hatched "feathers" between the rays, chains of dotted
 * circles joined by tangents, comb bands, and Lạc birds flying
 * counter-clockwise. Every function draws around the origin; callers translate.
 */

type Pt = [number, number];
const pt = (p: Pt): string => `${n(p[0])} ${n(p[1])}`;

export function sun(rays: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < rays * 2; i++) points.push(pt(polar(0, 0, i % 2 ? inner : outer, (i * 180) / rays)));
  return `<polygon points="${points.join(" ")}"/>`;
}

/**
 * Hatched wedges between the sun's rays ("feathers"): a V opening outwards,
 * cross-hatched parallel to its open base. Wedges stay narrower than the gap so
 * they never touch the rays.
 */
export function feathers(rays: number, inner: number, outer: number, hatches: number): string {
  const half = (180 / rays) * 0.6;
  let d = "";
  for (let i = 0; i < rays; i++) {
    const mid = ((i + 0.5) * 360) / rays;
    const apex = polar(0, 0, inner, mid);
    const left = polar(0, 0, outer, mid - half);
    const right = polar(0, 0, outer, mid + half);
    d += `M${pt(left)}L${pt(apex)}L${pt(right)}`;
    for (let h = 1; h <= hatches; h++) {
      const f = h / (hatches + 1);
      const a: Pt = [apex[0] + (left[0] - apex[0]) * f, apex[1] + (left[1] - apex[1]) * f];
      const b: Pt = [apex[0] + (right[0] - apex[0]) * f, apex[1] + (right[1] - apex[1]) * f];
      d += `M${pt(a)}L${pt(b)}`;
    }
  }
  return `<path d="${d}"/>`;
}

export function rings(...radii: number[]): string {
  return radii.map((r) => `<circle r="${n(r)}"/>`).join("");
}

/** Radial comb teeth between two radii. */
export function comb(count: number, r0: number, r1: number, fromDeg = 0, sweepDeg = 360): string {
  let d = "";
  const closed = sweepDeg >= 360;
  const steps = closed ? count : count - 1;
  for (let i = 0; i < count; i++) {
    const a = fromDeg + (i * sweepDeg) / steps;
    d += `M${pt(polar(0, 0, r0, a))}L${pt(polar(0, 0, r1, a))}`;
  }
  return `<path d="${d}"/>`;
}

/** Dotted circles on a ring, each joined to the next by an internal tangent. */
export function chain(count: number, radius: number, r: number, fromDeg = 0, sweepDeg = 360): string {
  const closed = sweepDeg >= 360;
  const steps = closed ? count : count - 1;
  const centers: Pt[] = [];
  for (let i = 0; i < count; i++) centers.push(polar(0, 0, radius, fromDeg + (i * sweepDeg) / steps));

  let circles = "";
  let dots = "";
  for (const c of centers) {
    circles += `<circle cx="${n(c[0])}" cy="${n(c[1])}" r="${n(r)}"/><circle cx="${n(c[0])}" cy="${n(c[1])}" r="${n(r * 0.48)}"/>`;
    dots += `<circle cx="${n(c[0])}" cy="${n(c[1])}" r="${n(r * 0.16)}"/>`;
  }

  let d = "";
  const links = closed ? count : count - 1;
  for (let i = 0; i < links; i++) {
    const a = centers[i]!;
    const b = centers[(i + 1) % count]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dist = Math.hypot(dx, dy);
    if (dist <= 2 * r) continue;
    const [ux, uy] = [dx / dist, dy / dist];
    const [vx, vy] = [-uy, ux];
    const cos = (2 * r) / dist;
    const sin = Math.sqrt(1 - cos * cos);
    const ox = r * (cos * ux + sin * vx);
    const oy = r * (cos * uy + sin * vy);
    d += `M${pt([a[0] + ox, a[1] + oy])}L${pt([b[0] - ox, b[1] - oy])}`;
  }
  return `${circles}<path d="${d}"/><g stroke="none" fill="currentColor">${dots}</g>`;
}

/**
 * One Lạc bird in local coordinates: flying towards -x, back towards -y.
 * Long beak, crest, slim body, raised hatched wing, fanned tail.
 */
export const BIRD =
  `<g id="bird">` +
  `<path fill="currentColor" stroke="none" d="M-7 0C-1.5-3.6 6.5-3.8 14-.6 6.5 2.4-1.5 2.6-7 0Z"/>` +
  `<circle fill="currentColor" stroke="none" cx="-8.2" cy="-.7" r="2.5"/>` +
  `<path stroke-linecap="round" d="M-10.4-1.1Q-17.5-.6-25 1.6"/>` +
  `<path stroke-linecap="round" stroke-width=".8" d="M-7.6-3.1-3.6-8.6M-6.3-2.8-.8-7.2"/>` +
  `<path fill="currentColor" fill-opacity=".18" stroke-linejoin="round" d="M-1.5-2.2 13.5-13.5 10.4-2.4Z"/>` +
  `<path stroke-width=".7" d="M1.6-3 9.6-9.6M4.8-2.8 11.2-8.2M8-2.6 12-6"/>` +
  `<path stroke-linecap="round" stroke-width=".9" d="M13.4-.7 22.5-5.6M14.2-.1 23.6-1.2M13.6.6 21.6 3.8"/>` +
  `</g>`;

export function flock(count: number, radius: number, fromDeg = 0, sweepDeg = 360): string {
  const closed = sweepDeg >= 360;
  const steps = closed ? count : count - 1;
  let out = "";
  for (let i = 0; i < count; i++) {
    out += `<use href="#bird" transform="rotate(${n(fromDeg + (i * sweepDeg) / steps)}) translate(0 ${n(-radius)})"/>`;
  }
  return out;
}

/**
 * Weekly contributions as radial ticks, oldest week just after 12 o'clock,
 * newest just before it. Length follows sqrt so one busy week does not flatten
 * the rest; empty weeks show as faint dots.
 */
export function contributionRing(weeks: readonly number[], r0: number, maxLen: number, color: string): string {
  const max = Math.max(1, ...weeks);
  let ticks = "";
  let empty = "";
  weeks.forEach((count, i) => {
    const a = ((i + 0.5) * 360) / weeks.length;
    const base = polar(0, 0, r0, a);
    if (count === 0) {
      empty += `<circle cx="${n(base[0])}" cy="${n(base[1])}" r="1.5"/>`;
      return;
    }
    const len = 2 + maxLen * Math.sqrt(count / max);
    ticks += `M${pt(base)}L${pt(polar(0, 0, r0 + len, a))}`;
  });
  return (
    `<path d="${ticks}" fill="none" stroke="${color}" stroke-width="4.4" stroke-linecap="round"/>` +
    `<g fill="${color}" opacity=".45">${empty}</g>`
  );
}
