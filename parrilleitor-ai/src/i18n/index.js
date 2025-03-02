/**
 * Internationalization (i18n) utility for the application
 * Provides functions for translation and language management
 */

import { createContext, useContext, useState, useEffect } from 'react';

// Import locale files that we know exist
import enLocale from './locales/en.json';
import esLocale from './locales/es.json';
import frLocale from './locales/fr.json';

// Create a fallback empty locale object for missing translations
const emptyLocale = {};

// Safely try to import locale files
let deLocale = emptyLocale;
let itLocale = emptyLocale;
let ptLocale = emptyLocale;
let nlLocale = emptyLocale;
let daLocale = emptyLocale;
let svLocale = emptyLocale;
let fiLocale = emptyLocale;
let elLocale = emptyLocale;
let plLocale = emptyLocale;
let csLocale = emptyLocale;
let huLocale = emptyLocale;
let roLocale = emptyLocale;
let bgLocale = emptyLocale;
let hrLocale = emptyLocale;
let skLocale = emptyLocale;
let slLocale = emptyLocale;
let ltLocale = emptyLocale;
let lvLocale = emptyLocale;
let etLocale = emptyLocale;
let ruLocale = emptyLocale;
let ukLocale = emptyLocale;
let noLocale = emptyLocale;
let isLocale = emptyLocale;

// Dynamically import available locales
try { deLocale = require('./locales/de.json'); } catch (e) { /* file doesn't exist */ }
try { itLocale = require('./locales/it.json'); } catch (e) { /* file doesn't exist */ }
try { ptLocale = require('./locales/pt.json'); } catch (e) { /* file doesn't exist */ }
try { nlLocale = require('./locales/nl.json'); } catch (e) { /* file doesn't exist */ }
try { daLocale = require('./locales/da.json'); } catch (e) { /* file doesn't exist */ }
try { svLocale = require('./locales/sv.json'); } catch (e) { /* file doesn't exist */ }
try { fiLocale = require('./locales/fi.json'); } catch (e) { /* file doesn't exist */ }
try { elLocale = require('./locales/el.json'); } catch (e) { /* file doesn't exist */ }
try { plLocale = require('./locales/pl.json'); } catch (e) { /* file doesn't exist */ }
try { csLocale = require('./locales/cs.json'); } catch (e) { /* file doesn't exist */ }
try { huLocale = require('./locales/hu.json'); } catch (e) { /* file doesn't exist */ }
try { roLocale = require('./locales/ro.json'); } catch (e) { /* file doesn't exist */ }
try { bgLocale = require('./locales/bg.json'); } catch (e) { /* file doesn't exist */ }
try { hrLocale = require('./locales/hr.json'); } catch (e) { /* file doesn't exist */ }
try { skLocale = require('./locales/sk.json'); } catch (e) { /* file doesn't exist */ }
try { slLocale = require('./locales/sl.json'); } catch (e) { /* file doesn't exist */ }
try { ltLocale = require('./locales/lt.json'); } catch (e) { /* file doesn't exist */ }
try { lvLocale = require('./locales/lv.json'); } catch (e) { /* file doesn't exist */ }
try { etLocale = require('./locales/et.json'); } catch (e) { /* file doesn't exist */ }
try { ruLocale = require('./locales/ru.json'); } catch (e) { /* file doesn't exist */ }
try { ukLocale = require('./locales/uk.json'); } catch (e) { /* file doesn't exist */ }
try { noLocale = require('./locales/no.json'); } catch (e) { /* file doesn't exist */ }
try { isLocale = require('./locales/is.json'); } catch (e) { /* file doesn't exist */ }

// Map of all supported locales
export const locales = {
  en: { name: 'English', locale: enLocale },
  es: { name: 'Español', locale: esLocale },
  fr: { name: 'Français', locale: frLocale },
  de: { name: 'Deutsch', locale: deLocale },
  it: { name: 'Italiano', locale: itLocale },
  pt: { name: 'Português', locale: ptLocale },
  nl: { name: 'Nederlands', locale: nlLocale },
  da: { name: 'Dansk', locale: daLocale },
  sv: { name: 'Svenska', locale: svLocale },
  fi: { name: 'Suomi', locale: fiLocale },
  el: { name: 'Ελληνικά', locale: elLocale },
  pl: { name: 'Polski', locale: plLocale },
  cs: { name: 'Čeština', locale: csLocale },
  hu: { name: 'Magyar', locale: huLocale },
  ro: { name: 'Română', locale: roLocale },
  bg: { name: 'Български', locale: bgLocale },
  hr: { name: 'Hrvatski', locale: hrLocale },
  sk: { name: 'Slovenčina', locale: skLocale },
  sl: { name: 'Slovenščina', locale: slLocale },
  lt: { name: 'Lietuvių', locale: ltLocale },
  lv: { name: 'Latviešu', locale: lvLocale },
  et: { name: 'Eesti', locale: etLocale },
  ru: { name: 'Русский', locale: ruLocale },
  uk: { name: 'Українська', locale: ukLocale },
  no: { name: 'Norsk', locale: noLocale },
  is: { name: 'Íslenska', locale: isLocale },
};

// Group languages by region for easier selection
export const languageGroups = {
  western: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl'],
  northern: ['da', 'sv', 'fi', 'no', 'is'],
  eastern: ['pl', 'cs', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'lt', 'lv', 'et', 'ru', 'uk'],
  southern: ['el'],
};

// Create context for the i18n
export const I18nContext = createContext({
  language: 'en',
  t: (key, params) => key,
  setLanguage: () => {},
  getLanguages: () => [],
});

// Default language
const DEFAULT_LANGUAGE = 'en';

// Get translation with interpolation support
const getTranslation = (translations, key, params = {}) => {
  // Split the key to handle nested objects (e.g., "common.buttons.save")
  const keys = key.split('.');
  let value = translations;
  
  // Navigate through the nested objects
  for (let i = 0; i < keys.length; i++) {
    value = value?.[keys[i]];
    if (value === undefined) break;
  }
  
  // If the key doesn't exist in the current language, return the key itself
  if (value === undefined) return key;
  
  // If it's a string, replace parameters
  if (typeof value === 'string') {
    return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
      return acc.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
    }, value);
  }
  
  return key;
};

// Hook to use the i18n context
export const useI18n = () => useContext(I18nContext);

// Provider component to wrap the application
export const I18nProvider = ({ children }) => {
  // Get the preferred language from localStorage or browser, defaulting to en
  const getBrowserLanguage = () => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && locales[savedLanguage]) {
      return savedLanguage;
    }
    
    const browserLanguage = navigator.language.split('-')[0];
    return locales[browserLanguage] ? browserLanguage : DEFAULT_LANGUAGE;
  };
  
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  
  // Initialize language on mount
  useEffect(() => {
    setLanguageState(getBrowserLanguage());
  }, []);
  
  // Set the language and save it to localStorage
  const setLanguage = (lang) => {
    if (locales[lang]) {
      setLanguageState(lang);
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = ['ar', 'he'].includes(lang) ? 'rtl' : 'ltr';
    }
  };
  
  // Translate function
  const t = (key, params = {}) => {
    const translations = locales[language]?.locale || locales[DEFAULT_LANGUAGE].locale;
    return getTranslation(translations, key, params);
  };
  
  // Get available languages
  const getLanguages = () => {
    return Object.entries(locales).map(([code, { name }]) => ({
      code,
      name
    }));
  };
  
  return (
    <I18nContext.Provider value={{ language, t, setLanguage, getLanguages }}>
      {children}
    </I18nContext.Provider>
  );
};

export default { I18nProvider, useI18n }; 