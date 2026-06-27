import type { AppSettings } from 'src/shared/types'

const SETTINGS_KEY = 'app_settings'

const defaults: AppSettings = {
  targetLanguage: 'vi',
  subtitleFontSize: 16,
  subtitlePosition: { x: 50, y: 80 },
  consentGiven: false,
}

export async function loadSettings(): Promise<AppSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY)
  return { ...defaults, ...(result[SETTINGS_KEY] as Partial<AppSettings> | undefined) }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await loadSettings()
  await chrome.storage.local.set({ [SETTINGS_KEY]: { ...current, ...settings } })
}
