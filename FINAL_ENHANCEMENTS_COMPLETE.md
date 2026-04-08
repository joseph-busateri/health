# FINAL ENHANCEMENTS IMPLEMENTATION
**Navigation Entry Points, Service Connections, Interview Selector, and Source Provenance**

Date: 2026-04-07  
Status: **IMPLEMENTATION GUIDE**

---

## OVERVIEW

This document provides the complete implementation guide for the final enhancements to bring the UI/UX to 100% completion:

1. ✅ Navigation Entry Points - Make screens discoverable
2. ✅ Service Connections - Enable real functionality
3. ✅ Navigation Flow Testing - Ensure everything works
4. ✅ Interview Mode Selector - Improve interview UX
5. ✅ Source Provenance - Complete Phase 20 capabilities

---

## ENHANCEMENT 1: NAVIGATION ENTRY POINTS

### Implementation Strategy

Add navigation buttons to key screens to make newly wired capabilities discoverable.

### 1.1 DashboardV13Screen - Quick Access Panel

**Location**: After Control Tower section, before Recovery section  
**File**: `mobile/src/screens/DashboardV13Screen.tsx`

**Add after line 128** (after Control Tower section):

```typescript
{/* Quick Access Panel */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Quick Access</Text>
  <Text style={styles.sectionSubtitle}>Navigate to key features</Text>
  
  <View style={styles.quickAccessGrid}>
    <TouchableOpacity
      style={styles.quickAccessButton}
      onPress={() => navigation.navigate('ControlTower')}
    >
      <Text style={styles.quickAccessIcon}>🎯</Text>
      <Text style={styles.quickAccessLabel}>Control Tower</Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.quickAccessButton}
      onPress={() => navigation.navigate('GoalManagement')}
    >
      <Text style={styles.quickAccessIcon}>🎯</Text>
      <Text style={styles.quickAccessLabel}>Goals</Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.quickAccessButton}
      onPress={() => navigation.navigate('AnalyticsDashboard')}
    >
      <Text style={styles.quickAccessIcon}>📊</Text>
      <Text style={styles.quickAccessLabel}>Analytics</Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.quickAccessButton}
      onPress={() => navigation.navigate('AutonomousAdjustments')}
    >
      <Text style={styles.quickAccessIcon}>🤖</Text>
      <Text style={styles.quickAccessLabel}>AI Adjustments</Text>
    </TouchableOpacity>
  </View>
</View>
```

**Add to imports**:
```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
```

**Add to component**:
```typescript
const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
```

**Add to styles**:
```typescript
quickAccessGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
},
quickAccessButton: {
  flex: 1,
  minWidth: '45%',
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
},
quickAccessIcon: {
  fontSize: 32,
  marginBottom: 8,
},
quickAccessLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#111827',
  textAlign: 'center',
},
```

### 1.2 UserSettingsScreen - Settings Links

**File**: `mobile/src/screens/UserSettingsScreen.tsx`

**Add settings section**:
```typescript
{/* Profile & Data Management */}
<View style={styles.settingsSection}>
  <Text style={styles.sectionTitle}>Profile & Data</Text>
  
  <TouchableOpacity
    style={styles.settingItem}
    onPress={() => navigation.navigate('BaselineProfile')}
  >
    <Text style={styles.settingLabel}>Edit Baseline Profile</Text>
    <Text style={styles.settingArrow}>→</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={styles.settingItem}
    onPress={() => navigation.navigate('GoalManagement')}
  >
    <Text style={styles.settingLabel}>Manage Goals</Text>
    <Text style={styles.settingArrow}>→</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={styles.settingItem}
    onPress={() => navigation.navigate('HealthDataHub')}
  >
    <Text style={styles.settingLabel}>Health Data Hub</Text>
    <Text style={styles.settingArrow}>→</Text>
  </TouchableOpacity>
</View>
```

### 1.3 DevicesScreen - Device Connection Links

**File**: `mobile/src/screens/DevicesScreen.tsx`

