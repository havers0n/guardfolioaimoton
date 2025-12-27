import { chromium } from "playwright";
import path from "path";
import fs from "fs";

/**
 * Скрипт для рендеринга видео анимации через Playwright
 * 
 * Требования:
 * 1. Dev-сервер должен быть запущен на http://localhost:5173
 * 2. Анимация должна запускаться автоматически (уже настроено в App.tsx)
 * 
 * Использование:
 * npm run render
 * 
 * Результат: видеофайл в директории renders/
 */

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  // Создаем директорию для рендеров если её нет
  const rendersDir = path.join(process.cwd(), "renders");
  if (!fs.existsSync(rendersDir)) {
    fs.mkdirSync(rendersDir, { recursive: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: rendersDir,
      size: { width: 1920, height: 1080 },
    },
  });

  // Inject RENDER_MODE flag and Seeded Random
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
  
  // IMPORTANT: ждем полной загрузки приложения
  await page.goto("http://localhost:5173", {
    waitUntil: "networkidle",
  });

  // Дополнительное ожидание для инициализации React и запуска анимации
  await page.waitForTimeout(1000);

  console.log("🎬 Начинаю запись видео (30 секунд)...");

  // Ждём завершения всей анимации (30 секунд согласно DURATION_MS)
  // Добавляем небольшой буфер для завершения всех эффектов
  const DURATION_MS = 30_000;
  const BUFFER_MS = 1000; // Небольшой буфер для завершения эффектов
  
  // Wait for the render done flag or timeout
  try {
    await page.waitForFunction(() => (window as any).__RENDER_DONE__, { timeout: DURATION_MS + BUFFER_MS + 5000 });
  } catch (e) {
    console.log("⚠️ Timeout waiting for __RENDER_DONE__, proceeding...");
  }

  console.log("⏹️  Завершаю запись...");

  // Закрываем контекст - это автоматически завершит запись видео
  await context.close();
  await browser.close();

  // Playwright автоматически сохраняет видео в renders/
  // Находим последний созданный файл
  const videoFiles = fs.readdirSync(rendersDir)
    .filter(file => file.endsWith('.webm'))
    .map(file => ({
      name: file,
      path: path.join(rendersDir, file),
      time: fs.statSync(path.join(rendersDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (videoFiles.length > 0) {
    const latestVideo = videoFiles[0];
    console.log(`✅ Рендер завершен: ${latestVideo.path}`);
    console.log(`📁 Размер файла: ${(fs.statSync(latestVideo.path).size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.warn("⚠️  Видеофайл не найден в директории renders/");
  }
})();
