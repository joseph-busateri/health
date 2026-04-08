/**
 * Theme Context - Dark/Light mode support with performance optimization
 * Uses React Context with memoization to prevent unnecessary re-renders
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from './tokens';

type ThemeMode = 'light' | 'dark' | 'auto';

interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceVariant: string;
    primary: string;
    primaryVariant: string;
    secondary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderLight: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    // Health domain colors
    recovery: string;
    strength: string;
    cardiovascular: string;
    nutrition: string;
    stress: string;
  };
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const lightTheme: Theme = {
  colors: {
    background: colors.neutral[0],
    surface: colors.neutral[0],
    surfaceVariant: colors.neutral[50],
    primary: colors.primary[600],
    primaryVariant: colors.primary[700],
    secondary: colors.primary[500],
    text: colors.neutral[900],
    textSecondary: colors.neutral[600],
    textTertiary: colors.neutral[500],
    border: colors.neutral[200],
    borderLight: colors.neutral[100],
    error: colors.error[600],
    warning: colors.warning[600],
    success: colors.success[600],
    info: colors.info[600],
    recovery: colors.recovery[600],
    strength: colors.strength[600],
    cardiovascular: colors.cardiovascular[600],
    nutrition: colors.nutrition[600],
    stress: colors.stress[600],
  },
  isDark: false,
};

const darkTheme: Theme = {
  colors: {
    background: colors.neutral[950],
    surface: colors.neutral[900],
    surfaceVariant: colors.neutral[800],
    primary: colors.primary[500],
    primaryVariant: colors.primary[400],
    secondary: colors.primary[600],
    text: colors.neutral[50],
    textSecondary: colors.neutral[300],
    textTertiary: colors.neutral[400],
    border: colors.neutral[700],
    borderLight: colors.neutral[800],
    error: colors.error[500],
    warning: colors.warning[500],
    success: colors.success[500],
    info: colors.info[500],
    recovery: colors.recovery[500],
    strength: colors.strength[500],
    cardiovascular: colors.cardiovascular[500],
    nutrition: colors.nutrition[500],
    stress: colors.stress[500],
  },
  isDark: true,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');

  // Memoize theme calculation to prevent unnecessary recalculations
  const theme = useMemo(() => {
    const effectiveMode = themeMode === 'auto' ? systemColorScheme : themeMode;
    return effectiveMode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, systemColorScheme]);

  // Memoize callbacks to prevent re-renders
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((current) => {
      if (current === 'auto') return 'light';
      if (current === 'light') return 'dark';
      return 'auto';
    });
  }, []);

  // Memoize context value to prevent re-renders
  const contextValue = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, setThemeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Performance-optimized hook that only returns theme colors
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

// Performance-optimized hook that only returns isDark
export const useIsDark = () => {
  const { theme } = useTheme();
  return theme.isDark;
};
