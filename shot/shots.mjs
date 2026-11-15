// Capture the three Token Radar screenshots into build/screenshots/ (1440x900 viewport).
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const build = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(build, 'out', 'dashboard', 'index.html');
const shots = join(build, 'screenshots');

const browser = await chromium.launch({ headless: true });

const shotsToTake = [
  { name: '1-board.png', url: `file://${out}` },
  { name: '2-detail.png', url: `file://${out}#p=steakhouse-financial` },
  { name: '3-filtered.png', url: `file://${out}#category=Risk%20Curators&scope=watchlist` },
];
for (const s of shotsToTake) {
  // A fresh page per shot: a hash-only navigation on the same page does not reload,
  // so the app would never re-read the hash.
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(s.url, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(shots, s.name) });
  console.log('shot', s.name);
  await page.close();
}
await browser.close();
console.log('done');
