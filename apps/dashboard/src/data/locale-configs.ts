export interface LocaleConfig {
  code: string;
  name: string;
  flag: string;
}

/**
 * All supported languages for menu translations.
 * Names are in Italian for the admin UI.
 */
export const ALL_LOCALE_CONFIGS: LocaleConfig[] = [
  // Primary
  { code: "it", name: "Italiano", flag: "🇮🇹" },

  // Western European
  { code: "en", name: "Inglese", flag: "🇬🇧" },
  { code: "fr", name: "Francese", flag: "🇫🇷" },
  { code: "es", name: "Spagnolo", flag: "🇪🇸" },
  { code: "de", name: "Tedesco", flag: "🇩🇪" },
  { code: "pt", name: "Portoghese", flag: "🇵🇹" },
  { code: "nl", name: "Olandese", flag: "🇳🇱" },

  // Northern European
  { code: "sv", name: "Svedese", flag: "🇸🇪" },
  { code: "da", name: "Danese", flag: "🇩🇰" },
  { code: "no", name: "Norvegese", flag: "🇳🇴" },
  { code: "fi", name: "Finlandese", flag: "🇫🇮" },

  // Eastern European
  { code: "pl", name: "Polacco", flag: "🇵🇱" },
  { code: "cs", name: "Ceco", flag: "🇨🇿" },
  { code: "sk", name: "Slovacco", flag: "🇸🇰" },
  { code: "hu", name: "Ungherese", flag: "🇭🇺" },
  { code: "ro", name: "Rumeno", flag: "🇷🇴" },
  { code: "bg", name: "Bulgaro", flag: "🇧🇬" },
  { code: "hr", name: "Croato", flag: "🇭🇷" },
  { code: "sr", name: "Serbo", flag: "🇷🇸" },
  { code: "sl", name: "Sloveno", flag: "🇸🇮" },
  { code: "sq", name: "Albanese", flag: "🇦🇱" },

  // Baltic
  { code: "lt", name: "Lituano", flag: "🇱🇹" },
  { code: "lv", name: "Lettone", flag: "🇱🇻" },
  { code: "et", name: "Estone", flag: "🇪🇪" },

  // Eastern
  { code: "uk", name: "Ucraino", flag: "🇺🇦" },
  { code: "ru", name: "Russo", flag: "🇷🇺" },

  // Mediterranean
  { code: "el", name: "Greco", flag: "🇬🇷" },
  { code: "tr", name: "Turco", flag: "🇹🇷" },

  // Middle Eastern
  { code: "ar", name: "Arabo", flag: "🇸🇦" },
  { code: "he", name: "Ebraico", flag: "🇮🇱" },

  // South Asian
  { code: "hi", name: "Hindi", flag: "🇮🇳" },

  // East Asian
  { code: "zh", name: "Cinese", flag: "🇨🇳" },
  { code: "ja", name: "Giapponese", flag: "🇯🇵" },
  { code: "ko", name: "Coreano", flag: "🇰🇷" },

  // Southeast Asian
  { code: "th", name: "Tailandese", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamita", flag: "🇻🇳" },
  { code: "id", name: "Indonesiano", flag: "🇮🇩" },
];

const localeConfigMap = new Map(
  ALL_LOCALE_CONFIGS.map((config) => [config.code, config])
);

export function getLocaleConfig(code: string): LocaleConfig | undefined {
  return localeConfigMap.get(code);
}
