import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = "screenshots";
const WIDTH = 1920;
const HEIGHT = 1080;
const DURATION_MS = 30_000;
const INTERVAL_MS = 2_000;

// Генерация списка кадров каждые 2 секунды
const FRAMES = Array.from({ length: Math.ceil(DURATION_MS / INTERVAL_MS) + 1 }, (_, i) => {
  const t = i * INTERVAL_MS;
  return {
    t,
    name: `${String(i).padStart(2, '0')}_${t}ms`
  };
});

/**
 * Скрипт для создания скриншотов анимации каждые 2 секунды
 * 
 * Требования:
 * 1. Dev-сервер должен быть запущен на http://localhost:5173
 * 
 * Использование:
 * npm run screenshots
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

  // Inject RENDER_MODE flag and Seeded Random for consistency with video render
  await context.addInitScript(() => {
    (window as any).__RENDER_MODE__ = true;
    
    // Simple seeded PRNG for deterministic visual noise
    let seed = 123456;
    Math.random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
  });

  const page = await context.newPage();

  console.log("🌐 Загружаю страницу...");
  
  await page.goto("http://localhost:5173", {
    waitUntil: "networkidle",
  });

  // Ждём инициализации
  await page.waitForTimeout(1000);

  console.log(`📸 Начинаю делать скриншоты (всего ${FRAMES.length}, каждые ${INTERVAL_MS/1000}с)...`);

  for (const frame of FRAMES) {
    // Используем "Seek Mode" - принудительно устанавливаем время в приложении
    await page.evaluate((time) => {
      (window as any).__CURRENT_TIME__ = time;
    }, frame.t);

    // Ждём 100мс для обновления React (один-два кадра достаточно)
    // Так как мы форсируем время, нам не нужно ждать "реального" времени
    await page.waitForTimeout(200);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${frame.name}.png`),
      fullPage: false,
    });

    console.log(`✅ Saved: ${frame.name}.png (Force time: ${frame.t}ms)`);
  }

  await browser.close();

  console.log(`\n🎉 Все скриншоты сохранены в директорию: ${OUTPUT_DIR}/`);
})();
