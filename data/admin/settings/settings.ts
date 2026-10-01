import "server-only";
// Prisma db
import prisma from "@/lib/database/db";

// prisma types
import { Setting } from "@/lib/generated/prisma/client";

// get full setting value
export async function getSetting<T = unknown>(
  category: string,
  subKey: string,
): Promise<T | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { category_subKey: { category, subKey } },
    });
    return (setting?.value as unknown as T) ?? null;
  } catch {
    return null;
  }
}

// get full setting values by category
export async function getSettingsByCategory(
  category: string,
): Promise<Setting[] | null> {
  try {
    const settings = await prisma.setting.findMany({
      where: { category },
    });

    return settings;
  } catch {
    return null;
  }
}

// get full setting values by category
async function getSettingsBySubKeysCategory(
  category: string,
  subKeys: string[],
): Promise<Setting[] | null> {
  try {
    const settings = await prisma.setting.findMany({
      where: { category, subKey: { in: subKeys } },
    });

    return settings;
  } catch {
    return null;
  }
}

// get & extract settings
export async function getExtractSettings<T>(
  category: string,
  subKeys: readonly (keyof T)[],
): Promise<{ [K in keyof T]: T[K] | null }> {
  // get settings by category and subKeys
  const settings = await getSettingsBySubKeysCategory(category, [
    ...subKeys,
  ] as string[]);

  // prepare result
  const result = {} as { [K in keyof T]: T[K] | null };

  for (const key of subKeys) {
    const found = settings?.find((s) => s.subKey === key);
    result[key] = (found?.value as T[typeof key]) ?? null;
  }

  return result;
}
