/**
 * i18n - Internationalization System
 * 
 * Support for all European languages
 */

const i18next = require('i18next');
const logger = require('./logger');

// Import translations
const translations = {
  en: require('../locales/en.json'),
  ru: require('../locales/ru.json'),
  de: require('../locales/de.json'),
  fr: require('../locales/fr.json'),
  es: require('../locales/es.json'),
  it: require('../locales/it.json'),
  pt: require('../locales/pt.json'),
  nl: require('../locales/nl.json'),
  pl: require('../locales/pl.json'),
  uk: require('../locales/uk.json'),
  cs: require('../locales/cs.json'),
  ro: require('../locales/ro.json'),
  hu: require('../locales/hu.json'),
  sv: require('../locales/sv.json'),
  el: require('../locales/el.json'),
  bg: require('../locales/bg.json'),
  da: require('../locales/da.json'),
  fi: require('../locales/fi.json'),
  sk: require('../locales/sk.json'),
  no: require('../locales/no.json'),
  hr: require('../locales/hr.json'),
  lt: require('../locales/lt.json'),
  sl: require('../locales/sl.json'),
  lv: require('../locales/lv.json'),
  et: require('../locales/et.json'),
  ga: require('../locales/ga.json'),
  mt: require('../locales/mt.json'),
  tr: require('../locales/tr.json')
};

// Initialize i18next
i18next.init({
  lng: 'en', // default language
  fallbackLng: 'en',
  resources: Object.keys(translations).reduce((acc, lang) => {
    acc[lang] = { translation: translations[lang] };
    return acc;
  }, {}),
  interpolation: {
    escapeValue: false
  }
});

/**
 * Get translation function for specific language
 */
function getTranslator(languageCode) {
  const lang = languageCode || 'en';
  
  return (key, params = {}) => {
    return i18next.t(key, { lng: lang, ...params });
  };
}

/**
 * Detect language from Telegram user
 */
function detectLanguage(ctx) {
  // Try to get from user settings first
  if (ctx.user?.language) {
    return ctx.user.language;
  }
  
  // Get from Telegram language code
  const telegramLang = ctx.from?.language_code;
  
  if (telegramLang && translations[telegramLang]) {
    return telegramLang;
  }
  
  // Extract base language (e.g., 'en' from 'en-US')
  if (telegramLang) {
    const baseLang = telegramLang.split('-')[0];
    if (translations[baseLang]) {
      return baseLang;
    }
  }
  
  // Default to English
  return 'en';
}

/**
 * Language names for selection menu
 */
const LANGUAGE_NAMES = {
  en: '🇬🇧 English',
  ru: '🇷🇺 Русский',
  de: '🇩🇪 Deutsch',
  fr: '🇫🇷 Français',
  es: '🇪🇸 Español',
  it: '🇮🇹 Italiano',
  pt: '🇵🇹 Português',
  nl: '🇳🇱 Nederlands',
  pl: '🇵🇱 Polski',
  uk: '🇺🇦 Українська',
  cs: '🇨🇿 Čeština',
  ro: '🇷🇴 Română',
  hu: '🇭🇺 Magyar',
  sv: '🇸🇪 Svenska',
  el: '🇬🇷 Ελληνικά',
  bg: '🇧🇬 Български',
  da: '🇩🇰 Dansk',
  fi: '🇫🇮 Suomi',
  sk: '🇸🇰 Slovenčina',
  no: '🇳🇴 Norsk',
  hr: '🇭🇷 Hrvatski',
  lt: '🇱🇹 Lietuvių',
  sl: '🇸🇮 Slovenščina',
  lv: '🇱🇻 Latviešu',
  et: '🇪🇪 Eesti',
  ga: '🇮🇪 Gaeilge',
  mt: '🇲🇹 Malti',
  tr: '🇹🇷 Türkçe'
};

/**
 * Get available languages
 */
function getAvailableLanguages() {
  return Object.keys(translations);
}

/**
 * Get language keyboard for selection
 */
function getLanguageKeyboard() {
  const languages = Object.entries(LANGUAGE_NAMES);
  const keyboard = [];
  
  // Create rows with 2 languages each
  for (let i = 0; i < languages.length; i += 2) {
    const row = [];
    row.push({ text: languages[i][1], callback_data: `lang_${languages[i][0]}` });
    
    if (i + 1 < languages.length) {
      row.push({ text: languages[i + 1][1], callback_data: `lang_${languages[i + 1][0]}` });
    }
    
    keyboard.push(row);
  }
  
  return keyboard;
}

module.exports = {
  getTranslator,
  detectLanguage,
  getAvailableLanguages,
  getLanguageKeyboard,
  LANGUAGE_NAMES
};
