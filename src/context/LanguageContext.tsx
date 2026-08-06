"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  Language,
  translations,
} from "@/i18n/translations";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: typeof translations;
};

const LanguageContext =
  createContext<LanguageContextValue | undefined>(
    undefined
  );

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>("de");

  useEffect(() => {
    const stored = localStorage.getItem("paketmarket-language");
    const initialLanguage: Language = stored === "tr" ? "tr" : "de";

    setLanguageState(initialLanguage);
    document.documentElement.lang = initialLanguage;
  }, []);

  function setLanguage(
    newLanguage: Language
  ) {
    setLanguageState(newLanguage);

    localStorage.setItem(
      "paketmarket-language",
      newLanguage
    );

    document.documentElement.lang =
      newLanguage;
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        translations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(
    LanguageContext
  );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}
