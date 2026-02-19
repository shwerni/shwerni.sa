"use server";
// Prisma db
import prisma from "@/lib/database/db";

// prisma types
import { Setting } from "@/lib/generated/prisma/client";

// set (create or update) a setting
export async function setSetting(category: string, subKey: string, value: any) {
  return prisma.setting.upsert({
    where: { category_subKey: { category, subKey } },
    update: { value },
    create: { category, subKey, value },
  });
}

// update settings same category
export async function setSettings(
  category: string,
  updates: Record<string, any>,
) {
  const promises = Object.entries(updates).map(([subKey, value]) =>
    prisma.setting.upsert({
      where: { category_subKey: { category, subKey } },
      update: { value },
      create: { category, subKey, value },
    }),
  );

  return Promise.all(promises);
}

// get full settings
export async function getAllSettings(): Promise<Setting[] | null> {
  try {
    const settings = await prisma.setting.findMany({});

    return settings;
  } catch {
    return null;
  }
}

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

// get multiple keys from setting.value
export async function getSettingValues<T = unknown>(
  category: string,
  subKey: string,
  keys: string[],
): Promise<Record<string, T> | null> {
  const setting = await getSetting<Record<string, any>>(category, subKey);
  if (!setting) return null;

  const result: Record<string, T> = {};
  for (const k of keys) {
    if (k in setting) {
      result[k] = setting[k];
    }
  }

  return result;
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
export async function getSettingsBySubKeysCategory(
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
