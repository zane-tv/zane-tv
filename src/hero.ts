import { profile } from "./content";
import { BIRD, chain, comb, contributionRing, feathers, flock, rings, sun } from "./drum";
import type { ProfileData } from "./github";
import { svgDoc } from "./svg";
import type { Theme } from "./theme";
import { Glyphs, measure, type TextStyle } from "./type";

const W = 880;
const H = 400;
const CX = 686;
const CY = 200;

export function heroAlt(data: ProfileData): string {
  return `${profile.name}. ${profile.tagline.join(" ")} The bronze drum's outer ring charts ${data.total.toLocaleString("en-US")} contributions over the last year, one tick per week.`;
}

export function hero(t: Theme, data: ProfileData): string {
  const g = new Glyphs();

  const tagline: TextStyle = { font: "body", size: 19 };
  const lines = profile.tagline;
  for (const line of lines) {
    if (measure(tagline, line) > 470) throw new Error(`tagline line runs into the drum: "${line}"`);
  }
  // Baselines chosen so the text block's optical centre sits on the drum's centre line.
  const lastLineY = 248 + (lines.length - 1) * 29;
  const text = [
    g.text({ font: "monoMedium", size: 12, tracking: 0.24 }, profile.greeting, 4, 88, { fill: t.muted }),
    g.text({ font: "display", size: 118, tracking: -0.05 }, profile.name, 0, 200, { fill: t.ink }),
    ...lines.map((line, i) => g.text(tagline, line, 4, 248 + i * 29, { fill: t.soft })),
    g.text({ font: "mono", size: 12.5 }, profile.meta, 4, lastLineY + 52, { fill: t.muted }),
  ].join("");

  const ringText =
    `${data.total.toLocaleString("en-US")} contributions in the last year · one tick per week · ` +
    `trống đồng Đông Sơn · redrawn daily from the GitHub API ·`;

  const drum =
    `<g transform="translate(${CX} ${CY})" color="${t.bronze}" stroke="currentColor" fill="none" stroke-width="1">` +
    `<circle r="125.5" fill="currentColor" fill-opacity=".05" stroke="none"/>` +
    `<g class="cw">` +
    `<g fill="currentColor" stroke="none">${sun(14, 28, 9.5)}</g>` +
    `<g stroke-width=".8">${feathers(14, 12, 26, 3)}</g>` +
    rings(34, 37.5) +
    `<g stroke-width=".9">${chain(16, 47, 5.4)}</g>` +
    rings(56.5, 59.5) +
    `<g stroke-width=".8">${comb(120, 61.5, 71.5)}</g>` +
    rings(73.5, 76.5) +
    `</g>` +
    `<g class="ccw">${flock(10, 88)}</g>` +
    rings(105, 108) +
    `<g stroke-width=".9">${chain(30, 115.5, 4)}</g>` +
    rings(122.5, 125.5) +
    contributionRing(data.weeks, 134, 34, t.patina) +
    `<circle cy="-176" r="2.6" fill="currentColor" stroke="none"/>` +
    `</g>` +
    g.ring({ font: "mono", size: 10 }, ringText.toUpperCase(), CX, CY, 182, 3, 354, { fill: t.muted });

  const style =
    `.cw{animation:cw 240s linear infinite}.ccw{animation:ccw 150s linear infinite}` +
    `@keyframes cw{to{transform:rotate(360deg)}}@keyframes ccw{to{transform:rotate(-360deg)}}` +
    `@media (prefers-reduced-motion:reduce){.cw,.ccw{animation:none}}`;

  return svgDoc({ width: W, height: H, title: heroAlt(data), style, defs: BIRD + g.defs(), body: text + drum });
}
