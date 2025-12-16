import { useEffect } from "react";
import { useTheme } from "next-themes";
import { applyThemeColors } from "@/lib/theme-store";

export function ThemeInitializer() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Apply theme colors when the resolved theme is available
    if (resolvedTheme) {
      applyThemeColors(resolvedTheme === "dark");
    }
  }, [resolvedTheme]);

  return null;
}