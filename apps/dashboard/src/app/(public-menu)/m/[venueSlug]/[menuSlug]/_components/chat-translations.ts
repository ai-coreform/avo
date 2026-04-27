/**
 * UI strings for the AvoChatPanel, translated per locale. Separate from the
 * menu *entity* translations system (use-translation-context) because these
 * are static product copy, not per-venue content.
 *
 * Italian is canonical (the product's primary language). English is the
 * fallback for any locale not explicitly listed below — tourists who speak
 * a less common language will still get English UI rather than Italian, and
 * the AI itself responds in their chosen language regardless.
 */

export interface ChatStrings {
  headerTitle: string;
  headerSubtitle: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  placeholder: string;
  disclaimer: string;
  closeAria: string;
  newConversationAria: string;
  sendAria: string;
  followUp: {
    more: string;
    thanks: string;
    alternatives: string;
  };
  error: {
    /** Generic message shown when the chat API returns any error. */
    generic: string;
    /** Specific message when the conversation has gotten too long. */
    conversationTooLong: string;
    /** Specific message when rate-limited. */
    rateLimited: string;
    /** Label for the retry button. */
    retry: string;
  };
  /** Always exactly 4 entries — they fill the 4 welcome chip buttons. */
  defaultSuggestions: [string, string, string, string];
}

const it: ChatStrings = {
  headerTitle: "AVO",
  headerSubtitle: "Il tuo assistente di fiducia",
  welcomeTitle: "Ciao! Sono AVO",
  welcomeSubtitle: "Chiedimi un consiglio, sono qui per aiutarti a scegliere.",
  placeholder: "Chiedimi qualcosa...",
  disclaimer:
    "Le risposte sono generate da un'AI e potrebbero contenere errori. Verifica sempre col nostro staff.",
  closeAria: "Chiudi",
  newConversationAria: "Nuova conversazione",
  sendAria: "Invia",
  followUp: {
    more: "Altro?",
    thanks: "Grazie!",
    alternatives: "Alternative?",
  },
  error: {
    generic: "Si è verificato un errore. Riprova tra poco.",
    conversationTooLong:
      "La conversazione è diventata troppo lunga. Inizia una nuova conversazione.",
    rateLimited:
      "Hai inviato troppi messaggi. Riprova tra qualche minuto.",
    retry: "Riprova",
  },
  defaultSuggestions: [
    "Cosa mi consigli per un aperitivo?",
    "Quale vino sta bene con la carne?",
    "Quali sono le promo del momento?",
    "Voglio qualcosa di fresco e leggero",
  ],
};

const en: ChatStrings = {
  headerTitle: "AVO",
  headerSubtitle: "Your trusted assistant",
  welcomeTitle: "Hi! I'm AVO",
  welcomeSubtitle: "Ask me for a recommendation — I'm here to help you choose.",
  placeholder: "Ask me anything...",
  disclaimer:
    "Responses are AI-generated and may contain errors. Always double-check with our staff.",
  closeAria: "Close",
  newConversationAria: "New conversation",
  sendAria: "Send",
  followUp: {
    more: "More?",
    thanks: "Thanks!",
    alternatives: "Alternatives?",
  },
  error: {
    generic: "Something went wrong. Please try again in a moment.",
    conversationTooLong:
      "This conversation has gotten too long. Please start a new one.",
    rateLimited: "Too many messages. Please try again in a few minutes.",
    retry: "Try again",
  },
  defaultSuggestions: [
    "What do you recommend for an aperitif?",
    "Which wine pairs well with red meat?",
    "Any specials right now?",
    "I'd like something fresh and light",
  ],
};

