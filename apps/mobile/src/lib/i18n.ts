import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../i18n/en.json";
import fr from "../i18n/fr.json";
import es from "../i18n/es.json";
import it from "../i18n/it.json";
import de from "../i18n/de.json";
import { getDeviceAppLanguage } from "./appLanguage";

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  },
  lng: getDeviceAppLanguage(),
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    it: { translation: it },
    de: { translation: de }
  }
});

export default i18n;
