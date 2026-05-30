/**
 * Enhanced Button Component
 * Performance-optimized with theme support and variants
 */

import React, { memo, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { spacing, borderRadius, typography } from '../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = memo(({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const colors = useThemeColors();

  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      onPress();
    }
  }, [disabled, loading, onPress]);

  const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { height: 36, paddingHorizontal: spacing[3], fontSize: typography.fontSize.sm },
    md: { height: 48, paddingHorizontal: spacing[4], fontSize: typography.fontSize.base },
    lg: { height: 56, paddingHorizontal: spacing[6], fontSize: typography.fontSize.lg },
  };

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: {
        backgroundColor: colors.primary,
      },
      text: {
        color: '#FFFFFF',
      },
    },
    secondary: {
      container: {
        backgroundColor: colors.surfaceVariant,
      },
      text: {
        color: colors.text,
      },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
      },
      text: {
        color: colors.primary,
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
      },
      text: {
        color: colors.primary,
      },
    },
    danger: {
      container: {
        backgroundColor: colors.error,
      },
      text: {
        color: '#FFFFFF',
      },
    },
  };

  const currentSize = sizeStyles[size];
  const currentVariant = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        currentVariant.container,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          width: fullWidth ? '100%' : undefined,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={currentVariant.text.color}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            currentVariant.text,
            {
              fontSize: currentSize.fontSize,
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
});

export default Button;
