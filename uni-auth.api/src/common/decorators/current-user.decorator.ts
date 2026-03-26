import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Декоратор @CurrentUser() — извлекает текущего пользователя из запроса.
 * Используется в контроллерах после прохождения JWT Guard.
 *
 * @example
 * @Get('me')
 * getProfile(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
