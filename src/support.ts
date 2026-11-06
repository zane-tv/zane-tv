import { icon } from "./card";
import { support } from "./content";
import { BIRD, chain, flock, rings } from "./drum";
import { motion, spin } from "./motion";
import { n, svgDoc } from "./svg";
import type { Theme } from "./theme";
import { Glyphs, measure, wrap, type TextStyle } from "./type";

const W = 880;
const H = 320;
const PAD = 30;
const TILE_W = 216;
const TILE_H = 248; // QR square plus a caption strip
const QUIET = 3; // quiet zone in modules, inside the paper tile

export function supportAlt(account: string): string {
  return `${support.title}. ${support.message} ${support.messageVi} VietQR for ${support.bank.name} account ${account}.`;
}

export function supportArt(t: Theme, qr: { size: number; d: string }, account: string): string {
  const g = new Glyphs();

  // The QR is the drum's sun: its bands radiate from the code, cropped by the frame.
  const tx = W - PAD - TILE_W;
  const ty = (H - TILE_H) / 2;
  const cx = tx + TILE_W / 2;
  const cy = ty + TILE_W / 2;
  const outer = 228;
  const drum =
    `<g clip-path="url(#frame)"><g transform="translate(${n(cx)} ${n(cy)})" color="${t.bronze}" stroke="currentColor" fill="none" stroke-width=".9" opacity=".42">` +
    `<circle class="rip" r="180" stroke-width="1.4" opacity="0"/>` +
    rings(180, 183) +
    `<g class="cw">${chain(36, 190, 3.8)}</g>` +
    rings(197, 199.5) +
    `<g class="ccw">${flock(12, 211)}</g>` +
    rings(outer) +
    `</g></g>`;

  // Copy column stops 24px short of the drum's outer ring.
  const column = cx - outer - 24 - PAD;
  const message: TextStyle = { font: "body", size: 17 };
  const vi: TextStyle = { font: "body", size: 15 };
  const lines = wrap(message, support.message, column);
  const viLines = wrap(vi, support.messageVi, column);
  const viY = 118 + lines.length * 27 + 11;
  if (viY + (viLines.length - 1) * 23 > H - 100) throw new Error("support copy is too long for the block");

  const text = [
    g.text({ font: "bold", size: 30, tracking: -0.02 }, support.title, PAD, 78, { fill: t.ink }),
    ...lines.map((line, i) => g.text(message, line, PAD, 118 + i * 27, { fill: t.soft })),
    ...viLines.map((line, i) => g.text(vi, line, PAD, viY + i * 23, { fill: t.muted })),
    g.text(
      { font: "monoMedium", size: 11, tracking: 0.18 },
      `${support.bank.name.toUpperCase()} · VIETQR · NAPAS 247`,
      PAD,
      H - 72,
      { fill: t.muted },
    ),
    g.text({ font: "monoMedium", size: 26, tracking: 0.06 }, account, PAD, H - 36, { fill: t.ink }),
  ].join("");

  const k = TILE_W / (qr.size + QUIET * 2);
  const caption = "QUÉT ĐỂ ỦNG HỘ · SCAN TO TIP";
  const captionStyle: TextStyle = { font: "monoMedium", size: 9.5, tracking: 0.08 };
  if (measure(captionStyle, caption) > TILE_W - 20) throw new Error("support caption is wider than the QR tile");
  const tile =
    `<rect x="${n(tx)}" y="${n(ty)}" width="${TILE_W}" height="${TILE_H}" rx="14" fill="${t.paper}" stroke="${t.line}" stroke-opacity=".12"/>` +
    `<path fill="${t.qrInk}" shape-rendering="crispEdges" transform="translate(${n(tx + QUIET * k)} ${n(ty + QUIET * k)}) scale(${n(k, 5)})" d="${qr.d}"/>` +
    g.text(captionStyle, caption, cx, ty + TILE_W + 17, { fill: t.qrInk, opacity: 0.62, anchor: "middle" });

  const frame = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${t.line}" stroke-opacity=".16"/>`;

  // Same beat as the hero drum: a ring of sound leaves the QR every 4s.
  const style = motion(
    spin("cw", 200),
    spin("ccw", -120),
    `.rip{animation:rip 6s cubic-bezier(.1,.6,.3,1) infinite}` +
      `@keyframes rip{0%{opacity:.9;transform:scale(1)}27%,100%{opacity:0;transform:scale(1.3)}}`,
  );

  return svgDoc({
    width: W,
    height: H,
    title: supportAlt(account),
    style,
    defs: `<clipPath id="frame"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14"/></clipPath>${BIRD}${g.defs()}`,
    body: frame + drum + tile + text,
  });
}

/** Rendered only after the GitHub Sponsors profile goes public. */
export function sponsorButton(t: Theme): string {
  const g = new Glyphs();
  const label: TextStyle = { font: "title", size: 16 };
  const textW = measure(label, "Sponsor on GitHub");
  const w = Math.ceil(24 + 18 + 10 + textW + 24);
  const h = 48;
  const body =
    `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" fill="${t.bronze}" fill-opacity=".08" stroke="${t.bronze}" stroke-opacity=".55"/>` +
    icon("heart-fill", 24, 15, 18, t.bronze) +
    g.text(label, "Sponsor on GitHub", 24 + 18 + 10, 30, { fill: t.ink });
  return svgDoc({ width: w, height: h, title: "Sponsor Zane on GitHub", defs: g.defs(), body });
}
