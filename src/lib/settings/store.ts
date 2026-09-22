import { SETTING_DEFINITIONS, defaultSetting } from "../../domain/settings-catalog";
import { db } from "../db/client";
import { settings } from "../db/schema";
import { openSecret } from "./secrets";

export type SettingMap = Record<string, string>;

export function settingKey(group: string, id: string): string {
  return `${group}.${id}`;
}

export function defaultsMap(): SettingMap {
  const map: SettingMap = {};
  for (const row of SETTING_DEFINITIONS) {
    map[settingKey(row.group, row.id)] = row.value;
  }
  return map;
}

export function mergeSettings(overrides: SettingMap): SettingMap {
  return { ...defaultsMap(), ...overrides };
}

export function readMerged(map: SettingMap, group: string, id: string): string {
  return map[settingKey(group, id)] ?? defaultSetting(group, id) ?? "";
}

export async function loadSettings(): Promise<SettingMap> {
  const map = defaultsMap();
  try {
    const rows = await db.select().from(settings);
    for (const row of rows) {
      map[settingKey(row.group, row.id)] = row.type === "secret" ? openSecret(row.value) : row.value;
    }
  } catch {
    return map;
  }
  return map;
}

export async function getSetting(group: string, id: string): Promise<string> {
  const map = await loadSettings();
  return readMerged(map, group, id);
}

export function isYes(value: string): boolean {
  return value === "yes" || value === "true" || value === "1";
}
