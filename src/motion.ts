import { n } from "./svg";

/**
 * Motion vocabulary shared by every SVG. Each rule only runs for visitors who
 * have not asked for reduced motion; the resting markup is always the final
 * frame, so a static render loses nothing but the movement.
 */
export const motion = (...rules: string[]): string =>
  `@media (prefers-reduced-motion:no-preference){${rules.join("")}}`;

/**
 * Slow rotation; `seconds` per turn, negative turns counter-clockwise. An SVG
 * in <img> is repainted whole on every change, so the turn advances in steps
 * (`fps` per second): at these speeds that is sub-pixel, yet costs a fraction
 * of a 60fps repaint.
 */
export function spin(cls: string, seconds: number, fps = 10): string {
  const name = `${cls}-spin`;
  const turn = Math.abs(seconds);
  return `.${cls}{animation:${name} ${turn}s steps(${Math.round(turn * fps)}) infinite}@keyframes ${name}{to{transform:rotate(${seconds < 0 ? -360 : 360}deg)}}`;
}

/** Digit strips from `Glyphs.roll` sliding into place once, on load. */
export const ROLL = `.roll{animation:roll 1.7s cubic-bezier(.16,1,.3,1) backwards}@keyframes roll{from{transform:translateY(0)}}`;

/**
 * One-at-a-time cycle across elements `.{cls}` with inline `animation-delay`s
 * of `index * slot` seconds: each is lit for one slot, in order, forever.
 * `enter`, `lit` and `exit` are declaration lists for the three states.
 */
export function cycle(cls: string, count: number, slot: number, s: { enter: string; lit: string; exit: string }): string {
  const share = 100 / count;
  return (
    `.${cls}{animation:${cls}-cycle ${count * slot}s cubic-bezier(.2,.7,.2,1) infinite backwards}` +
    `@keyframes ${cls}-cycle{0%{${s.enter}}${n(share * 0.16)}%,${n(share * 0.9)}%{${s.lit}}${n(share * 1.1)}%,100%{${s.exit}}}`
  );
}
