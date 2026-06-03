import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../i18n/en.json";
import fr from "../i18n/fr.json";
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
    fr: { translation: fr }
  }
});

export default i18n;
