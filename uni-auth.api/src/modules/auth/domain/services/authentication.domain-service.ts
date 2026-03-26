/**
 * Domain Service — логика аутентификации.
 * Координирует проверку credentials, brute-force protection
 * и принятие решения о необходимости MFA.
 */
export class AuthenticationDomainService {
  /**
   * Определяет, требуется ли MFA для данного пользователя.
   */
  static isMfaRequired(
    userMfaEnabled: boolean,
    _isNewDevice: boolean = false,
    _riskScore: number = 0,
  ): boolean {
    // MFA обязателен если включён пользователем
    if (userMfaEnabled) return true;
    // Risk-based MFA: если risk score высокий — требовать MFA
    // (расширяется в production)
    return false;
  }

  /**
   * Проверяет, заблокирован ли IP из-за brute-force.
   */
  static isIpBlocked(
    recentAttemptsFromIp: number,
    maxAttemptsPerIp: number = 20,
  ): boolean {
    return recentAttemptsFromIp >= maxAttemptsPerIp;
  }
}
