import {createContext, useContext, useEffect, useMemo, useState} from 'react';

const STORAGE_KEY = 'filmgo_admin_theme';
const AdminThemeContext = createContext(null);

export function AdminThemeProvider({children}) {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'dark',
  );

  useEffect(() => {
    document.body.classList.toggle('adminDarkMode', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const syncTheme = event => {
      if (event.key === STORAGE_KEY) setDarkMode(event.newValue === 'dark');
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const value = useMemo(
    () => ({
      darkMode,
      toggleDarkMode: () => setDarkMode(current => !current),
    }),
    [darkMode],
  );

  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error('useAdminTheme must be used inside AdminThemeProvider');
  }
  return context;
}
