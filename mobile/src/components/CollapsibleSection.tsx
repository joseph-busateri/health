import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  initiallyExpanded?: boolean;
  rightAccessory?: React.ReactNode;
  children: React.ReactNode;
}

if (Platform.OS === 'android' && LayoutAnimation.configureNext === undefined) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const UIManager = require('react-native').UIManager;
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  initiallyExpanded = true,
  rightAccessory,
  children,
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={toggle} accessibilityRole="button">
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          {rightAccessory}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#334155"
            style={styles.chevron}
          />
        </View>
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 8,
  },
  content: {
    marginTop: 16,
  },
});

export default CollapsibleSection;
