/**
 * LoadingState Component
 * Contextual loading states with clear messaging
 */

import React, { memo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { spacing, typography } from '../theme/tokens';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

const LoadingState: React.FC<LoadingStateProps> = memo(({
  message = 'Loading...',
  size = 'large',
}) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
});

LoadingState.displayName = 'LoadingState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    minHeight: 200,
  },
  message: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
});

export default LoadingState;
