import { mkdir, rm } from "node:fs/promises";
import { card } from "./card";
import { featured, profile, support } from "./content";
import { fetchProfile } from "./github";
import { hero } from "./hero";
import { parseVietQR, qrPath } from "./qr";
import { donatePage, readme } from "./readme";
import { sponsorButton, supportArt } from "./support";
import { themes } from "./theme";
import { loadFonts } from "./type";

const root = new URL("..", import.meta.url).pathname;

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required (locally: GITHUB_TOKEN=$(gh auth token) bun run build)");

const { bin, account } = parseVietQR(support.vietqr);
if (bin !== support.bank.bin) throw new Error(`VietQR bank BIN ${bin} does not match ${support.bank.name} (${support.bank.bin})`);

await loadFonts(`${root}fonts`);
const data = await fetchProfile(profile.login, featured.map((p) => p.repo), token);
const qr = qrPath(support.vietqr);

// Render everything before touching the disk, so a failed run leaves the last good output in place.
const files = new Map<string, string>();
for (const t of themes) {
  files.set(`assets/hero-${t.name}.svg`, hero(t, data));
  for (const p of featured) files.set(`assets/work-${p.repo}-${t.name}.svg`, card(t, p, data.repos.get(p.repo)!));
  files.set(`assets/support-${t.name}.svg`, supportArt(t, qr, account));
  if (data.sponsorsPublic) files.set(`assets/sponsor-${t.name}.svg`, sponsorButton(t));
}
files.set("README.md", readme(data, account));
files.set("DONATE.md", donatePage(data, account));

await rm(`${root}assets`, { recursive: true, force: true });
await mkdir(`${root}assets`, { recursive: true });
for (const [path, content] of files) await Bun.write(`${root}${path}`, content);

for (const [path, content] of files) {
  console.log(`${path.padEnd(48)} ${(Buffer.byteLength(content) / 1024).toFixed(1)} KB`);
}
console.log(
  `contributions ${data.total} over ${data.weeks.length} weeks · sponsors ${data.sponsorsPublic ? "public" : "not public"}`,
);
