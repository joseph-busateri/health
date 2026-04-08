/**
 * Collapsible Component
 * Performance-optimized expandable section with smooth animations
 */

import React, { memo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { spacing, typography, borderRadius } from '../theme/tokens';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

const Collapsible: React.FC<CollapsibleProps> = memo(({
  title,
  children,
  defaultExpanded = false,
  onToggle,
}) => {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggleExpanded = useCallback(() => {
    const newExpanded = !expanded;
    
    // Configure layout animation for smooth expansion
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Rotate arrow animation
    Animated.timing(rotateAnim, {
      toValue: newExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: true, // Performance optimization
    }).start();

    setExpanded(newExpanded);
    onToggle?.(newExpanded);
  }, [expanded, rotateAnim, onToggle]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggleExpanded}
        activeOpacity={0.7}
        style={[
          styles.header,
          { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Animated.Text
          style={[
            styles.arrow,
            { color: colors.textSecondary, transform: [{ rotate: rotation }] },
          ]}
        >
          ▼
        </Animated.Text>
      </TouchableOpacity>
      
      {expanded && (
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          {children}
        </View>
      )}
    </View>
  );
});

Collapsible.displayName = 'Collapsible';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  arrow: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing[2],
  },
  content: {
    padding: spacing[4],
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    marginTop: -borderRadius.md,
    paddingTop: spacing[4] + borderRadius.md,
  },
});

export default Collapsible;
