/**
 * Advanced Intelligence Section
 * Expandable access to secondary intelligence layers
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AdvancedIntelligenceSection as AdvancedIntelligenceSectionType } from '../../types/controlTower';

interface Props {
  sections: AdvancedIntelligenceSectionType[];
  onNavigate?: (target: string) => void;
}

export const AdvancedIntelligenceSection: React.FC<Props> = ({ sections, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);

  if (sections.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>ADVANCED INTELLIGENCE</Text>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.sectionsContainer}>
          {sections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionCard, !section.available && styles.sectionCardDisabled]}
              onPress={() => section.available && section.navigationTarget && onNavigate?.(section.navigationTarget)}
              disabled={!section.available}
              activeOpacity={0.7}
            >
              <View style={styles.sectionContent}>
                <Text style={[styles.sectionName, !section.available && styles.sectionNameDisabled]}>
                  {section.title}
                </Text>
                <Text style={[styles.sectionDescription, !section.available && styles.sectionDescriptionDisabled]}>
                  {section.description}
                </Text>
              </View>

              {section.available ? (
                <View style={styles.availableBadge}>
                  <Text style={styles.availableBadgeText}>→</Text>
                </View>
              ) : (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonBadgeText}>SOON</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  expandIcon: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionsContainer: {
    gap: 8,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionCardDisabled: {
    opacity: 0.5,
  },
  sectionContent: {
    flex: 1,
    marginRight: 12,
  },
  sectionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  sectionNameDisabled: {
    color: '#64748B',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  sectionDescriptionDisabled: {
    color: '#475569',
  },
  availableBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableBadgeText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
