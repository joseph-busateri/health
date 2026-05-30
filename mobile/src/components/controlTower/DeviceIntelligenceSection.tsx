/**
 * Device Intelligence Section
 * Real-time physiological intelligence from connected devices
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DeviceIntelligence } from '../../types/controlTower';

interface Props {
  deviceIntelligence: DeviceIntelligence;
}

const DEVICE_ICONS = {
  sleep_number: '🛏️',
  apple_watch: '⌚',
  oura_ring: '💍',
  bp_monitor: '🩺',
  inbody: '⚖️',
};

const STATUS_COLORS = {
  good: '#22C55E',
  warning: '#EAB308',
  critical: '#EF4444',
};

export const DeviceIntelligenceSection: React.FC<Props> = ({ deviceIntelligence }) => {
  if (!deviceIntelligence.hasData || deviceIntelligence.devices.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📱</Text>
        <Text style={styles.emptyText}>No device data available</Text>
        <Text style={styles.emptySubtext}>Connect devices to enable real-time intelligence</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>DEVICE INTELLIGENCE</Text>
        <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(deviceIntelligence.dataQuality) }]}>
          <Text style={styles.qualityBadgeText}>{deviceIntelligence.dataQuality.toUpperCase()}</Text>
        </View>
      </View>

      {deviceIntelligence.devices.map((device, index) => {
        const icon = DEVICE_ICONS[device.deviceType] || '📊';

        return (
          <View key={index} style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceTitleRow}>
                <Text style={styles.deviceIcon}>{icon}</Text>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.deviceName}</Text>
                  {device.lastSync && (
                    <Text style={styles.deviceSync}>
                      Last sync: {formatSyncTime(device.lastSync)}
                    </Text>
                  )}
                </View>
              </View>
              <View style={[styles.connectionBadge, { backgroundColor: device.connected ? '#22C55E' : '#64748B' }]}>
                <Text style={styles.connectionBadgeText}>{device.connected ? 'CONNECTED' : 'OFFLINE'}</Text>
              </View>
            </View>

            {device.highlights.length > 0 && (
              <View style={styles.highlightsGrid}>
                {device.highlights.map((highlight, hIndex) => (
                  <View key={hIndex} style={styles.highlightItem}>
                    <Text style={styles.highlightLabel}>{highlight.label}</Text>
                    <View style={styles.highlightValueRow}>
                      <Text style={styles.highlightValue}>{highlight.value}</Text>
                      {highlight.status && (
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[highlight.status] }]} />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

function getQualityColor(quality: string): string {
  const colors: Record<string, string> = {
    high: '#22C55E',
    medium: '#EAB308',
    low: '#F97316',
    none: '#64748B',
  };
  return colors[quality] || colors.none;
}

function formatSyncTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qualityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deviceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deviceTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  deviceIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  deviceSync: {
    fontSize: 11,
    color: '#64748B',
  },
  connectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  connectionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  highlightItem: {
    flexBasis: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
  },
  highlightLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  highlightValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
