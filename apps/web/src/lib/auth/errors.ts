/**
 * Error code to user-friendly message mapping for Better Auth errors.
 */
export const AUTH_ERROR_MAP: Record<string, string> = {
  INVALID_CREDENTIALS: "Email o password non corretti.",
  INVALID_EMAIL_OR_PASSWORD: "Email o password non corretti.",
  USER_NOT_FOUND: "Non esiste alcun account associato a questa email.",
  EMAIL_NOT_VERIFIED: "Verifica la tua email prima di accedere.",
  ACCOUNT_LOCKED: "L'account e stato bloccato. Contatta il supporto.",
  ACCOUNT_DISABLED: "L'account e stato disabilitato. Contatta il supporto.",
  USER_ALREADY_EXISTS: "Esiste gia un account con questa email.",
  EMAIL_ALREADY_EXISTS: "Esiste gia un account con questa email.",
  EMAIL_ALREADY_IN_USE: "Questa email e gia registrata. Prova ad accedere.",
  PASSWORD_TOO_WEAK: "La password e troppo debole. Scegline una piu sicura.",
  PASSWORD_TOO_SHORT: "La password deve contenere almeno 8 caratteri.",
  INVALID_EMAIL: "Inserisci un indirizzo email valido.",
  INVALID_PHONE_NUMBER:
    "Inserisci un numero di telefono valido in formato internazionale.",
  PHONE_NUMBER_ALREADY_EXISTS:
    "Questo numero di telefono e gia associato a un altro account.",
  INVALID_TOKEN: "Token non valido o scaduto.",
  TOKEN_EXPIRED: "La sessione e scaduta. Accedi di nuovo.",
  TOKEN_INVALID: "Token non valido.",
  RESET_PASSWORD_TOKEN_INVALID: "Il link di reset non e valido o e scaduto.",
  RESET_PASSWORD_TOKEN_EXPIRED:
    "Il link di reset e scaduto. Richiedine uno nuovo.",
  SESSION_EXPIRED: "La sessione e scaduta. Accedi di nuovo.",
  SESSION_INVALID: "Sessione non valida. Accedi di nuovo.",
  TOO_MANY_REQUESTS: "Troppi tentativi. Attendi un attimo e riprova.",
  RATE_LIMIT_EXCEEDED: "Troppe richieste. Attendi un attimo e riprova.",
  INTERNAL_SERVER_ERROR:
    "Si e verificato un errore inatteso. Riprova piu tardi.",
  NETWORK_ERROR: "Errore di rete. Controlla la connessione e riprova.",
  UNKNOWN_ERROR: "Si e verificato un errore inatteso.",
};

export function getAuthErrorMessage(
  error: string | { code?: string; message?: string } | undefined
): string {
  if (!error) {
    return AUTH_ERROR_MAP.UNKNOWN_ERROR;
  }

  if (typeof error === "string") {
    const code = error.toUpperCase();
    return AUTH_ERROR_MAP[code] || error;
  }

  if (error.code) {
    const code = error.code.toUpperCase();
    if (AUTH_ERROR_MAP[code]) {
      return AUTH_ERROR_MAP[code];
    }
  }

  if (error.message) {
    return error.message;
  }

  return AUTH_ERROR_MAP.UNKNOWN_ERROR;
}