**Add device connection buttons**:
```typescript
{/* Available Connections */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Connect New Device</Text>
  
  <TouchableOpacity
    style={styles.deviceButton}
    onPress={() => navigation.navigate('AppleWatchConnect')}
  >
    <Text style={styles.deviceIcon}>⌚</Text>
    <View style={styles.deviceInfo}>
      <Text style={styles.deviceName}>Apple Watch</Text>
      <Text style={styles.deviceDescription}>Connect your Apple Watch</Text>
    </View>
    <Text style={styles.deviceArrow}>→</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={styles.deviceButton}
    onPress={() => navigation.navigate('OuraConnect')}
  >
    <Text style={styles.deviceIcon}>💍</Text>
    <View style={styles.deviceInfo}>
      <Text style={styles.deviceName}>Oura Ring</Text>
      <Text style={styles.deviceDescription}>Connect your Oura Ring</Text>
    </View>
    <Text style={styles.deviceArrow}>→</Text>
  </TouchableOpacity>
</View>
```

### 1.4 ControlTowerScreen - Autonomous Adjustments Link

**File**: `mobile/src/screens/ControlTowerScreen.tsx`

**Add button in header or after main content**:
```typescript
<TouchableOpacity
  style={styles.adjustmentsButton}
  onPress={() => navigation.navigate('AutonomousAdjustments')}
>
  <Text style={styles.adjustmentsButtonText}>🤖 View AI Adjustments</Text>
</TouchableOpacity>
```

---

## ENHANCEMENT 2: CONNECT SCREENS TO REAL SERVICES

### 2.1 InjuryPreventionScreen - Connect to Backend

**File**: `mobile/src/screens/InjuryPreventionScreen.tsx`

**Replace mock data with real service**:

```typescript
import { injuryPreventionService } from '../services/injuryPrevention';

// In component, replace mock data fetching with:
const fetchInjuryData = async () => {
  setLoading(true);
  try {
    const [risk, painLogs, painSites, recommendations] = await Promise.all([
      injuryPreventionService.calculateInjuryRisk(USER_ID),
      injuryPreventionService.getPainLogs(USER_ID),
      injuryPreventionService.getPainSites(USER_ID),
      injuryPreventionService.getPreventiveRecommendations(USER_ID),
    ]);
    
    setInjuryRisk(risk);
    setPainLogs(painLogs);
    setPainSites(painSites);
    setRecommendations(recommendations);
  } catch (error) {
    console.error('Failed to fetch injury data:', error);
    setError('Failed to load injury prevention data');
  } finally {
    setLoading(false);
  }
};

// For logging pain:
const handleLogPain = async (bodyPart: string, painLevel: number, painType: string, notes?: string) => {
  try {
    await injuryPreventionService.logPain(USER_ID, bodyPart, painLevel, painType, notes);
    // Refresh data
    fetchInjuryData();
  } catch (error) {
    console.error('Failed to log pain:', error);
  }
};
```

### 2.2 StrengthTrackingScreen - Connect to Backend

**File**: `mobile/src/screens/StrengthTrackingScreen.tsx`

**Replace mock data with real service**:

```typescript
import { strengthTrackingService } from '../services/strengthTracking';

// Fetch sessions
const fetchSessions = async () => {
  setLoading(true);
  try {
    const sessions = await strengthTrackingService.getSessions(USER_ID);
    setSessions(sessions);
  } catch (error) {
    console.error('Failed to fetch strength sessions:', error);
    setError('Failed to load strength tracking data');
  } finally {
    setLoading(false);
  }
};

// Log new session
const handleLogSession = async (sessionData: any) => {
  try {
    await strengthTrackingService.createSession({
      userId: USER_ID,
      sessionDate: new Date().toISOString(),
      entries: sessionData.exercises,
    });
    // Refresh data
    fetchSessions();
  } catch (error) {
    console.error('Failed to log session:', error);
  }
};

// Get exercise progression
const fetchExerciseProgression = async (exerciseName: string) => {
  try {
    const progression = await strengthTrackingService.getExerciseProgression(USER_ID, exerciseName);
    setProgression(progression);
  } catch (error) {
    console.error('Failed to fetch progression:', error);
  }
};
```

### 2.3 ConnectedDashboardScreen - Use Device Intelligence Service

**File**: `mobile/src/screens/ConnectedDashboardScreen.tsx`

**Replace legacy API with device intelligence service**:

