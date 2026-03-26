/**
 * Value Object — URI перенаправления (redirect_uri).
 * Валидирует формат URI и применяет политики безопасности OAuth2.
 */
export class RedirectUri {
  private constructor(private readonly _value: string) {}

  static create(uri: string): RedirectUri {
    if (!uri || uri.trim().length === 0) {
      throw new Error('Redirect URI не может быть пустым');
    }

    try {
      const parsed = new URL(uri);

      // В продакшене запрещаем http (разрешён только https), кроме localhost
      const isLocalhost =
        parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if (parsed.protocol === 'http:' && !isLocalhost) {
        throw new Error('Redirect URI должен использовать HTTPS (кроме localhost)');
      }

      // Запрещаем фрагменты (#)
      if (parsed.hash) {
        throw new Error('Redirect URI не должен содержать фрагмент (#)');
      }
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error(`Некорректный формат URI: ${uri}`);
      }
      throw err;
    }

    return new RedirectUri(uri.trim());
  }

  get value(): string {
    return this._value;
  }

  equals(other: RedirectUri): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
