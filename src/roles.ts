import { icon } from "./card";
import { roles } from "./content";
import { BIRD, comb, linearChain } from "./drum";
import { TITLE_SLOT } from "./hero";
import { cycle, motion } from "./motion";
import { n, svgDoc } from "./svg";
import type { Theme } from "./theme";
import { Glyphs, measure, type TextStyle } from "./type";

const W = 880;
const H = 252;
const PAD = 24;
const BIRD_GAP = 140;

export function rolesAlt(): string {
  return `What I do: ${roles.map((r) => `${r.title} (${r.stack.join(", ")})`).join("; ")}.`;
}

/**
 * The roles as a frieze, the way a drum's side is banded: Lạc birds fly along
 * the top band, a chain runs along the bottom, and each role sits in a small
 * medallion. Medallions light up in turn, on the hero title's beat.
 */
export function rolesArt(t: Theme): string {
  const g = new Glyphs();
  const col = (W - PAD * 2) / roles.length;
  const titleStyle: TextStyle = { font: "title", size: 16, tracking: -0.01 };
  const stackStyle: TextStyle = { font: "mono", size: 11 };

  const columns = roles.map((r, i) => {
    const cx = PAD + col * (i + 0.5);
    for (const w of [measure(titleStyle, r.title), ...r.stack.map((line) => measure(stackStyle, line))]) {
      if (w > col - 12) throw new Error(`role "${r.title}" is wider than its column`);
    }
    const medallion =
      `<g transform="translate(${n(cx)} 104)" color="${t.bronze}" stroke="currentColor" fill="none">` +
      `<circle class="glow" style="animation-delay:${i * TITLE_SLOT}s" r="33" fill="currentColor" fill-opacity=".16" stroke="none" opacity="0"/>` +
      `<circle r="33" stroke-opacity=".5"/><circle r="29.5"/>` +
      `<g class="settle" style="animation-delay:${n(0.2 + i * 0.12)}s" stroke-width=".8">${comb(56, 22, 28)}</g>` +
      `<circle r="20.5"/>` +
      icon(r.icon, -12, -12, 24, "currentColor") +
      `</g>`;
    return (
      medallion +
      g.text(titleStyle, r.title, cx, 168, { fill: t.ink, anchor: "middle" }) +
      r.stack.map((line, j) => g.text(stackStyle, line, cx, 192 + j * 17, { fill: t.muted, anchor: "middle" })).join("")
    );
  });

  let teeth = "";
  for (let x = 3; x < W; x += 6) teeth += `M${x} 6v8`;
  const flock = Array.from(
    { length: Math.ceil(W / BIRD_GAP) + 2 },
    (_, j) => `<use href="#bird" x="${j * BIRD_GAP + 40}" y="39"/>`,
  ).join("");
  const bands =
    `<g clip-path="url(#frame)" color="${t.bronze}" stroke="currentColor" fill="none" opacity=".55">` +
    `<path stroke-width=".8" d="${teeth}"/>` +
    `<path d="M0 18.5H${W}M0 21.5H${W}M0 47.5H${W}M0 50.5H${W}M0 ${H - 30.5}H${W}M0 ${H - 27.5}H${W}"/>` +
    `<g class="fly">${flock}</g>` +
    `<g stroke-width=".9">${linearChain(PAD, W - PAD, H - 13, 3.4, 22)}</g>` +
    `</g>`;

  const frame = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${t.line}" stroke-opacity=".16"/>`;
  const style = motion(
    `.settle{animation:settle 2.2s cubic-bezier(.16,1,.3,1) backwards}@keyframes settle{from{transform:rotate(-90deg)}}`,
    `.fly{animation:fly 16s steps(192) infinite}@keyframes fly{to{transform:translateX(-${BIRD_GAP}px)}}`,
    cycle("glow", roles.length, TITLE_SLOT, { enter: "opacity:0", lit: "opacity:1", exit: "opacity:0" }),
  );

  return svgDoc({
    width: W,
    height: H,
    title: rolesAlt(),
    style,
    defs: `<clipPath id="frame"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14"/></clipPath>${BIRD}${g.defs()}`,
    body: frame + bands + columns.join(""),
  });
}
