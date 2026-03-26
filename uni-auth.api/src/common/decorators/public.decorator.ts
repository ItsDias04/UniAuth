import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Декоратор @Public() — помечает маршрут как публичный (без JWT проверки).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
