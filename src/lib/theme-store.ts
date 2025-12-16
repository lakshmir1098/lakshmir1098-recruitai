export interface ThemeConfig {
  mode: "light" | "dark" | "system";
  lightTheme: string;
  darkTheme: string;
}

export const lightThemes = [
  { id: "default", name: "Default", primary: "161 93% 30%" },
  { id: "ocean", name: "Ocean Blue", primary: "210 100% 50%" },
  { id: "forest", name: "Forest Green", primary: "142 76% 36%" },
  { id: "sunset", name: "Sunset Orange", primary: "24 95% 53%" },
  { id: "lavender", name: "Lavender Purple", primary: "262 83% 58%" },
  { id: "rose", name: "Rose Pink", primary: "346 77% 50%" },
];

export const darkThemes = [
  { id: "default", name: "Default", primary: "158 64% 51%" },
  { id: "midnight", name: "Midnight Blue", primary: "217 91% 60%" },
  { id: "emerald", name: "Emerald", primary: "160 84% 39%" },
  { id: "amber", name: "Amber Gold", primary: "38 92% 50%" },
  { id: "violet", name: "Violet", primary: "270 95% 75%" },
  { id: "coral", name: "Coral", primary: "16 85% 60%" },
];

const THEME_STORAGE_KEY = "recruit-ai-theme";

export const getThemeConfig = (): ThemeConfig => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    mode: "light",
    lightTheme: "default",
    darkTheme: "default",
  };
};

export const saveThemeConfig = (config: Partial<ThemeConfig>) => {
  const current = getThemeConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
