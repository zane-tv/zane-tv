import { parse, type Font, type Glyph } from "opentype.js";
import { n } from "./svg";

/**
 * Text is emitted as outlines, not <text>: an SVG loaded through <img> cannot
 * fetch fonts, and outlines render identically on github.com, mobile and
 * camo-proxied views. Each glyph outline is defined once per document and
 * placed with <use>, which keeps files small.
 */
const FILES = {
  display: "BeVietnamPro-ExtraBold.ttf",
  bold: "BeVietnamPro-Bold.ttf",
  title: "BeVietnamPro-SemiBold.ttf",
  body: "BeVietnamPro-Regular.ttf",
  mono: "JetBrainsMono-Regular.ttf",
  monoMedium: "JetBrainsMono-Medium.ttf",
} as const;

export type FontKey = keyof typeof FILES;

const ID_PREFIX: Record<FontKey, string> = {
  display: "d",
  bold: "b",
  title: "t",
  body: "r",
  mono: "m",
  monoMedium: "k",
};

const fonts = new Map<FontKey, Font>();

export async function loadFonts(dir: string): Promise<void> {
  for (const key of Object.keys(FILES) as FontKey[]) {
    fonts.set(key, parse(await Bun.file(`${dir}/${FILES[key]}`).arrayBuffer()));
  }
}

function font(key: FontKey): Font {
  const f = fonts.get(key);
  if (!f) throw new Error(`font "${key}" is not loaded`);
  return f;
}

export type TextStyle = {
  font: FontKey;
  size: number;
  /** Letter spacing in em. */
  tracking?: number;
};

type Run = { glyphs: Glyph[]; xs: number[]; width: number; upm: number };

function layout(style: TextStyle, text: string): Run {
  const f = font(style.font);
  const glyphs = f.stringToGlyphs(text.normalize("NFC"));
  const track = (style.tracking ?? 0) * f.unitsPerEm;
  const xs: number[] = [];
  let x = 0;
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i]!;
    xs.push(x);
    x += (g.advanceWidth ?? 0) + track;
    const next = glyphs[i + 1];
    if (next) x += f.getKerningValue(g, next);
  }
  return { glyphs, xs, width: glyphs.length ? x - track : 0, upm: f.unitsPerEm };
}

/** Rendered width in px. */
export function measure(style: TextStyle, text: string): number {
  const run = layout(style, text);
  return (run.width * style.size) / run.upm;
}

/** Greedy word wrap to a max line width in px. */
export function wrap(style: TextStyle, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(style, candidate) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

type Paint = { fill: string; opacity?: number; anchor?: "start" | "middle" | "end" };

/** Glyph outline registry for one SVG document. */
export class Glyphs {
  private readonly paths = new Map<string, string>();

  private use(key: FontKey, g: Glyph): string | null {
    const id = `${ID_PREFIX[key]}${g.index}`;
    if (!this.paths.has(id)) {
      const d = g.getPath(0, 0, font(key).unitsPerEm).toPathData(0);
      this.paths.set(id, d);
    }
    return this.paths.get(id) ? id : null; // whitespace glyphs have no outline
  }

  /** One line of text with its baseline at (x, y). */
  text(style: TextStyle, text: string, x: number, y: number, paint: Paint): string {
    const run = layout(style, text);
    const k = style.size / run.upm;
    const w = run.width * k;
    const x0 = paint.anchor === "middle" ? x - w / 2 : paint.anchor === "end" ? x - w : x;
    const uses = run.glyphs
      .map((g, i) => {
        const id = this.use(style.font, g);
        return id ? `<use href="#${id}" x="${Math.round(run.xs[i]!)}"/>` : "";
      })
      .join("");
    const op = paint.opacity === undefined ? "" : ` opacity="${n(paint.opacity)}"`;
    return `<g fill="${paint.fill}"${op} transform="translate(${n(x0)} ${n(y)}) scale(${n(k, 5)})">${uses}</g>`;
  }

  /**
   * Text set clockwise around a circle centred on (cx, cy), starting at
   * `startDeg` (0 = 12 o'clock). Tracking is solved so the text spans exactly
   * `sweepDeg` degrees of arc.
   */
  ring(
    style: Omit<TextStyle, "tracking">,
    text: string,
    cx: number,
    cy: number,
    r: number,
    startDeg: number,
    sweepDeg: number,
    paint: Paint,
  ): string {
    const plain = layout({ ...style, tracking: 0 }, text);
    const k = style.size / plain.upm;
    const arc = ((sweepDeg / 360) * 2 * Math.PI * r) / k; // in font units
    // A closed ring also needs the gap between the last and first glyph.
    const gaps = sweepDeg >= 360 ? plain.glyphs.length : Math.max(plain.glyphs.length - 1, 1);
    const tracking = (arc - plain.width) / gaps / plain.upm;
    const run = layout({ ...style, tracking }, text);
    const uses = run.glyphs
      .map((g, i) => {
        const id = this.use(style.font, g);
        if (!id) return "";
        const half = (g.advanceWidth ?? 0) / 2;
        const along = (run.xs[i]! + half) * k; // px along the arc
        const deg = startDeg + (along / (2 * Math.PI * r)) * 360;
        return `<use href="#${id}" transform="rotate(${n(deg)}) translate(${n(-half * k)} ${n(-r)}) scale(${n(k, 5)})"/>`;
      })
      .join("");
    const op = paint.opacity === undefined ? "" : ` opacity="${n(paint.opacity)}"`;
    return `<g fill="${paint.fill}"${op} transform="translate(${n(cx)} ${n(cy)})">${uses}</g>`;
  }

  defs(): string {
    return [...this.paths].map(([id, d]) => (d ? `<path id="${id}" d="${d}"/>` : "")).join("");
  }
}
