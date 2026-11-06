/**
 * Everything a visitor reads. Edit here, then run `bun run build`.
 * README.md and assets/ are generated from this file.
 */

export const profile = {
  login: "zane-tv",
  name: "Zane",
  greeting: "XIN CHÀO, MÌNH LÀ",
  /** Hero lines, broken by hand for a good rag. Each must fit 470px at 19px. */
  tagline: ["I build developer tools, plumbing for AI agents,", "and a Buddhist temple that runs on TikTok Live."],
  meta: "Saigon, Vietnam · TypeScript · Go · Python · Bun",
  lately:
    "Lately: more interactive TikTok Live stages on Bun and Electrobun, agent skills for motion-graphics videos in " +
    "[holdframe](https://github.com/zane-tv/holdframe), and a local-first OCR translator that runs in the browser.",
  linkedin: "https://www.linkedin.com/in/zane-tv",
  email: "tientv.63.work@gmail.com",
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
    repo: "tiktok-live-temple-rpc",
    title: "Chùa Linh Ứng Online",
    story:
      "A 9:16 Buddhist temple that runs as a TikTok Live. Viewers light incense, ring the bell and draw fortune sticks with comments, likes and gifts.",
    stack: "Bun · JSON-RPC · ZeroTTS",
  },
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
