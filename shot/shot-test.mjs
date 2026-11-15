import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const browser = await chromium.launch({ headless: true });
console.log('executablePath:', browser.version(), chromium.executablePath());
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('file:///home/hatch/workspace/makefun/token-radar/build/shot/test.html');
await page.screenshot({ path: 'test-shot.png', fullPage: true });
await browser.close();
console.log('screenshot saved');
