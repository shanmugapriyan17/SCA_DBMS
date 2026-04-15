/**
 * @file ThemeToggle.tsx
 * @description Premium pill-style dark/light mode toggle button.
 *              Snow-white light ↔ Deep-purple dark with spring animation.
 */

import { useTheme } from '../../lib/ThemeContext';

interface ThemeToggleProps {
  /** compact = icon-only pill (for mobile nav), default = full pill with labels */
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  if (compact) {
    /* ── Icon-only round button for tight spaces ── */
    return (
      <button
        id="theme-toggle-compact"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
        className="
          relative flex items-center justify-center
          w-9 h-9 rounded-full
          border border-slate-200 dark:border-purple-800/60
          bg-white dark:bg-purple-950/60
          shadow-sm dark:shadow-purple-900/30
          hover:scale-110 hover:shadow-md
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
          transition-transform duration-200
        "
      >
        {/* Sun icon */}
        <svg
          className={`absolute w-4.5 h-4.5 transition-all duration-400 ${
            isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
          style={{ width: '18px', height: '18px' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        {/* Moon icon */}
        <svg
          className={`absolute transition-all duration-400 text-purple-400 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
          style={{ width: '16px', height: '16px' }}
          viewBox="0 0 24 24" fill="currentColor"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    );
  }

  /* ── Full pill toggle ── */
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* LIGHT label */}
      <span
        className={`text-[11px] font-semibold uppercase tracking-widest transition-colors duration-300 ${
          isDark
            ? 'text-slate-600 dark:text-slate-500'
            : 'text-slate-400'
        }`}
      >
        Light
      </span>

      {/* Pill track */}
      <button
        id="theme-toggle"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
        className="theme-toggle-track focus-visible:outline-none"
        tabIndex={0}
      >
        {/* Ripple layer */}
        <span className="theme-toggle-ripple" aria-hidden="true" />

        {/* Knob */}
        <span className="theme-toggle-knob" aria-hidden="true">
          {/* Sun icon (light mode) */}
          <svg
            className={`absolute transition-all duration-300 text-amber-500 ${
              isDark ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'
            }`}
            style={{ width: '14px', height: '14px' }}
            viewBox="0 0 24 24" fill="currentColor"
          >
            <path d="M12 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zM4.22 4.22a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41zm13.44 13.44a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41zM2 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm16 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1zM5.64 17.66a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0zm13.44-13.44a1 1 0 0 1 0 1.41l-.71.71A1 1 0 0 1 16.96 4.22l.71-.71a1 1 0 0 1 1.41 0zM12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z"/>
          </svg>
          {/* Moon icon (dark mode) */}
          <svg
            className={`absolute transition-all duration-300 text-purple-200 ${
              isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'
            }`}
            style={{ width: '12px', height: '12px' }}
            viewBox="0 0 24 24" fill="currentColor"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>
      </button>

      {/* DARK label */}
      <span
        className={`text-[11px] font-semibold uppercase tracking-widest transition-colors duration-300 ${
          isDark
            ? 'text-purple-400 dark:text-purple-300'
            : 'text-slate-400'
        }`}
      >
        Dark
      </span>
    </div>
  );
}
