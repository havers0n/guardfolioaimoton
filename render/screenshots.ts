import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = "screenshots";
const WIDTH = 1920;
const HEIGHT = 1080;

// Тайминги кадров (мс) - по ключевым моментам анимации (15 секунд)
const FRAMES = [
  { t: 350, name: "01_hook" },        // UI anchor hook (0.35s)
  { t: 1500, name: "02_off_early" },  // Ранняя фаза OFF (1.5s)
  { t: 2500, name: "03_off_late" },   // Поздняя фаза OFF (2.5s)
  { t: 4000, name: "04_explain" },   // Фаза EXPLAIN (4.0s)
  { t: 6000, name: "05_there" },      // Фаза THERE (6.0s)
  { t: 9000, name: "06_see" },        // Фаза SEE (9.0s)
  { t: 12000, name: "07_clarity" },   // Фаза CLARITY (12.0s)
  { t: 13500, name: "08_logo_start" }, // Начало показа логотипа (13.5s)
  { t: 14500, name: "09_logo_final" }, // Финальный момент с логотипом (14.5s)
];

/**
 * Скрипт для создания скриншотов анимации по таймлайну
 * 
 * Требования:
 * 1. Dev-сервер должен быть запущен на http://localhost:5173
 * 2. В App.tsx должен быть установлен window.__START_TIME__
 * 
 * Использование:
 * npm run screenshots
 * 
 * Результат: PNG-файлы в директории screenshots/
 */

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  console.log("🌐 Загружаю страницу...");
  
  await page.goto("http://localhost:5173", {
    waitUntil: "networkidle",
  });

  // Ждём инициализации React и установки __START_TIME__
  await page.waitForTimeout(1000);

  // Проверяем, что __START_TIME__ установлен
  const startTime = await page.evaluate(() => {
    return (window as any).__START_TIME__;
  });

  if (!startTime) {
    console.warn("⚠️  window.__START_TIME__ не установлен. Скрипт может работать некорректно.");
  }

  console.log("📸 Начинаю делать скриншоты...");

  for (const frame of FRAMES) {
    // Вычисляем время, прошедшее с момента загрузки страницы
    // Используем performance.now() для точной синхронизации с анимацией
    const elapsed = await page.evaluate(() => {
      const startTime = (window as any).__START_TIME__;
      if (!startTime) return 0;
      return performance.now() - startTime;
    });

    // Вычисляем, сколько нужно подождать до нужного момента
    const waitTime = Math.max(0, frame.t - elapsed);

    if (waitTime > 0) {
      await page.waitForTimeout(waitTime);
    }

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${frame.name}.png`),
      fullPage: false,
    });

    const actualTime = await page.evaluate(() => {
      const startTime = (window as any).__START_TIME__;
      if (!startTime) return 0;
      return performance.now() - startTime;
    });

    console.log(`✅ Saved: ${frame.name}.png (целевое: ${frame.t}ms, фактическое: ${Math.round(actualTime)}ms)`);
  }

  await browser.close();

  console.log(`\n🎉 Все скриншоты сохранены в директорию: ${OUTPUT_DIR}/`);
})();

