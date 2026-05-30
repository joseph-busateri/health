/**
 * ProgressRing Component
 * Performance-optimized circular progress indicator for health metrics
 */

import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { typography } from '../theme/tokens';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  showPercentage?: boolean;
  label?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = memo(({
  progress,
  size = 120,
  strokeWidth = 8,
  color,
  showPercentage = true,
  label,
}) => {
  const colors = useThemeColors();
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const displayColor = color || colors.primary;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false, // Can't use native driver for SVG-like animations
    }).start();
  }, [progress, animatedProgress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash offset for progress
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.border,
          },
        ]}
      />
      
      {/* Progress circle - simplified for React Native without SVG */}
      <View
        style={[
          styles.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: displayColor,
            borderTopColor: 'transparent',
            borderRightColor: progress > 25 ? displayColor : 'transparent',
            borderBottomColor: progress > 50 ? displayColor : 'transparent',
            borderLeftColor: progress > 75 ? displayColor : 'transparent',
          },
        ]}
      />

      {/* Center content */}
      <View style={styles.content}>
        {showPercentage && (
          <Text style={[styles.percentage, { color: colors.text }]}>
            {Math.round(progress)}%
          </Text>
        )}
        {label && (
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
});

ProgressRing.displayName = 'ProgressRing';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginTop: 4,
  },
});

export default ProgressRing;
