/**
 * Two palettes, one per GitHub color mode. Backgrounds stay transparent so the
 * art sits on GitHub's own canvas. Bronze is the single accent (drum ornament,
 * icons); patina is reserved for data (the contribution ring).
 */
export type Theme = {
  name: "dark" | "light";
  ink: string; // headlines, numbers
  soft: string; // body copy
  muted: string; // meta, captions
  line: string; // hairlines, drawn with low opacity
  bronze: string;
  patina: string;
};

export const themes: readonly Theme[] = [
  {
    name: "dark",
    ink: "#ECE6DB",
    soft: "#C8C1B5",
    muted: "#958C7E",
    line: "#ECE6DB",
    bronze: "#D29A5C",
    patina: "#73C3A9",
  },
  {
    name: "light",
    ink: "#1C1B19",
    soft: "#3F3B35",
    muted: "#6B6458",
    line: "#1C1B19",
    bronze: "#99601F",
    patina: "#2B7F68",
  },
];
