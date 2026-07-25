"use client";

import { Sun, Moon, Coffee } from "lucide-react";

export type ThemeMode = "dark" | "light" | "cream";

interface AnimatedThemeTogglerProps {
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

export function AnimatedThemeToggler({ theme, onSelectTheme }: AnimatedThemeTogglerProps) {
  const options: { id: ThemeMode; label: string; icon: any }[] = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "cream", label: "Cream", icon: Coffee },
    { id: "light", label: "Light", icon: Sun },
  ];

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]/95 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.1)] backdrop-blur-xl"
      role="group"
      aria-label="Color theme"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectTheme(opt.id)}
            title={opt.label}
            aria-label={`${opt.label} theme`}
            aria-pressed={isActive}
            className={`flex min-h-9 min-w-9 items-center justify-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              isActive
                ? "bg-[var(--accent-blue)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
