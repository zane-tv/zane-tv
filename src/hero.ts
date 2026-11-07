import { profile } from "./content";
import { BIRD, chain, comb, contributionRing, feathers, flock, rings, sun } from "./drum";
import type { ProfileData } from "./github";
import { cycle, motion, spin } from "./motion";
import { n, svgDoc } from "./svg";
import type { Theme } from "./theme";
import { Glyphs, measure, type TextStyle } from "./type";

const W = 880;
const H = 400;
const CX = 686;
const CY = 200;
/** Seconds each title stays up; the roles frieze cycles on the same beat. */
export const TITLE_SLOT = 3;

export function heroAlt(data: ProfileData): string {
  return (
    `${profile.name} (${profile.location}): ${profile.titles.join(", ")}. ${profile.intro.join(" ")} ` +
    `The bronze drum's outer ring charts ${data.total.toLocaleString("en-US")} contributions over the last year, one tick per week.`
  );
}

export function hero(t: Theme, data: ProfileData): string {
  const g = new Glyphs();

  const intro: TextStyle = { font: "body", size: 17.5 };
  const title: TextStyle = { font: "title", size: 25, tracking: -0.01 };
  for (const line of profile.intro) {
    if (measure(intro, line) > 470) throw new Error(`intro line runs into the drum: "${line}"`);
  }
  for (const s of profile.titles) {
    if (30 + measure(title, s) > 470) throw new Error(`title runs into the drum: "${s}"`);
  }

  // Baselines chosen so the text block's optical centre sits on the drum's centre line.
  const lastIntroY = 266 + (profile.intro.length - 1) * 26;
  const metaY = lastIntroY + 46;
  const locStyle: TextStyle = { font: "bold", size: 14, tracking: 0.03 };
  const stackStyle: TextStyle = { font: "mono", size: 12.5 };
  const locW = 26 + measure(locStyle, profile.location) + 12;
  if (4 + locW + 14 + measure(stackStyle, profile.stack) > 470) throw new Error("location and stack line runs into the drum");
  const badge =
    `<rect x="4" y="${metaY - 19.5}" width="${n(locW)}" height="27" rx="7" fill="${t.bronze}" fill-opacity=".16" stroke="${t.bronze}" stroke-opacity=".75"/>` +
    `<g transform="translate(18 ${metaY - 6})" fill="${t.bronze}">${sun(5, 6.2, 2.4)}</g>` +
    g.text(locStyle, profile.location, 30, metaY, { fill: t.bronze });

  const text = [
    g.text({ font: "monoMedium", size: 12, tracking: 0.24 }, profile.greeting, 4, 74, { fill: t.muted }),
    g.text({ font: "display", size: 118, tracking: -0.05 }, profile.name, 0, 182, { fill: t.ink }),
    `<g transform="translate(13 219.5)" color="${t.bronze}" fill="currentColor"><g class="bullet">${sun(14, 8.5, 3.2)}</g></g>`,
    ...profile.titles.map(
      (s, i) => `<g class="ti" style="animation-delay:${i * TITLE_SLOT}s"${i ? ` opacity="0"` : ""}>${g.text(title, s, 30, 228, { fill: t.bronze })}</g>`,
    ),
    ...profile.intro.map((line, i) => g.text(intro, line, 4, 266 + i * 26, { fill: t.soft })),
    badge,
    g.text(stackStyle, profile.stack, 4 + locW + 14, metaY, { fill: t.muted }),
  ].join("");

  const ringText =
    `${data.total.toLocaleString("en-US")} contributions in the last year · one tick per week · ` +
    `trống đồng Đông Sơn · redrawn daily from the GitHub API ·`;
  const weekly = data.weeks.map((w) => w.reduce((sum, d) => sum + d.count, 0));

  const drum =
    `<g transform="translate(${CX} ${CY})" color="${t.bronze}" stroke="currentColor" fill="none" stroke-width="1">` +
    `<circle r="125.5" fill="currentColor" fill-opacity=".05" stroke="none"/>` +
    `<circle class="rip" r="126" stroke-width="1.2" opacity="0"/>` +
    `<circle class="rip rip2" r="126" stroke-width="1.2" opacity="0"/>` +
    `<g class="cw">` +
    `<g class="beat" fill="currentColor" stroke="none">${sun(14, 28, 9.5)}</g>` +
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
    contributionRing(weekly, 134, 34, t.patina) +
    `<circle cy="-176" r="2.6" fill="currentColor" stroke="none"/>` +
    `</g>` +
    g.ring({ font: "mono", size: 10 }, ringText.toUpperCase(), CX, CY, 182, 3, 354, { fill: t.muted });

  // Every 6s the drum is struck: the sun swells and two rings of sound spread out.
  // Each strike moves for under 2s, so the image sits still most of the time.
  const style = motion(
    spin("cw", 240),
    spin("ccw", -150),
    spin("bullet", 24),
    cycle("ti", profile.titles.length, TITLE_SLOT, {
      enter: "opacity:0;transform:translateY(14px)",
      lit: "opacity:1;transform:translateY(0)",
      exit: "opacity:0;transform:translateY(-14px)",
    }),
    `.beat{animation:beat 6s cubic-bezier(.2,.7,.2,1) infinite}` +
      `@keyframes beat{0%,20%,100%{transform:scale(1)}5%{transform:scale(1.16)}}`,
    `.rip{animation:rip 6s cubic-bezier(.1,.6,.3,1) infinite}.rip2{animation-delay:.3s}` +
      `@keyframes rip{0%{opacity:.6;transform:scale(1)}27%,100%{opacity:0;transform:scale(1.5)}}`,
    `.tk{animation:tk .7s ease-out backwards}@keyframes tk{from{opacity:0}}`,
  );

  return svgDoc({ width: W, height: H, title: heroAlt(data), style, defs: BIRD + g.defs(), body: text + drum });
}

