// prisma types
import { Setting } from "@/lib/generated/prisma/client";


// extract settings
export function extractSetting<T = unknown>(
  settings: Setting[] | null,
  key: string
): T | null {
  if (!settings) return null;

  const found = settings.find((setting) => setting.subKey === key);
  return (found?.value as T) ?? null;
}

// ectract all settings
export function extractSettings<T = unknown>(
  settings: Setting[] | null,
  keys: (keyof T)[]
): { [K in keyof T]: T[K] | null } {
  // no '?' here
  const result = {} as { [K in keyof T]: T[K] | null };

  if (!settings) {
    for (const key of keys) {
      result[key] = null;
    }
    return result;
  }

  for (const key of keys) {
    const found = settings.find((s) => s.subKey === key);
    result[key] = (found?.value as T[typeof key]) ?? null;
  }

  return result;
}