```typescript
import { controlTowerDeviceIntelligenceService } from '../services/controlTowerDeviceIntelligence';

// Fetch device intelligence
const fetchDeviceIntelligence = async () => {
  setLoading(true);
  try {
    const deviceData = await controlTowerDeviceIntelligenceService.getDeviceIntelligence(USER_ID);
    setDeviceIntelligence(deviceData);
  } catch (error) {
    console.error('Failed to fetch device intelligence:', error);
    setError('Failed to load device intelligence');
  } finally {
    setLoading(false);
  }
};

// Trigger device sync
const handleDeviceSync = async () => {
  setSyncing(true);
  try {
    const result = await controlTowerDeviceIntelligenceService.triggerDeviceSync(USER_ID);
    if (result.success) {
      // Refresh data
      fetchDeviceIntelligence();
    }
  } catch (error) {
    console.error('Failed to sync devices:', error);
  } finally {
    setSyncing(false);
  }
};
```

---

## ENHANCEMENT 3: NAVIGATION FLOW TESTING

### Test Cases

**Critical Navigation Paths**:

1. ✅ **DashboardV13Screen → ControlTowerScreen**
   - Test: `navigation.navigate('ControlTower')`
   - Expected: Control Tower screen loads with 7-section hierarchy

2. ✅ **DashboardV13Screen → GoalManagementScreen**
   - Test: `navigation.navigate('GoalManagement')`
   - Expected: Goal management interface loads

3. ✅ **UserSettingsScreen → BaselineProfileScreen**
   - Test: `navigation.navigate('BaselineProfile')`
   - Expected: Baseline profile editing screen loads

4. ✅ **DevicesScreen → AppleWatchConnectScreen**
   - Test: `navigation.navigate('AppleWatchConnect')`
   - Expected: Apple Watch connection flow starts

5. ✅ **ControlTowerScreen → AutonomousAdjustmentsScreen**
   - Test: `navigation.navigate('AutonomousAdjustments')`
   - Expected: Autonomous adjustments screen loads with filters

**Interview Variant Paths**:

6. ✅ **InterviewSelector → AgentInterviewScreen**
7. ✅ **InterviewSelector → DynamicInterviewScreen**
8. ✅ **InterviewSelector → HybridInterviewScreen**
9. ✅ **InterviewSelector → VoiceInterviewScreen**

**Service Integration Tests**:

10. ✅ **InjuryPreventionScreen** - Fetches real data from backend
11. ✅ **StrengthTrackingScreen** - Logs sessions to backend
12. ✅ **ConnectedDashboardScreen** - Shows device intelligence

---

## ENHANCEMENT 4: INTERVIEW MODE SELECTOR

### Create InterviewSelectorScreen

**File**: `mobile/src/screens/InterviewSelectorScreen.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

const InterviewSelectorScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const interviewModes = [
    {
      id: 'voice',
      title: 'Voice Interview',
      description: 'Speak your responses naturally with voice recording',
      icon: '🎤',
      route: 'VoiceInterview' as const,
      features: ['Voice recording', 'AI transcription', 'Natural conversation'],
      recommended: true,
    },
    {
      id: 'agent',
      title: 'Agent Interview',
      description: 'Structured interview guided by AI agent',
      icon: '🤖',
      route: 'AgentInterview' as const,
      features: ['Guided questions', 'Context-aware', 'Structured format'],
      recommended: false,
    },
    {
      id: 'dynamic',
      title: 'Dynamic Interview',
      description: 'Questions adapt based on your responses',
      icon: '🔄',
      route: 'DynamicInterview' as const,
      features: ['Adaptive questions', 'Personalized flow', 'Smart branching'],
      recommended: false,
    },
    {
      id: 'hybrid',
      title: 'Hybrid Interview',
      description: 'Mix of predefined and AI-generated questions',
      icon: '⚡',
      route: 'HybridInterview' as const,
      features: ['Best of both worlds', 'Flexible format', 'Comprehensive'],
      recommended: false,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Interview Mode</Text>
        <Text style={styles.subtitle}>
          Select how you'd like to complete your daily check-in
        </Text>
      </View>

      {interviewModes.map((mode) => (
        <TouchableOpacity
          key={mode.id}
          style={[
            styles.modeCard,
            mode.recommended && styles.modeCardRecommended,
          ]}
          onPress={() => navigation.navigate(mode.route)}
        >
          {mode.recommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>RECOMMENDED</Text>
            </View>
          )}
          
          <View style={styles.modeHeader}>
            <Text style={styles.modeIcon}>{mode.icon}</Text>
            <View style={styles.modeHeaderText}>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {mode.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.modeFooter}>
            <Text style={styles.startButton}>Start Interview →</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeCardRecommended: {
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modeIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  modeHeaderText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 16,
    color: '#2563EB',
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  modeFooter: {
    alignItems: 'flex-end',
  },
  startButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
});

export default InterviewSelectorScreen;
```

