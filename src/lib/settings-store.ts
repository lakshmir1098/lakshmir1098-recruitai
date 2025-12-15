// Settings store for screening automation preferences

interface ScreeningSettings {
  autoInviteEnabled: boolean;
  autoRejectEnabled: boolean;
}

const SETTINGS_KEY = "recruitai_settings";

const defaultSettings: ScreeningSettings = {
  autoInviteEnabled: true,
  autoRejectEnabled: true,
};

export function getSettings(): ScreeningSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Error reading settings:", e);
  }
  return defaultSettings;
}

export function saveSettings(settings: Partial<ScreeningSettings>): void {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving settings:", e);
  }
}

export function isAutoInviteEnabled(): boolean {
  return getSettings().autoInviteEnabled;
}

export function isAutoRejectEnabled(): boolean {
  return getSettings().autoRejectEnabled;
}
