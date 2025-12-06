import { useEffect, useState } from 'react';

export function useTheme() {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      // ignore
    }
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });

  // Update data-theme attribute and theme-color meta when theme changes
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      // persist
      localStorage.setItem('theme', theme);
      // ensure meta name="theme-color" without media reflects user choice (overrides media-tag defaults)
      const desired = theme === 'dark' ? '#0f1724' : '#f7fafc';
      let meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', desired);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  // Watch for system theme changes (only when user hasn't explicitly set one)
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const systemTheme = e.matches ? 'dark' : 'light';
        try {
          if (!localStorage.getItem('theme')) {
            setTheme(systemTheme);
          }
        } catch (err) {
          setTheme(systemTheme);
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (e) {
      return () => {};
    }
  }, []);

  const toggleTheme = () => {
    setTheme(current => current === 'light' ? 'dark' : 'light');
  };

  return { theme, setTheme, toggleTheme };
}
