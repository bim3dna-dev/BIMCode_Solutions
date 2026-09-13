import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { persistLocale, readLocale, translate } from "./locale.js";

const LocaleContext = createContext(null);
function storage() {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
export default function LocaleProvider({ children }) {
  const [locale, updateLocale] = useState(() => readLocale(storage()));
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo(
    () => ({
      locale,
      setLocale: (next) => updateLocale(persistLocale(storage(), next)),
      t: (text, values) => translate(locale, text, values),
    }),
    [locale],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}
export const useLocale = () => useContext(LocaleContext);
