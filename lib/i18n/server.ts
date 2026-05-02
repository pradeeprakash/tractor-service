import { cookies } from "next/headers";
import { dict, type Locale, type TKey, type Vars } from "./dict";

type DictTree = { [k: string]: string | DictTree };

export async function getServerT(): Promise<{
  locale: Locale;
  t: (key: TKey, vars?: Vars) => string;
}> {
  const store = await cookies();
  const raw = store.get("tsms_locale")?.value;
  const locale: Locale = raw === "ta" ? "ta" : "en";
  return { locale, t: makeT(dict[locale] as unknown as DictTree) };
}

function makeT(d: DictTree) {
  return (key: TKey, vars?: Vars) => {
    const parts = (key as string).split(".");
    let cur: unknown = d;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return key;
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
