'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  brandColor: string;
  updateBrandColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to convert HEX colors to RGB glow parameters
function hexToRgba(hex: string, alpha: number): string {
  let c = hex.substring(1);
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper to calculate slightly darker/shaded accent colors for hover triggers
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = ((num >> 8) & 0x00ff) + amt,
    B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [brandColor, setBrandColor] = useState<string>('#01019d'); // Default Invoicon Blue

  // Memoized with useCallback so the function reference is stable across renders.
  // This prevents infinite loops when used as a useEffect dependency in child contexts.
  const applyBrandColors = useCallback((color: string) => {
    document.documentElement.style.setProperty('--brand-color', color);
    document.documentElement.style.setProperty('--brand-glow', hexToRgba(color, 0.15));
    document.documentElement.style.setProperty('--brand-dark', shadeColor(color, -20));
  }, []);

  // 1. Initial styling configurations on load
  useEffect(() => {
    const savedColor = localStorage.getItem('invoicon_brand_color');

    // Always force default theme to 'light' on boot and clear stale dark caches
    const initialTheme = 'light';
    localStorage.setItem('invoicon_theme', initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    document.documentElement.classList.remove('dark');

    if (savedColor) {
      setBrandColor(savedColor);
      applyBrandColors(savedColor);
    } else {
      applyBrandColors('#01019d');
    }
  }, [applyBrandColors]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('invoicon_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return nextTheme;
    });
  }, []);

  // Memoized so AuthProvider can safely list updateBrandColor as a useEffect dependency
  // without triggering infinite re-renders on every ThemeProvider render.
  const updateBrandColor = useCallback((color: string) => {
    setBrandColor(color);
    localStorage.setItem('invoicon_brand_color', color);
    applyBrandColors(color);
  }, [applyBrandColors]);

  const contextValue = useMemo(() => ({
    theme, toggleTheme, brandColor, updateBrandColor
  }), [theme, toggleTheme, brandColor, updateBrandColor]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider context boundary');
  }
  return context;
}
