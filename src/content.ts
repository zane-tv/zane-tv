/**
 * Everything a visitor reads. Edit here, then run `bun run build`.
 * README.md and assets/ are generated from this file.
 */

export const profile = {
  login: "zane-tv",
  name: "Zane",
  greeting: "XIN CHÀO, MÌNH LÀ",
  /** Cycled under the name, one at a time, in the same order as `roles`. */
  titles: ["Full-stack engineer", "AI engineer", "Data engineer", "DevOps engineer", "Tool builder"],
  /** Hero lines, broken by hand for a good rag. Each must fit 470px at 17.5px. */
  intro: ["Nearly four years shipping web products for teams", "in Japan, Germany, Singapore and Sweden."],
  meta: "Saigon, Vietnam · TypeScript · Go · Python · PHP",
  lately:
    "Lately: a local-first OCR and translation extension that runs on WebGPU, agent skills for motion-graphics videos in " +
    "[holdframe](https://github.com/zane-tv/holdframe), and more interactive TikTok Live stages.",
  linkedin: "https://www.linkedin.com/in/zane-tv",
  email: "tientv.63.work@gmail.com",
} as const;

export type Role = {
  /** Octicon name. */
  icon: string;
  title: string;
  /** Two short lines. */
  stack: readonly [string, string];
};

/** The "what I do" frieze, left to right. */
export const roles: readonly Role[] = [
  { icon: "browser", title: "Full-stack", stack: ["React · Next.js · Vue", "NestJS · Laravel · SQL"] },
  { icon: "ai-model", title: "AI engineering", stack: ["LLM apps · agents · MCP", "OpenAI · ONNX · WebGPU"] },
  { icon: "database", title: "Data engineering", stack: ["PySpark · Delta Lake", "Fabric · Power BI"] },
  { icon: "container", title: "DevOps", stack: ["Docker · AWS · Linux", "GitHub Actions · Vercel"] },
  { icon: "tools", title: "Dev tools", stack: ["Desktop apps · plugins", "Browser extensions"] },
];

export const languages = {
  /** Left out of the byte count: decompiled, generated or markup-only code. */
  ignore: ["Smali", "HTML", "CSS", "MDX"],
  /** Named in the legend; the rest is summed as "Other". */
  top: 5,
} as const;

export type Project = {
  repo: string;
  title: string;
  story: string;
  stack: string;
};

/** Rendered as a 2 x 2 grid, in this order. */
export const featured: readonly Project[] = [
  {
    repo: "soft-db",
    title: "SoftDB",
    story:
      "Desktop client for Postgres, MySQL, SQLite, MongoDB and Redis, with a schema-aware AI assistant. Ships on Homebrew.",
    stack: "Go · Wails · React",
  },
  {
    repo: "opencode-multi-ai",
    title: "opencode-multi-ai",
    story:
      "One OpenCode plugin that pools SuperGrok, ChatGPT and Kiro accounts, rotates when a quota runs dry, and shows usage in the TUI.",
    stack: "TypeScript · OpenCode",
  },
  {
    repo: "tiktok-live-temple-rpc",
    title: "Chùa Linh Ứng Online",
    story:
      "A 9:16 Buddhist temple that runs as a TikTok Live. Viewers light incense, ring the bell and draw fortune sticks with comments, likes and gifts.",
    stack: "Bun · JSON-RPC · ZeroTTS",
  },
  {
    repo: "agent-skills",
    title: "agent-skills",
    story:
      "Installable skills for coding agents: Figma to code with pixel-diff checks, manual test sheets, and a malware audit for fresh clones.",
    stack: "Claude Code · Codex · OpenCode",
  },
];

export const support = {
  title: "Support / Ủng hộ",
  message:
    "Everything here is free and open source. If something saved you an afternoon, a small tip keeps the next experiment going.",
  messageVi: "Quét mã bằng app ngân hàng, MoMo hoặc ZaloPay. Cảm ơn!",
  bank: { name: "Techcombank", bin: "970407" },
  /** Static VietQR exported from the Techcombank app (Napas 247). */
  vietqr: "00020101021138580010A000000727012800069704070114190730759110150208QRIBFTTA5204601153037045802VN5903TCB6005Hanoi63049b40",
} as const;
