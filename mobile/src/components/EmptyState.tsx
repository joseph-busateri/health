/**
 * EmptyState Component
 * Human-centered empty state with guidance and actions
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { spacing, typography, borderRadius } from '../theme/tokens';
import Button from './Button';
import Icon, { IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = memo(({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {icon && (
        <View style={styles.iconContainer}>
          <Icon name={icon} size="xl" color="textSecondary" />
        </View>
      )}
      
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>
      
      {actionLabel && onAction && (
        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={onAction}
            style={styles.primaryButton}
          >
            {actionLabel}
          </Button>
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              onPress={onSecondaryAction}
              style={styles.secondaryButton}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </View>
      )}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

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
  description: {
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
  secondaryButton: {
    marginTop: spacing[2],
  },
});

export default EmptyState;
