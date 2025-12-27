/**
 * Playwright скрипт для создания скриншотов всех компонентов.
 * Открывает страницу /components и создает скриншоты.
 */

import { chromium, type Browser, type Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots/components');
const BASE_URL = 'http://localhost:5173';

async function ensureDir(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function takeScreenshot(
  page: Page,
  name: string,
  fullPage: boolean = false
): Promise<void> {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({
    path: filePath,
    fullPage,
  });
  console.log(`✓ Screenshot saved: ${filePath}`);
}

async function main() {
  // Создаем директорию для скриншотов
  await ensureDir(SCREENSHOTS_DIR);

  console.log('🚀 Starting browser...');
  const browser: Browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();
    
    // Устанавливаем размер viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log(`📄 Navigating to ${BASE_URL}/components...`);
    await page.goto(`${BASE_URL}/components`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Ждем загрузки всех компонентов
    await page.waitForTimeout(2000);

    console.log('📸 Taking screenshots...');

    // Полный скриншот страницы
    await takeScreenshot(page, 'all-components-full', true);

    // Скриншоты отдельных секций
    const sections = [
      { name: 'main-components', selector: 'section:nth-of-type(1)' },
      { name: 'progress-ring', selector: 'section:nth-of-type(2)' },
      { name: 'task-components', selector: 'section:nth-of-type(3)' },
      { name: 'analysis-components', selector: 'section:nth-of-type(4)' },
      { name: 'analysis-complete', selector: 'section:nth-of-type(5)' },
    ];

    for (const section of sections) {
      try {
        const element = await page.locator(section.selector).first();
        if (await element.isVisible()) {
          await element.screenshot({
            path: path.join(SCREENSHOTS_DIR, `${section.name}.png`),
          });
          console.log(`✓ Section screenshot saved: ${section.name}.png`);
        }
      } catch (error) {
        console.warn(`⚠ Could not screenshot section ${section.name}:`, error);
      }
    }

    // Скриншоты с разным временем для динамических компонентов
    const timePoints = [0, 5000, 10000, 15000, 20000, 23000];
    for (const timeMs of timePoints) {
      // Устанавливаем время через input
      const timeInput = page.locator('input[type="range"]');
      if (await timeInput.isVisible()) {
        await timeInput.fill(timeMs.toString());
        await page.waitForTimeout(500); // Ждем обновления компонентов

        const timeLabel = `${Math.floor(timeMs / 1000)}s`;
        await takeScreenshot(page, `components-at-${timeLabel}`, true);
      }
    }

    console.log('✅ All screenshots completed!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

