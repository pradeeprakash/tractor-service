"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { dict, type Locale, type TKey, type Vars } from "./dict";

type DictTree = { [k: string]: string | DictTree };

const COOKIE = "tsms_locale";

export type TFn = (key: TKey, vars?: Vars) => string;

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFn;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      try {
        window.localStorage.setItem(COOKIE, l);
      } catch {
        /* ignore */
      }
      // Update the html lang attribute so screen readers announce correctly.
      document.documentElement.lang = l === "ta" ? "ta" : "en";
    }
    setLocaleState(l);
  }, []);

  const t = useMemo<TFn>(() => makeT(dict[locale] as unknown as DictTree), [locale]);

  return <I18nCtx.Provider value={{ locale, setLocale, t }}>{children}</I18nCtx.Provider>;
}

export function useT(): Ctx {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useT must be used inside <I18nProvider>");
  return c;
}

// Resolve a dot-keyed path against the dict; interpolate {var} placeholders.
function makeT(d: DictTree): TFn {
  return (key, vars) => {
    const parts = (key as string).split(".");
    let cur: unknown = d;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return key; // graceful fallback: render the key itself
      }
    }
    if (typeof cur !== "string") return key;
    if (!vars) return cur;
    return cur.replace(/\{(\w+)\}/g, (_, name) => {
      const v = vars[name];
      return v === undefined ? `{${name}}` : String(v);
    });
  };
}
