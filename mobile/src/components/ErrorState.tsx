/**
 * ErrorState Component
 * Clear error messaging with recovery actions
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { spacing, typography } from '../theme/tokens';
import Button from './Button';
import Icon from './Icon';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
}

const ErrorState: React.FC<ErrorStateProps> = memo(({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  onSecondaryAction,
  secondaryActionLabel,
}) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="error" size="xl" color="error" />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      
      <View style={styles.actions}>
        {onRetry && (
          <Button
            variant="primary"
            onPress={onRetry}
            style={styles.primaryButton}
          >
            {retryLabel}
          </Button>
        )}
        
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="outline"
            onPress={onSecondaryAction}
          >
            {secondaryActionLabel}
          </Button>
        )}
      </View>
    </View>
  );
});

ErrorState.displayName = 'ErrorState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    minHeight: 300,
  },
  iconContainer: {
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    marginBottom: spacing[6],
    maxWidth: 300,
  },
  actions: {
    width: '100%',
    maxWidth: 300,
    gap: spacing[3],
  },
  primaryButton: {
    marginBottom: spacing[2],
  },
});

export default ErrorState;
