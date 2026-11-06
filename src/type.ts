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
  private readonly clips: string[] = [];

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

  /**
   * A number whose digits roll into place like a counter. Each digit is a
   * 0-9,0-9 strip clipped to one line and parked on its final digit by an
   * inline transform; a `.roll` CSS animation slides the strips up from 0.
   * Without that rule (reduced motion) the final value is simply shown.
   * Returns the markup and its rendered width in px.
   */
  roll(style: TextStyle, text: string, x: number, y: number, paint: Paint & { delay?: number }): { svg: string; width: number } {
    const f = font(style.font);
    const k = style.size / f.unitsPerEm;
    const digits = f.stringToGlyphs("0123456789");
    const cell = Math.max(...digits.map((g) => g.advanceWidth ?? 0)); // tabular figures
    const track = (style.tracking ?? 0) * f.unitsPerEm;
    const pitch = Math.round(1.3 * f.unitsPerEm);

    const slots: { x: number; digit: number | null; glyph: Glyph }[] = [];
    let cursor = 0;
    for (const ch of text) {
      const digit = ch >= "0" && ch <= "9" ? Number(ch) : null;
      const glyph = digit === null ? f.charToGlyph(ch) : digits[digit]!;
      slots.push({ x: cursor, digit, glyph });
      cursor += (digit === null ? (glyph.advanceWidth ?? 0) : cell) + track;
    }
    const width = (cursor - (slots.length ? track : 0)) * k;
    const x0 = paint.anchor === "middle" ? x - width / 2 : paint.anchor === "end" ? x - width : x;
    const place = `translate(${n(x0)} ${n(y)}) scale(${n(k, 5)})`;

    let delay = paint.delay ?? 0;
    const columns = slots.map((s) => {
      if (s.digit === null) {
        const id = this.use(style.font, s.glyph);
        return id ? `<g transform="${place}"><use href="#${id}" x="${Math.round(s.x)}"/></g>` : "";
      }
      const strip = Array.from({ length: 20 }, (_, j) => {
        const g = digits[j % 10]!;
        return `<use href="#${this.use(style.font, g)}" x="${Math.round(s.x + (cell - (g.advanceWidth ?? 0)) / 2)}" y="${j * pitch}"/>`;
      }).join("");
      const shift = (10 + s.digit) * pitch * k;
      const column = `<g class="roll" style="transform:translateY(${n(-shift)}px);animation-delay:${n(delay)}s"><g transform="${place}">${strip}</g></g>`;
      delay += 0.07;
      return column;
    });

    const id = `clip${this.clips.length}`;
    this.clips.push(
      `<clipPath id="${id}"><rect x="${n(x0 - 2)}" y="${n(y - 0.9 * style.size)}" width="${n(width + 4)}" height="${n(1.15 * style.size)}"/></clipPath>`,
    );
    const op = paint.opacity === undefined ? "" : ` opacity="${n(paint.opacity)}"`;
    return { svg: `<g clip-path="url(#${id})" fill="${paint.fill}"${op}>${columns.join("")}</g>`, width };
  }

  defs(): string {
    return [...this.paths].map(([id, d]) => (d ? `<path id="${id}" d="${d}"/>` : "")).join("") + this.clips.join("");
  }
}
