import { CARD, cardDoc, icon } from "./card";
import { languages as config } from "./content";
import { comb, rings, sun } from "./drum";
import type { ProfileData } from "./github";
import { motion, spin } from "./motion";
import { n, polar } from "./svg";
import type { Theme } from "./theme";
import { Glyphs, measure, type TextStyle } from "./type";

/** `yearly` metrics cover the contribution calendar (the last 12 months); the rest are totals. */
type Metric = { value: number; label: string; icon: string; yearly?: boolean };

function metrics(data: ProfileData): Metric[] {
  return [
    { value: data.stars, label: "stars", icon: "star-fill" },
    { value: data.forks, label: "forks", icon: "repo-forked" },
    { value: data.followers, label: "followers", icon: "people" },
    { value: data.commits, label: "commits", icon: "git-commit", yearly: true },
    { value: data.pullRequests, label: "PRs", icon: "git-pull-request", yearly: true },
    { value: data.newRepos, label: "new repos", icon: "repo", yearly: true },
  ];
}

export function statsAlt(data: ProfileData): string {
  return `GitHub by the numbers: ${metrics(data)
    .map((m) => `${m.value.toLocaleString("en-US")} ${m.label}${m.yearly ? " in the last year" : ""}`)
    .join(", ")}.`;
}

/** Six numbers in a 3 x 2 grid; every digit rolls into place on load. */
export function statsArt(t: Theme, data: ProfileData): string {
  const { W, PAD } = CARD;
  const g = new Glyphs();
  const num: TextStyle = { font: "bold", size: 30, tracking: -0.02 };
  const label: TextStyle = { font: "mono", size: 11 };
  const col = (W - PAD * 2) / 3;

  const cells = metrics(data).map((m, i) => {
    const x = PAD + (i % 3) * col;
    const y = i < 3 ? 106 : 178;
    const text = m.yearly ? `${m.label} · 1y` : m.label;
    if (17 + measure(label, text) > col - 4) throw new Error(`stat label "${text}" is wider than its column`);
    const value = g.roll(num, m.value.toLocaleString("en-US"), x, y, { fill: t.ink, delay: 0.25 + i * 0.12 });
    return value.svg + icon(m.icon, x, y + 9.5, 12, t.bronze) + g.text(label, text, x + 17, y + 20, { fill: t.muted });
  });

  const body = g.text({ font: "mono", size: 11, tracking: 0.12 }, "GITHUB, BY THE NUMBERS", PAD, 44, { fill: t.muted }) + cells.join("");
  return cardDoc(t, { title: statsAlt(data), body, defs: g.defs() });
}

/** Byte shares after `config.ignore`, top languages first, the rest as "Other". */
function shares(data: ProfileData): { name: string; share: number }[] {
  const kept = data.languages.filter((l) => !(config.ignore as readonly string[]).includes(l.name));
  const total = kept.reduce((sum, l) => sum + l.bytes, 0);
  if (!total) throw new Error("no language bytes left after the ignore list");
  const top = kept.slice(0, config.top).map((l) => ({ name: l.name, share: l.bytes / total }));
  const rest = 1 - top.reduce((sum, l) => sum + l.share, 0);
  return rest >= 0.005 ? [...top, { name: "Other", share: rest }] : top;
}

export function languagesAlt(data: ProfileData): string {
  return `Languages across public repositories: ${shares(data)
    .map((s) => `${s.name} ${Math.round(s.share * 100)}%`)
    .join(", ")}.`;
}

/**
 * Language shares as one band of a drum: arcs draw themselves in, largest
 * first, around a small sun, with a turning comb ring outside.
 */
export function languagesArt(t: Theme, data: ProfileData): string {
  const { W, PAD } = CARD;
  const g = new Glyphs();
  const list = shares(data);
  const ramp = [1, 0.74, 0.54, 0.38, 0.26, 0.16];
  const r = 57;
  const gap = 2.2;

  let at = 0;
  const arcs = list.map((s, i) => {
    const sweep = s.share * 360;
    const a0 = at + gap / 2;
    const a1 = at + sweep - gap / 2;
    at += sweep;
    if (a1 <= a0) return "";
    const [x0, y0] = polar(0, 0, r, a0);
    const [x1, y1] = polar(0, 0, r, a1);
    return (
      `<path class="arc" style="animation-delay:${n(0.2 + i * 0.18)}s" pathLength="1" stroke-opacity="${ramp[i]}" ` +
      `d="M${n(x0)} ${n(y0)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${n(x1)} ${n(y1)}"/>`
    );
  });

  const ring =
    `<g transform="translate(112 140)">` +
    `<g color="${t.bronze}" stroke="currentColor" fill="none">` +
    `<g class="cw" stroke-width=".8">${comb(72, 70.5, 77)}</g>` +
    rings(67.5, 79.5, 44, 41) +
    `<g fill="currentColor" stroke="none">${sun(14, 17, 6)}</g>` +
    `</g>` +
    `<g fill="none" stroke="${t.patina}" stroke-width="14" stroke-dasharray="1 1">${arcs.join("")}</g>` +
    `</g>`;

  const name: TextStyle = { font: "body", size: 14 };
  const pct: TextStyle = { font: "monoMedium", size: 12.5 };
  const legend = list.map((s, i) => {
    const y = 90 + i * 24;
    if (232 + measure(name, s.name) > W - PAD - 48) throw new Error(`language "${s.name}" is too long for the legend`);
    const value = s.share < 0.01 ? "<1%" : `${Math.round(s.share * 100)}%`;
    return (
      `<rect x="214" y="${y - 10}" width="10" height="10" rx="2.5" fill="${t.patina}" fill-opacity="${ramp[i]}"/>` +
      g.text(name, s.name, 232, y, { fill: t.ink }) +
      g.roll(pct, value, W - PAD, y, { fill: t.muted, anchor: "end", delay: 0.3 + i * 0.12 }).svg
    );
  });

  const body =
    g.text({ font: "mono", size: 11, tracking: 0.12 }, "LANGUAGES · PUBLIC REPOS", PAD, 44, { fill: t.muted }) +
    ring +
    legend.join("");
  const style = motion(
    spin("cw", 90),
    `.arc{animation:arc 1.2s cubic-bezier(.2,.7,.2,1) backwards}@keyframes arc{from{stroke-dashoffset:1}}`,
  );
  return cardDoc(t, { title: languagesAlt(data), body, defs: g.defs(), style, ornament: false });
}