const es: ChatStrings = {
  headerTitle: "AVO",
  headerSubtitle: "Tu asistente de confianza",
  welcomeTitle: "¡Hola! Soy AVO",
  welcomeSubtitle: "Pídeme un consejo, estoy aquí para ayudarte a elegir.",
  placeholder: "Pregúntame lo que quieras...",
  disclaimer:
    "Las respuestas son generadas por IA y pueden contener errores. Confírmalo siempre con nuestro personal.",
  closeAria: "Cerrar",
  newConversationAria: "Nueva conversación",
  sendAria: "Enviar",
  followUp: {
    more: "¿Algo más?",
    thanks: "¡Gracias!",
    alternatives: "¿Alternativas?",
  },
  error: {
    generic: "Ha ocurrido un error. Inténtalo de nuevo en un momento.",
    conversationTooLong:
      "La conversación se ha vuelto demasiado larga. Empieza una nueva.",
    rateLimited: "Demasiados mensajes. Inténtalo de nuevo en unos minutos.",
    retry: "Reintentar",
  },
  defaultSuggestions: [
    "¿Qué me recomiendas para un aperitivo?",
    "¿Qué vino va bien con la carne?",
    "¿Cuáles son las promociones de hoy?",
    "Quiero algo fresco y ligero",
  ],
};

const fr: ChatStrings = {
  headerTitle: "AVO",
  headerSubtitle: "Votre assistant de confiance",
  welcomeTitle: "Bonjour ! Je suis AVO",
  welcomeSubtitle:
    "Demandez-moi un conseil, je suis là pour vous aider à choisir.",
  placeholder: "Demandez-moi ce que vous voulez...",
  disclaimer:
    "Les réponses sont générées par IA et peuvent contenir des erreurs. Confirmez toujours avec notre équipe.",
  closeAria: "Fermer",
  newConversationAria: "Nouvelle conversation",
  sendAria: "Envoyer",
  followUp: {
    more: "Encore ?",
    thanks: "Merci !",
    alternatives: "Alternatives ?",
  },
  error: {
    generic: "Une erreur s'est produite. Réessayez dans un instant.",
    conversationTooLong:
      "La conversation est devenue trop longue. Commencez-en une nouvelle.",
    rateLimited: "Trop de messages. Réessayez dans quelques minutes.",
    retry: "Réessayer",
  },
  defaultSuggestions: [
    "Que conseillez-vous pour un apéritif ?",
    "Quel vin se marie bien avec la viande ?",
    "Quelles sont les promos du moment ?",
    "Je voudrais quelque chose de frais et léger",
  ],
};

const de: ChatStrings = {
  headerTitle: "AVO",
  headerSubtitle: "Ihr vertrauenswürdiger Assistent",
  welcomeTitle: "Hallo! Ich bin AVO",
  welcomeSubtitle:
    "Fragen Sie mich um Rat — ich helfe Ihnen gerne bei der Auswahl.",
  placeholder: "Frag mich etwas...",
  disclaimer:
    "Antworten werden von einer KI generiert und können Fehler enthalten. Bitte mit unserem Personal abstimmen.",
  closeAria: "Schließen",
  newConversationAria: "Neue Unterhaltung",
  sendAria: "Senden",
  followUp: {
    more: "Mehr?",
    thanks: "Danke!",
    alternatives: "Alternativen?",
  },
  error: {
    generic: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es gleich erneut.",
    conversationTooLong:
      "Die Unterhaltung ist zu lang geworden. Bitte starten Sie eine neue.",
    rateLimited:
      "Zu viele Nachrichten. Bitte versuchen Sie es in ein paar Minuten erneut.",
    retry: "Erneut versuchen",
  },
  defaultSuggestions: [
    "Was empfehlen Sie als Aperitif?",
    "Welcher Wein passt zu Fleisch?",
    "Welche Angebote gibt es gerade?",
    "Ich möchte etwas Frisches und Leichtes",
  ],
};

const STRINGS: Record<string, ChatStrings> = {
  it,
  en,
  es,
  fr,
  de,
};

export function getChatStrings(locale: string): ChatStrings {
  return STRINGS[locale] ?? en;
}
