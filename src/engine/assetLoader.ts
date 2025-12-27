/**
 * AssetLoader - система загрузки ресурсов (шрифты, текстуры).
 * Блокирует запуск engine до полной загрузки всех ресурсов.
 */

export interface AssetManifest {
  fonts?: string[];
  textures?: string[];
}

export class AssetLoader {
  private loadedFonts: Set<string> = new Set();
  private loadedTextures: Map<string, HTMLImageElement | ImageBitmap> = new Map();
  private isReady = false;
  private readyPromise: Promise<void> | null = null;

  /**
   * Загружает все ресурсы из манифеста.
   */
  async load(manifest: AssetManifest): Promise<void> {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = this._load(manifest);
    await this.readyPromise;
    this.isReady = true;
  }

  private async _load(manifest: AssetManifest): Promise<void> {
    const promises: Promise<void>[] = [];

    // Загрузка шрифтов
    if (manifest.fonts) {
      promises.push(...manifest.fonts.map(font => this.loadFont(font)));
    }

    // Загрузка текстур
    if (manifest.textures) {
      promises.push(...manifest.textures.map(url => this.loadTexture(url).then(() => {})));
    }

    await Promise.all(promises);
  }

  /**
   * Загружает шрифт.
   */
  private async loadFont(fontFamily: string): Promise<void> {
    if (this.loadedFonts.has(fontFamily)) {
      return;
    }

    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        // SSR - пропускаем загрузку шрифтов
        resolve();
        return;
      }

      // Проверяем, загружен ли шрифт через FontFace API
      if ('fonts' in document) {
        const fontFace = new FontFace(fontFamily, `local(${fontFamily})`);
        fontFace.load()
          .then(() => {
            document.fonts.add(fontFace);
            this.loadedFonts.add(fontFamily);
            resolve();
          })
          .catch(() => {
            // Если не удалось загрузить через FontFace, пробуем через CSS
            // В большинстве случаев шрифты уже загружены через CSS
            this.loadedFonts.add(fontFamily);
            resolve();
          });
      } else {
        // Fallback для старых браузеров
        this.loadedFonts.add(fontFamily);
        resolve();
      }
    });
  }

  /**
   * Загружает текстуру (изображение).
   */
  async loadTexture(url: string): Promise<HTMLImageElement | ImageBitmap> {
    if (this.loadedTextures.has(url)) {
      return this.loadedTextures.get(url)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Пробуем создать ImageBitmap для лучшей производительности
        if ('createImageBitmap' in window) {
          createImageBitmap(img)
            .then(bitmap => {
              this.loadedTextures.set(url, bitmap);
              resolve(bitmap);
            })
            .catch(() => {
              // Fallback на обычный Image
              this.loadedTextures.set(url, img);
              resolve(img);
            });
        } else {
          this.loadedTextures.set(url, img);
          resolve(img);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load texture: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * Получает загруженную текстуру.
   */
  getTexture(url: string): HTMLImageElement | ImageBitmap | null {
    return this.loadedTextures.get(url) || null;
  }

  /**
   * Проверяет, готовы ли все ресурсы.
   */
  isAssetsReady(): boolean {
    return this.isReady;
  }

  /**
   * Очищает загруженные ресурсы.
   */
  clear(): void {
    this.loadedFonts.clear();
    this.loadedTextures.clear();
    this.isReady = false;
    this.readyPromise = null;
  }
}

