export const AUTH_ERROR_MAP: Record<string, string> = {
  INVALID_CREDENTIALS: "Email o password non validi.",
  INVALID_EMAIL_OR_PASSWORD: "Email o password non validi.",
  USER_NOT_FOUND: "Nessun account trovato con questa email.",
  EMAIL_NOT_VERIFIED: "Verifica la tua email prima di accedere.",
  ACCOUNT_LOCKED: "L'account è stato bloccato. Contatta il supporto.",
  ACCOUNT_DISABLED: "L'account è stato disabilitato. Contatta il supporto.",
  SESSION_EXPIRED: "Sessione scaduta. Accedi di nuovo.",
  SESSION_INVALID: "Sessione non valida. Accedi di nuovo.",
  TOO_MANY_REQUESTS: "Troppi tentativi. Attendi e riprova.",
  RATE_LIMIT_EXCEEDED: "Troppe richieste. Attendi e riprova.",
  INTERNAL_SERVER_ERROR: "Si è verificato un errore. Riprova più tardi.",
  NETWORK_ERROR: "Errore di rete. Controlla la connessione e riprova.",
  UNKNOWN_ERROR: "Si è verificato un errore imprevisto.",
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
