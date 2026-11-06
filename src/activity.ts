import { BIRD } from "./drum";
import type { Day, ProfileData } from "./github";
import { motion, ROLL } from "./motion";
import { n, svgDoc } from "./svg";
import type { Theme } from "./theme";
import { Glyphs, measure, type TextStyle } from "./type";

const W = 880;
const H = 232;
const PAD = 28;
const TOP = 112; // centre of the Sunday row
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Current and longest runs of days with a contribution. An empty today does not break the current run. */
export function streaks(days: readonly Day[]): { current: number; longest: number } {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let i = days.length - 1;
  if (days[i]?.count === 0) i--;
  let current = 0;
  while (i >= 0 && days[i]!.count > 0) {
    current++;
    i--;
  }
  return { current, longest };
}

function headline(data: ProfileData): [number, string][] {
  const { current, longest } = streaks(data.weeks.flat());
  return [
    [data.total, "contributions in the last year"],
    [current, `${current === 1 ? "day" : "days"} in the current streak`],
    [longest, `${longest === 1 ? "day" : "days"} in the longest streak`],
  ];
}

export function activityAlt(data: ProfileData): string {
  return `Contribution calendar: ${headline(data)
    .map(([v, l]) => `${v.toLocaleString("en-US")} ${l}`)
    .join(", ")}.`;
}

/**
 * The contribution calendar drawn with the drum's dotted circles: busier days
 * get fuller rings. Weeks fade in left to right on load and a Lạc bird keeps
 * flying across the year.
 */
export function activityArt(t: Theme, data: ProfileData): string {
  const g = new Glyphs();
  const pitch = (W - PAD * 2) / data.weeks.length;

  const num: TextStyle = { font: "bold", size: 26, tracking: -0.02 };
  const label: TextStyle = { font: "mono", size: 11 };
  let x = PAD;
  const header = headline(data).map(([value, text], i) => {
    const rolled = g.roll(num, value.toLocaleString("en-US"), x, 50, { fill: t.ink, delay: 0.3 + i * 0.15 });
    const out = rolled.svg + g.text(label, text, x + rolled.width + 9, 50, { fill: t.muted });
    x += rolled.width + 9 + measure(label, text) + 34;
    return out;
  });
  if (x - 34 > W - PAD) throw new Error("activity headline is wider than the band");

  const months: string[] = [];
  let lastLabel = -3;
  data.weeks.forEach((week, c) => {
    const month = Number(week[0]!.date.slice(5, 7)) - 1;
    const previous = c > 0 ? Number(data.weeks[c - 1]![0]!.date.slice(5, 7)) - 1 : -1;
    if (month === previous || c - lastLabel < 3) return;
    months.push(g.text({ font: "mono", size: 10 }, MONTHS[month]!, PAD + c * pitch + 2, 94, { fill: t.muted }));
    lastLabel = c;
  });

  const columns = data.weeks.map((week, c) => {
    const cx = PAD + (c + 0.5) * pitch;
    const days = week.map((d) => `<use href="#c${d.level}" x="${n(cx)}" y="${n(TOP + d.weekday * pitch)}"/>`).join("");
    return `<g class="wk" style="animation-delay:${n(0.2 + c * 0.018)}s">${days}</g>`;
  });

  const cells =
    `<g id="c0"><circle r="1.4" fill="${t.line}" opacity=".28"/></g>` +
    `<g id="c1"><circle r="2.6" fill="${t.patina}" opacity=".7"/></g>` +
    `<g id="c2" fill="${t.patina}"><circle r="3.5" fill="none" stroke="${t.patina}" stroke-width="1.2"/><circle r="1.25"/></g>` +
    `<g id="c3" fill="${t.patina}"><circle r="4.5" fill="none" stroke="${t.patina}" stroke-width="1.4"/><circle r="1.9"/></g>` +
    `<g id="c4"><circle r="5.4" fill="${t.patina}"/></g>`;

  // At rest (reduced motion) the bird perches above the newest week. Otherwise
  // it crosses the year in 9.6s, then stays out of frame for the rest of the
  // 24s loop, so the image is only repainted while it is flying.
  const restX = W - PAD - 30;
  const bird =
    `<g class="glide" style="transform:translateX(${restX}px)">` +
    `<use href="#bird" y="72" color="${t.bronze}" stroke="currentColor" fill="none"/></g>`;

  const frame = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${t.line}" stroke-opacity=".16"/>`;
  const style = motion(
    ROLL,
    `.wk{animation:wk .5s ease-out backwards}@keyframes wk{from{opacity:0;transform:translateY(5px)}}`,
    `.glide{animation:glide 24s steps(230) infinite}` +
      `@keyframes glide{0%{transform:translateX(${W + 30}px)}40%,100%{transform:translateX(-30px)}}`,
  );

  return svgDoc({
    width: W,
    height: H,
    title: activityAlt(data),
    style,
    defs: BIRD + cells + g.defs(),
    body: frame + header.join("") + months.join("") + columns.join("") + bird,
  });
}
