export interface ThemeConfig {
  mode: "light" | "dark" | "system";
  lightTheme: string;
  darkTheme: string;
}

export interface ThemeColors {
  id: string;
  name: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
}

export const lightThemes: ThemeColors[] = [
  { id: "default", name: "Default Green", primary: "161 93% 30%", primaryForeground: "151 80% 95%", accent: "166 76% 96%", accentForeground: "173 80% 40%" },
  { id: "ocean", name: "Ocean Blue", primary: "210 100% 50%", primaryForeground: "210 100% 98%", accent: "210 100% 96%", accentForeground: "210 100% 40%" },
  { id: "forest", name: "Forest Green", primary: "142 76% 36%", primaryForeground: "142 80% 98%", accent: "142 60% 95%", accentForeground: "142 76% 30%" },
  { id: "sunset", name: "Sunset Orange", primary: "24 95% 53%", primaryForeground: "24 100% 98%", accent: "24 100% 96%", accentForeground: "24 95% 40%" },
  { id: "lavender", name: "Lavender Purple", primary: "262 83% 58%", primaryForeground: "262 100% 98%", accent: "262 80% 96%", accentForeground: "262 83% 45%" },
  { id: "rose", name: "Rose Pink", primary: "346 77% 50%", primaryForeground: "346 100% 98%", accent: "346 80% 96%", accentForeground: "346 77% 40%" },
];

export const darkThemes: ThemeColors[] = [
  { id: "default", name: "Default Green", primary: "158 64% 51%", primaryForeground: "165 91% 9%", accent: "178 84% 10%", accentForeground: "172 66% 50%" },
  { id: "midnight", name: "Midnight Blue", primary: "217 91% 60%", primaryForeground: "217 91% 10%", accent: "217 80% 15%", accentForeground: "217 91% 70%" },
  { id: "emerald", name: "Emerald", primary: "160 84% 39%", primaryForeground: "160 84% 10%", accent: "160 70% 12%", accentForeground: "160 84% 50%" },
  { id: "amber", name: "Amber Gold", primary: "38 92% 50%", primaryForeground: "38 92% 10%", accent: "38 80% 12%", accentForeground: "38 92% 60%" },
  { id: "violet", name: "Violet", primary: "270 95% 75%", primaryForeground: "270 95% 10%", accent: "270 80% 15%", accentForeground: "270 95% 80%" },
  { id: "coral", name: "Coral", primary: "16 85% 60%", primaryForeground: "16 85% 10%", accent: "16 70% 15%", accentForeground: "16 85% 70%" },
];

const THEME_STORAGE_KEY = "recruit-ai-theme";

export const getThemeConfig = (): ThemeConfig => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    mode: "system",
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

export const applyThemeColors = (isDark: boolean) => {
  const config = getThemeConfig();
  const themes = isDark ? darkThemes : lightThemes;
  const themeId = isDark ? config.darkTheme : config.lightTheme;
  const theme = themes.find(t => t.id === themeId) || themes[0];
  
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-foreground', theme.primaryForeground);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-foreground', theme.accentForeground);
  root.style.setProperty('--ring', theme.primary);
  root.style.setProperty('--sidebar-primary', theme.primary);
  root.style.setProperty('--sidebar-primary-foreground', theme.primaryForeground);
  root.style.setProperty('--sidebar-ring', theme.primary);
};
