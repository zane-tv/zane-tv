import octicons from "@primer/octicons";
import { profile, type Project } from "./content";
import { BIRD, chain, comb, feathers, flock, rings, sun } from "./drum";
import type { RepoStats } from "./github";
import { motion, ROLL } from "./motion";
import { n, svgDoc } from "./svg";
import type { Theme } from "./theme";
import { Glyphs, measure, wrap, type TextStyle } from "./type";

/** Half-width widget size: two sit side by side in the README. */
export const CARD = { W: 430, H: 232, PAD: 26 } as const;

/** Octicon at `size` px with its top-left corner at (x, y); prefers the 24px drawing. */
export function icon(name: string, x: number, y: number, size: number, fill: string): string {
  const o = octicons[name as keyof typeof octicons];
  if (!o) throw new Error(`unknown octicon "${name}"`);
  const h = o.heights[24] ? 24 : 16;
  return `<g fill="${fill}" stroke="none" transform="translate(${n(x)} ${n(y)}) scale(${n(size / h, 4)})">${o.heights[h]!.path}</g>`;
}

/**
 * Shell shared by half-width widgets: a hairline frame and, unless disabled, a
 * quarter of the hero drum that turns into place in the top-right corner.
 */
export function cardDoc(t: Theme, o: { title: string; body: string; defs?: string; style?: string; ornament?: boolean }): string {
  const { W, H } = CARD;
  const ornament =
    o.ornament === false
      ? ""
      : `<g clip-path="url(#frame)"><g transform="translate(${W} 0)" color="${t.bronze}" stroke="currentColor" fill="none" stroke-width=".9" opacity=".55"><g class="settle">` +
        `<g fill="currentColor" stroke="none">${sun(14, 19, 6.5)}</g>` +
        `<g stroke-width=".7">${feathers(14, 8, 18, 2)}</g>` +
        rings(23, 25.5) +
        `<g stroke-width=".8">${chain(5, 32.5, 3.8, 180, 90)}</g>` +
        rings(40, 42) +
        `<g stroke-width=".7">${comb(26, 43.5, 50.5, 180, 90)}</g>` +
        rings(52, 54) +
        `<g transform="scale(.66)">${flock(3, 94, 196, 58)}</g>` +
        rings(75, 77) +
        `<g stroke-width=".8">${chain(9, 82.5, 3, 180, 90)}</g>` +
        rings(88, 90) +
        `<g stroke-width=".7">${comb(34, 91.5, 98.5, 180, 90)}</g>` +
        rings(100) +
        `</g></g></g>`;
  const frame = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${t.line}" stroke-opacity=".16"/>`;
  const settle = `.settle{animation:settle 2.6s cubic-bezier(.16,1,.3,1) backwards}@keyframes settle{from{transform:rotate(-50deg);opacity:0}}`;

  return svgDoc({
    width: W,
    height: H,
    title: o.title,
    style: motion(settle, ROLL) + (o.style ?? ""),
    defs: `<clipPath id="frame"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14"/></clipPath>${BIRD}${o.defs ?? ""}`,
    body: frame + ornament + o.body,
  });
}

export function cardAlt(p: Project, s: RepoStats): string {
  return `${p.title}: ${p.story} ${s.stars} stars, ${s.forks} forks.`;
}

export function card(t: Theme, p: Project, s: RepoStats): string {
  const { W, H, PAD } = CARD;
  const g = new Glyphs();
  const story: TextStyle = { font: "body", size: 14.5 };
  const lines = wrap(story, p.story, W - PAD * 2 - 20);
  if (lines.length > 3) throw new Error(`story for ${p.repo} wraps to ${lines.length} lines; keep it to 3`);

  const num: TextStyle = { font: "monoMedium", size: 12.5 };
  const stack: TextStyle = { font: "mono", size: 12 };
  const footY = H - 28;
  const stars = g.roll(num, String(s.stars), PAD + 19, footY, { fill: t.ink, delay: 0.3 });
  const forkX = PAD + 19 + stars.width + 22;
  const forks = g.roll(num, String(s.forks), forkX + 19, footY, { fill: t.ink, delay: 0.45 });
  if (forkX + 19 + forks.width + 24 > W - PAD - measure(stack, p.stack)) throw new Error(`footer of ${p.repo} overflows`);

  const body = [
    g.text({ font: "mono", size: 11, tracking: 0.03 }, `${profile.login}/${p.repo}`, PAD, 44, { fill: t.muted }),
    g.text({ font: "title", size: 23, tracking: -0.015 }, p.title, PAD, 80, { fill: t.ink }),
    ...lines.map((line, i) => g.text(story, line, PAD, 112 + i * 21.5, { fill: t.soft })),
    icon("star-fill", PAD, footY - 11.5, 14, t.bronze),
    stars.svg,
    icon("repo-forked", forkX, footY - 11.5, 14, t.muted),
    forks.svg,
    g.text(stack, p.stack, W - PAD, footY, { fill: t.muted, anchor: "end" }),
  ].join("");

  return cardDoc(t, { title: cardAlt(p, s), body, defs: g.defs() });
}
