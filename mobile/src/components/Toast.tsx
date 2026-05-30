/**
 * Toast Component
 * Success/info feedback notifications
 */

import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '../theme/tokens';
import Icon, { IconName } from './Icon';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

const Toast: React.FC<ToastProps> = memo(({
  message,
  type = 'success',
  duration = 3000,
  onDismiss,
}) => {
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Slide in and fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after duration
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, duration, onDismiss]);

  const iconMap: Record<ToastType, IconName> = {
    success: 'check',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  const colorMap: Record<ToastType, string> = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderLeftColor: colorMap[type],
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        shadows.lg,
      ]}
    >
      <Icon name={iconMap[type]} size="md" color={type as any} />
      <Text style={[styles.message, { color: colors.text }]}>
        {message}
      </Text>
    </Animated.View>
  );
});

Toast.displayName = 'Toast';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    zIndex: 1000,
  },
  message: {
    flex: 1,
    marginLeft: spacing[3],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});

export default Toast;
