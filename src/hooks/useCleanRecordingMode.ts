import { useEffect } from 'react';

/**
 * Хук для включения "чистого" режима записи
 * Скрывает курсор, убирает UI элементы и т.д.
 */
export const useCleanRecordingMode = (isActive: boolean) => {
  useEffect(() => {
    if (!isActive) return;

    // Сохраняем исходные стили
    const originalCursor = document.body.style.cursor;
    const originalOverflow = document.body.style.overflow;

    // Скрываем курсор
    document.body.style.cursor = 'none';

    // Предотвращаем скролл
    document.body.style.overflow = 'hidden';

    // Скрываем элементы разработки (если есть)
    const devElements = document.querySelectorAll('[data-dev], [data-testid]');
    devElements.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    // Убираем выделение текста
    document.body.style.userSelect = 'none';

    return () => {
      // Восстанавливаем исходные стили
      document.body.style.cursor = originalCursor;
      document.body.style.overflow = originalOverflow;
      document.body.style.userSelect = '';

      // Восстанавливаем dev элементы
      devElements.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });
    };
  }, [isActive]);
};

