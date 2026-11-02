import { create } from "zustand";

export type ThemePreference = "system" | "light" | "dark";
const storageKey = "resumind-theme";

const readPreference = (): ThemePreference => {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Theme selection remains available when browser storage is disabled.
  }
  return "system";
};

const applyTheme = (preference: ThemePreference) => {
  if (typeof window === "undefined") return;
  const dark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.themePreference = preference;
};

export const useThemeStore = create<{
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}>((set) => ({
  preference: "system",
  setPreference: (preference) => {
    applyTheme(preference);
    try {
      window.localStorage.setItem(storageKey, preference);
    } catch {
      // Apply the preference for this visit even if it cannot be saved.
    }
    set({ preference });
  },
}));

export const initializeTheme = () => {
  const preference = readPreference();
  useThemeStore.setState({ preference });
  applyTheme(preference);
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (useThemeStore.getState().preference === "system") applyTheme("system");
  };
  systemTheme.addEventListener("change", onSystemChange);
  return () => systemTheme.removeEventListener("change", onSystemChange);
};

// Run before styles load so a saved dark preference does not flash a light page.
export const themeBootstrap = `(() => {
  let preference = "system";
  try {
    const saved = localStorage.getItem("resumind-theme");
    if (saved === "light" || saved === "dark") preference = saved;
  } catch {}
  const dark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.themePreference = preference;
})();`;
