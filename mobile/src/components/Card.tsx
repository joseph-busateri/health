/**
 * Enhanced Card Component
 * Performance-optimized with theme support and variants
 */

import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { spacing, borderRadius, shadows } from '../theme/tokens';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof spacing;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = memo(({
  children,
  variant = 'default',
  padding = 4,
  style,
}) => {
  const colors = useThemeColors();

  const variantStyles: Record<CardVariant, ViewStyle> = {
    default: {
      backgroundColor: colors.surface,
      ...shadows.sm,
    },
    elevated: {
      backgroundColor: colors.surface,
      ...shadows.lg,
    },
    outlined: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filled: {
      backgroundColor: colors.surfaceVariant,
    },
  };

  return (
    <View
      style={[
        styles.card,
        variantStyles[variant],
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
});

Card.displayName = 'Card';

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});

export default Card;
