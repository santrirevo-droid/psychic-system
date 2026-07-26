"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Reads a browser-only API, so this can't run during the server render;
    // deferring to an effect (rather than a lazy initial state) keeps the
    // first client render matching the server's markup and avoids a
    // hydration mismatch.
    const stored = localStorage.getItem("theme") as Theme | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored ?? getSystemTheme());
  }, []);

  function toggle() {
    const current = theme ?? getSystemTheme();
    const next: Theme = current === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  // Avoid rendering with a guessed theme before we know the real one.
  if (!theme) return null;

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      title={theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      className="fixed right-5 bottom-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-card-border bg-card text-foreground shadow-md transition hover:border-primary hover:text-primary"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
