import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { HealthDataSectionStatus } from '../types/healthDataHub';
import { getHealthDataStatus } from '../services/healthDataHubService';

export default function HealthDataHubScreen() {
  const navigation = useNavigation();
  const [sections, setSections] = useState<HealthDataSectionStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthDataStatus();
  }, []);

  const loadHealthDataStatus = async () => {
    try {
      setLoading(true);
      const status = await getHealthDataStatus();
      setSections(status);
    } catch (error) {
      console.error('Failed to load health data status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
      case 'connected':
        return '#10b981';
      case 'incomplete':
        return '#f59e0b';
      case 'not_started':
      case 'not_connected':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'incomplete':
        return 'Incomplete';
      case 'not_started':
        return 'Not Started';
      case 'connected':
        return 'Connected';
      case 'not_connected':
        return 'Not Connected';
      default:
        return status;
    }
  };

  const handleSectionPress = (section: HealthDataSectionStatus) => {
    if (!section.available) {
      return;
    }

    switch (section.section) {
      case 'baseline':
        navigation.navigate('BaselineProfile' as never);
        break;
      case 'workout_schedule':
        navigation.navigate('WorkoutSchedule' as never);
        break;
      case 'supplement_intake':
        navigation.navigate('SupplementIntake' as never);
        break;
      case 'bloodwork':
        navigation.navigate('Bloodwork' as never);
        break;
      case 'cardiovascular_risk':
        navigation.navigate('ActuarialRisk' as never);
        break;
      case 'body_composition':
        navigation.navigate('BodyComposition' as never);
        break;
      case 'strength_tracking':
        navigation.navigate('StrengthTracking' as never);
        break;
      case 'tape_measurements':
        navigation.navigate('TapeMeasurements' as never);
        break;
      case 'nutrition':
        navigation.navigate('Nutrition' as never);
        break;
      case 'device_connections':
        navigation.navigate('DeviceConnections' as never);
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading health data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Data</Text>
        <Text style={styles.subtitle}>
          Manage all your health inputs and baselines
        </Text>
      </View>

      <View style={styles.sectionsContainer}>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.section}
            style={[
              styles.sectionCard,
              !section.available && styles.sectionCardDisabled,
            ]}
            onPress={() => handleSectionPress(section)}
            disabled={!section.available}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionIcon}>{section.icon}</Text>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionDescription}>
                    {section.description}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(section.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(section.status)}
                </Text>
              </View>
            </View>

            {section.summary && (
              <Text style={styles.sectionSummary}>{section.summary}</Text>
            )}

            {section.lastUpdated && (
              <Text style={styles.lastUpdated}>
                Last updated: {new Date(section.lastUpdated).toLocaleDateString()}
              </Text>
            )}

            {!section.available && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Upload and manage your health data to power personalized recommendations
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  sectionsContainer: {
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionCardDisabled: {
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionSummary: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    marginLeft: 36,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    marginLeft: 36,
  },
  comingSoonBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginLeft: 36,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  footer: {
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});