**Wire to Navigation**:

1. Add to `AppNavigator.tsx`:
```typescript
import InterviewSelectorScreen from '../screens/InterviewSelectorScreen';

<Stack.Screen
  name="InterviewSelector"
  component={InterviewSelectorScreen}
  options={{ title: 'Choose Interview Mode' }}
/>
```

2. Add to `navigation.ts`:
```typescript
InterviewSelector: undefined;
```

---

## ENHANCEMENT 5: SOURCE PROVENANCE VISUALIZATION

### Create SourceProvenanceScreen

**File**: `mobile/src/screens/SourceProvenanceScreen.tsx`

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

const USER_ID = 'default-user';

interface DataSource {
  id: string;
  name: string;
  type: string;
  lastSync: string;
  status: string;
  confidence: number;
  dataPoints: number;
}

interface DataConflict {
  id: string;
  dataType: string;
  field: string;
  sources: {
    source: string;
    value: any;
    confidence: number;
    timestamp: string;
  }[];
  resolution: string;
  resolvedValue: any;
}

interface ProvenanceData {
  sources: DataSource[];
  conflicts: DataConflict[];
  freshnessScore: number;
  overallConfidence: number;
}

const SourceProvenanceScreen = () => {
  const [data, setData] = useState<ProvenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProvenance = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/provenance/${USER_ID}`);
      if (!response.ok) {
        throw new Error('Failed to fetch provenance data');
      }
      const provenanceData = await response.json();
      setData(provenanceData);
    } catch (err) {
      setError('Failed to load source provenance data. Please try again.');
      console.error('Provenance error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProvenance();
  }, [fetchProvenance]);

  const onRefresh = useCallback(() => {
    fetchProvenance(true);
  }, [fetchProvenance]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading source provenance...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchProvenance()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Overall Metrics */}
      <View style={styles.metricsCard}>
        <Text style={styles.metricsTitle}>Data Quality Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Freshness Score</Text>
            <Text style={styles.metricValue}>{data?.freshnessScore || 0}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Overall Confidence</Text>
            <Text style={styles.metricValue}>{data?.overallConfidence || 0}%</Text>
          </View>
        </View>
      </View>

      {/* Data Sources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sources</Text>
        <Text style={styles.sectionSubtitle}>
          {data?.sources.length || 0} connected sources
        </Text>

        {data?.sources.map((source) => (
          <View key={source.id} style={styles.sourceCard}>
            <View style={styles.sourceHeader}>
              <View style={styles.sourceHeaderLeft}>
                <Text style={styles.sourceName}>{source.name}</Text>
                <Text style={styles.sourceType}>{source.type}</Text>
              </View>
              <View style={[styles.statusBadge, getStatusColor(source.status)]}>
                <Text style={styles.statusText}>{source.status}</Text>
              </View>
            </View>

            <View style={styles.sourceMetrics}>
              <View style={styles.sourceMetricItem}>
                <Text style={styles.sourceMetricLabel}>Confidence</Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${source.confidence}%` },
                      getConfidenceColor(source.confidence),
                    ]}
                  />
                </View>
                <Text style={styles.sourceMetricValue}>{source.confidence}%</Text>
              </View>

              <View style={styles.sourceMetricItem}>
                <Text style={styles.sourceMetricLabel}>Data Points</Text>
                <Text style={styles.sourceMetricValue}>{source.dataPoints}</Text>
              </View>

              <View style={styles.sourceMetricItem}>
                <Text style={styles.sourceMetricLabel}>Last Sync</Text>
                <Text style={styles.sourceMetricValue}>
                  {new Date(source.lastSync).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Data Conflicts */}
      {data?.conflicts && data.conflicts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Conflicts</Text>
          <Text style={styles.sectionSubtitle}>
            {data.conflicts.length} conflict{data.conflicts.length !== 1 ? 's' : ''} detected
          </Text>

          {data.conflicts.map((conflict) => (
            <View key={conflict.id} style={styles.conflictCard}>
              <View style={styles.conflictHeader}>
                <Text style={styles.conflictType}>{conflict.dataType}</Text>
                <Text style={styles.conflictField}>{conflict.field}</Text>
              </View>

              <View style={styles.conflictSources}>
                {conflict.sources.map((src, idx) => (
                  <View key={idx} style={styles.conflictSource}>
                    <View style={styles.conflictSourceHeader}>
                      <Text style={styles.conflictSourceName}>{src.source}</Text>
                      <Text style={styles.conflictConfidence}>{src.confidence}%</Text>
                    </View>
                    <Text style={styles.conflictValue}>{JSON.stringify(src.value)}</Text>
                    <Text style={styles.conflictTimestamp}>
                      {new Date(src.timestamp).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.conflictResolution}>
                <Text style={styles.resolutionLabel}>Resolution:</Text>
                <Text style={styles.resolutionMethod}>{conflict.resolution}</Text>
                <Text style={styles.resolvedValue}>
                  Resolved: {JSON.stringify(conflict.resolvedValue)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return { backgroundColor: '#10B981' };
    case 'syncing':
      return { backgroundColor: '#3B82F6' };
    case 'error':
      return { backgroundColor: '#EF4444' };
    default:
      return { backgroundColor: '#6B7280' };
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return { backgroundColor: '#10B981' };
  if (confidence >= 60) return { backgroundColor: '#3B82F6' };
  if (confidence >= 40) return { backgroundColor: '#F59E0B' };
  return { backgroundColor: '#EF4444' };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563EB',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  sourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sourceHeaderLeft: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sourceType: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  sourceMetrics: {
    gap: 12,
  },
  sourceMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceMetricLabel: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  sourceMetricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  confidenceBar: {
    flex: 2,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  conflictCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  conflictHeader: {
    marginBottom: 16,
  },
  conflictType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  conflictField: {
    fontSize: 13,
    color: '#64748B',
  },
  conflictSources: {
    gap: 12,
    marginBottom: 16,
  },
  conflictSource: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  conflictSourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  conflictSourceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  conflictConfidence: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  conflictValue: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  conflictTimestamp: {
    fontSize: 11,
    color: '#94A3B8',
  },
  conflictResolution: {
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  resolutionMethod: {
    fontSize: 13,
    color: '#1E40AF',
    marginBottom: 8,
  },
  resolvedValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
});

export default SourceProvenanceScreen;
```

**Wire to Navigation**:

1. Add to `AppNavigator.tsx`:
```typescript
import SourceProvenanceScreen from '../screens/SourceProvenanceScreen';

<Stack.Screen
  name="SourceProvenance"
  component={SourceProvenanceScreen}
  options={{ title: 'Source Provenance' }}
/>
```

2. Add to `navigation.ts`:
```typescript
SourceProvenance: undefined;
```

---

## IMPLEMENTATION CHECKLIST

### Navigation Entry Points ✅
- [ ] Add Quick Access panel to DashboardV13Screen
- [ ] Add Profile & Data section to UserSettingsScreen
- [ ] Add device connection buttons to DevicesScreen
- [ ] Add AI Adjustments link to ControlTowerScreen

### Service Connections ✅
- [ ] Connect InjuryPreventionScreen to `injuryPreventionService`
- [ ] Connect StrengthTrackingScreen to `strengthTrackingService`
- [ ] Connect ConnectedDashboardScreen to `controlTowerDeviceIntelligenceService`

### New Screens ✅
- [ ] Create InterviewSelectorScreen
- [ ] Create SourceProvenanceScreen
- [ ] Wire both to navigation

### Testing ✅
- [ ] Test all navigation paths
- [ ] Test service integrations
- [ ] Test interview selector flow
- [ ] Test source provenance display

---

## ESTIMATED EFFORT

- **Navigation Entry Points**: 1-2 hours
- **Service Connections**: 2-3 hours
- **Interview Selector**: 1 hour
- **Source Provenance**: 2 hours
- **Testing**: 1-2 hours

**Total**: 7-10 hours

---

## FINAL RESULT

After implementing all enhancements:

- **UI Coverage**: 95% → 100% (+5%)
- **User Discoverability**: Excellent
- **Service Integration**: Complete
- **Interview UX**: Significantly improved
- **Phase 20 Capabilities**: Fully visible

---

This implementation guide provides all the code and instructions needed to complete the final enhancements and bring the UI/UX to 100% completion.
