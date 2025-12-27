/**
 * Playwright скрипт для экспорта видео Guardfolio сцены.
 * 
 * Запускает изолированный Chromium, открывает /export режим,
 * записывает видео через Playwright screen recording и сохраняет в renders/.
 */

import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

interface ExportParams {
  w?: number;
  h?: number;
  fps?: number;
  duration?: number;
  scene?: string;
  preset?: 'low' | 'medium' | 'high' | 'ultra';
}

/**
 * Парсит аргументы командной строки
 */
function parseArgs(): ExportParams {
  const args = process.argv.slice(2);
  const params: ExportParams = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];

    if (key === 'w') params.w = parseInt(value, 10);
    else if (key === 'h') params.h = parseInt(value, 10);
    else if (key === 'fps') params.fps = parseInt(value, 10);
    else if (key === 'duration') params.duration = parseInt(value, 10);
    else if (key === 'scene') params.scene = value;
    else if (key === 'preset') params.preset = value as ExportParams['preset'];
  }

  return params;
}

/**
 * Формирует URL для /export режима
 */
function buildExportUrl(baseUrl: string, params: ExportParams): string {
  const url = new URL('/export', baseUrl);
  
  if (params.w) url.searchParams.set('w', params.w.toString());
  if (params.h) url.searchParams.set('h', params.h.toString());
  if (params.fps) url.searchParams.set('fps', params.fps.toString());
  if (params.duration) url.searchParams.set('duration', params.duration.toString());
  if (params.scene) url.searchParams.set('scene', params.scene);
  if (params.preset) url.searchParams.set('preset', params.preset);

  return url.toString();
}

async function main() {
  const params = parseArgs();

  // Дефолтные значения
  const width = params.w || 1920;
  const height = params.h || 1080;
  const fps = params.fps || 30;
  const duration = params.duration || 30000; // 30 секунд по умолчанию
  const preset = params.preset || 'high';

  // URL для экспорта
  const baseUrl = process.env.VITE_BASE_URL || 'http://localhost:5173';
  const exportUrl = buildExportUrl(baseUrl, params);

  console.log('[Playwright] Starting export:', {
    width,
    height,
    fps,
    duration,
    preset,
    url: exportUrl,
  });

  // Создаём папку renders если её нет
  const rendersDir = path.resolve(process.cwd(), 'renders');
  if (!fs.existsSync(rendersDir)) {
    fs.mkdirSync(rendersDir, { recursive: true });
  }

  // Генерируем имя файла
  const timestamp = Date.now();
  const filename = `guardfolio_${timestamp}.webm`;
  const videoPath = path.join(rendersDir, filename);

  // Запускаем браузер
  const browser = await chromium.launch({
    headless: false, // Нужен для записи видео
  });

  try {
    // Создаём временную папку для видео (Playwright создаёт файлы с автоматическими именами)
    const tempVideoDir = path.join(rendersDir, '.temp-videos');
    if (!fs.existsSync(tempVideoDir)) {
      fs.mkdirSync(tempVideoDir, { recursive: true });
    }

    // Создаём контекст с фиксированным viewport
    const context = await browser.newContext({
      viewport: { width, height },
      recordVideo: {
        dir: tempVideoDir,
        size: { width, height },
      },
    });

    // Создаём страницу
    const page = await context.newPage();

    // Открываем /export режим
    console.log('[Playwright] Navigating to:', exportUrl);
    await page.goto(exportUrl, { waitUntil: 'networkidle' });

    // Ждём готовности window.__EXPORT__
    console.log('[Playwright] Waiting for window.__EXPORT__...');
    await page.waitForFunction(() => {
      return typeof (window as any).__EXPORT__ !== 'undefined';
    }, { timeout: 30000 });

    // Ждём ready
    console.log('[Playwright] Waiting for export ready...');
    await page.waitForFunction(() => {
      const exportAPI = (window as any).__EXPORT__;
      return exportAPI && exportAPI.ready === true;
    }, { timeout: 30000 });

    console.log('[Playwright] Export ready, waiting for completion...');

    // Ждём завершения done promise
    try {
      await page.evaluate(async () => {
        const exportAPI = (window as any).__EXPORT__;
        if (exportAPI && exportAPI.done) {
          await exportAPI.done;
        } else {
          throw new Error('Export API done promise not found');
        }
      });
      console.log('[Playwright] Export done promise resolved');
    } catch (error) {
      console.warn('[Playwright] Error waiting for done promise:', error);
      // Fallback: ждём по таймауту
      console.log('[Playwright] Waiting for duration timeout...');
      await page.waitForTimeout(duration + 1000);
    }

    // Дополнительная задержка для завершения последних кадров
    await page.waitForTimeout(500);

    console.log('[Playwright] Export completed, closing browser...');

    // Закрываем контекст (это сохранит видео)
    await context.close();

    // Получаем путь к видео файлу
    // Playwright создаёт файл с автоматическим именем в подпапке контекста
    // Нужно найти самый новый .webm файл в tempVideoDir
    const videoFiles = fs.readdirSync(tempVideoDir)
      .filter(f => f.endsWith('.webm'))
      .map(f => ({
        name: f,
        path: path.join(tempVideoDir, f),
        mtime: fs.statSync(path.join(tempVideoDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (videoFiles.length > 0) {
      // Перемещаем файл в renders с нужным именем
      const latestVideo = videoFiles[0];
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      fs.renameSync(latestVideo.path, videoPath);

      // Очищаем временную папку
      try {
        fs.rmSync(tempVideoDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('[Playwright] Failed to cleanup temp video dir:', error);
      }

      // Получаем метаданные файла
      const stats = fs.statSync(videoPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Печатаем метаданные
      console.log('\n[Playwright] Export completed successfully!');
      console.log('='.repeat(60));
      console.log('Video metadata:');
      console.log(`  File: ${filename}`);
      console.log(`  Path: ${videoPath}`);
      console.log(`  Size: ${fileSizeMB} MB (${stats.size} bytes)`);
      console.log(`  Resolution: ${width}x${height}`);
      console.log(`  FPS: ${fps}`);
      console.log(`  Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`  Preset: ${preset}`);
      console.log('='.repeat(60));
    } else {
      console.error('[Playwright] No video file found!');
      // Очищаем временную папку даже при ошибке
      try {
        fs.rmSync(tempVideoDir, { recursive: true, force: true });
      } catch (error) {
        // Игнорируем ошибки очистки
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('[Playwright] Export failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('[Playwright] Fatal error:', error);
  process.exit(1);
});

