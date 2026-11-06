import octicons from "@primer/octicons";
import { profile, type Project } from "./content";
import { BIRD, chain, comb, feathers, flock, rings, sun } from "./drum";
import type { RepoStats } from "./github";
import { n, svgDoc } from "./svg";
import type { Theme } from "./theme";
import { Glyphs, measure, wrap, type TextStyle } from "./type";

const W = 430;
const H = 232;
const PAD = 26;

/** Octicon outline at `size` px with its top-left corner at (x, y). */
function icon(name: "star-fill" | "repo-forked", x: number, y: number, size: number, fill: string): string {
  return `<g fill="${fill}" transform="translate(${n(x)} ${n(y)}) scale(${n(size / 16, 4)})">${octicons[name].heights[16]!.path}</g>`;
}

export function cardAlt(p: Project, s: RepoStats): string {
  return `${p.title}: ${p.story} ${s.stars} stars, ${s.forks} forks.`;
}

export function card(t: Theme, p: Project, s: RepoStats): string {
  const g = new Glyphs();
  const story: TextStyle = { font: "body", size: 14.5 };
  const lines = wrap(story, p.story, W - PAD * 2 - 20);
  if (lines.length > 3) throw new Error(`story for ${p.repo} wraps to ${lines.length} lines; keep it to 3`);

  const num: TextStyle = { font: "monoMedium", size: 12.5 };
  const stack: TextStyle = { font: "mono", size: 12 };
  const footY = H - 28;
  const starX = PAD;
  const forkX = starX + 19 + measure(num, String(s.stars)) + 22;
  const stackX = W - PAD;
  if (forkX + 19 + measure(num, String(s.forks)) + 24 > stackX - measure(stack, p.stack)) {
    throw new Error(`footer of ${p.repo} overflows`);
  }

  const text = [
    g.text({ font: "mono", size: 11, tracking: 0.03 }, `${profile.login}/${p.repo}`, PAD, 44, { fill: t.muted }),
    g.text({ font: "title", size: 23, tracking: -0.015 }, p.title, PAD, 80, { fill: t.ink }),
    ...lines.map((line, i) => g.text(story, line, PAD, 112 + i * 21.5, { fill: t.soft })),
    icon("star-fill", starX, footY - 11.5, 14, t.bronze),
    g.text(num, String(s.stars), starX + 19, footY, { fill: t.ink }),
    icon("repo-forked", forkX, footY - 11.5, 14, t.muted),
    g.text(num, String(s.forks), forkX + 19, footY, { fill: t.ink }),
    g.text(stack, p.stack, stackX, footY, { fill: t.muted, anchor: "end" }),
  ].join("");

  // A quarter of the hero drum, seen through the card's top-right corner.
  const ornament =
    `<g clip-path="url(#frame)"><g transform="translate(${W} 0)" color="${t.bronze}" stroke="currentColor" fill="none" stroke-width=".9" opacity=".55">` +
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
    `</g></g>`;

  const frame =
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${t.line}" stroke-opacity=".16"/>`;

  return svgDoc({
    width: W,
    height: H,
    title: cardAlt(p, s),
    defs: `<clipPath id="frame"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14"/></clipPath>${BIRD}${g.defs()}`,
    body: frame + ornament + text,
  });
}
