import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef } from "react";
import { useThemeStore, type ThemePreference } from "~/lib/theme";

const themes = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

const ThemeToggle = () => {
  const { preference, setPreference } = useThemeStore();
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const CurrentIcon = themes.find((theme) => theme.value === preference)?.icon || Monitor;

  useEffect(() => {
    const dismissOutside = (event: PointerEvent) => {
      if (details.current && !details.current.contains(event.target as Node)) details.current.open = false;
    };
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, []);

  const select = (value: ThemePreference) => {
    setPreference(value);
    if (details.current) details.current.open = false;
    summary.current?.focus();
  };

  return (
    <details
      ref={details}
      className="theme-switcher"
      onBlur={(event) => {
        // Safari does not focus a button when it is clicked. Its null focus
        // target must not hide the options before the click can select one.
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (details.current) details.current.open = false;
          summary.current?.focus();
        }
      }}
    >
      <summary ref={summary} className="theme-summary" aria-label={`Color theme: ${preference}`} title="Change color theme">
        <CurrentIcon size={16} aria-hidden="true" />
      </summary>
      <div className="theme-options" role="group" aria-label="Color theme">
        {themes.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" aria-pressed={preference === value} onClick={() => select(value)}>
            <Icon size={16} aria-hidden="true" /><span>{label}</span>
            {preference === value && <Check size={16} className="theme-selected" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </details>
  );
};

export default ThemeToggle;
