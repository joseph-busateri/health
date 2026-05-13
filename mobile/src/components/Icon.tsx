/**
 * Icon Component
 * Performance-optimized icon system with health domain support
 */

import React, { memo } from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { precomputed } from '../theme/tokens';

export type IconName =
  // Health Domains
  | 'heart'
  | 'activity'
  | 'strength'
  | 'recovery'
  | 'nutrition'
  | 'sleep'
  | 'stress'
  | 'injury'
  // Actions
  | 'check'
  | 'close'
  | 'add'
  | 'edit'
  | 'delete'
  | 'refresh'
  | 'upload'
  | 'download'
  // Navigation
  | 'home'
  | 'settings'
  | 'devices'
  | 'analytics'
  | 'calendar'
  | 'user'
  // Status
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'alert';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'text' | 'textSecondary';

interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: IconColor;
  style?: StyleProp<TextStyle>;
}

// Performance optimization: Pre-defined emoji mappings
const iconMap: Record<IconName, string> = {
  // Health Domains
  heart: '❤️',
  activity: '🏃',
  strength: '💪',
  recovery: '🔋',
  nutrition: '🥗',
  sleep: '😴',
  stress: '🧘',
  injury: '🩹',
  // Actions
  check: '✓',
  close: '✕',
  add: '+',
  edit: '✎',
  delete: '🗑',
  refresh: '↻',
  upload: '↑',
  download: '↓',
  // Navigation
  home: '🏠',
  settings: '⚙️',
  devices: '📱',
  analytics: '📊',
  calendar: '📅',
  user: '👤',
  // Status
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
  success: '✓',
  alert: '🔔',
};

const Icon: React.FC<IconProps> = memo(({
  name,
  size = 'md',
  color = 'text',
  style,
}) => {
  const colors = useThemeColors();

  const sizeMap: Record<IconSize, number> = {
    sm: precomputed.iconSize.sm,
    md: precomputed.iconSize.md,
    lg: precomputed.iconSize.lg,
    xl: precomputed.iconSize.xl,
  };

  const colorMap: Record<IconColor, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    text: colors.text,
    textSecondary: colors.textSecondary,
  };

  return (
    <Text
      style={[
        styles.icon,
        {
          fontSize: sizeMap[size],
          color: colorMap[color],
        },
        style,
      ]}
    >
      {iconMap[name]}
    </Text>
  );
});

Icon.displayName = 'Icon';

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});

export default Icon;
