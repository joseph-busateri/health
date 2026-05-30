import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InjuryRisk {
  overallScore: number;
  riskLevel: string;
  workloadRisk: number;
  recoveryRisk: number;
  painRisk: number;
  mobilityRisk: number;
  historyRisk: number;
  primaryRiskFactors: string[];
  highestRiskAreas: string[];
  immediateActions: string[];
  preventiveMeasures: string[];
}

interface PainSite {
  bodyPart: string;
  avgPainLevel: number;
  occurrenceCount: number;
  lastOccurrence: string;
}

interface PreventiveRecommendation {
  id: string;
  type: string;
  priority: string;
  urgency: string;
  targetBodyPart: string;
  title: string;
  description: string;
  frequency: string;
  expectedBenefit: string;
  riskReduction: number;
}

export default function InjuryPreventionScreen() {
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'pain' | 'mobility' | 'recommendations'>('overview');
  const [showPainLogModal, setShowPainLogModal] = useState(false);
  const [showJointHealthModal, setShowJointHealthModal] = useState(false);
  
  // Mock data - replace with API calls
  const [injuryRisk, setInjuryRisk] = useState<InjuryRisk>({
    overallScore: 35,
    riskLevel: 'moderate',
    workloadRisk: 40,
    recoveryRisk: 30,
    painRisk: 45,
    mobilityRisk: 25,
    historyRisk: 20,
    primaryRiskFactors: ['Multiple pain sites', 'Limited mobility in shoulders'],
    highestRiskAreas: ['Right Shoulder', 'Lower Back', 'Left Knee'],
    immediateActions: [
      'Address pain sites with ice/heat therapy',
      'Perform daily mobility work',
      'Avoid aggravating activities',
    ],
    preventiveMeasures: [
      'Maintain proper warm-up routine (10-15 minutes)',
      'Include mobility work 3x per week',
      'Monitor pain levels daily',
      'Focus on strengthening exercises for shoulders',
    ],
  });

  const [painSites, setPainSites] = useState<PainSite[]>([
    { bodyPart: 'Right Shoulder', avgPainLevel: 5.5, occurrenceCount: 4, lastOccurrence: '2026-03-28' },
    { bodyPart: 'Lower Back', avgPainLevel: 4.2, occurrenceCount: 3, lastOccurrence: '2026-03-27' },
    { bodyPart: 'Left Knee', avgPainLevel: 3.8, occurrenceCount: 2, lastOccurrence: '2026-03-26' },
  ]);

  const [recommendations, setRecommendations] = useState<PreventiveRecommendation[]>([
    {
      id: '1',
      type: 'stretching',
      priority: 'high',
      urgency: 'immediate',
      targetBodyPart: 'Right Shoulder',
      title: 'Right Shoulder Mobility Work',
      description: 'Perform gentle stretching and mobility exercises for Right Shoulder',
      frequency: 'twice_daily',
      expectedBenefit: 'Reduce pain and improve range of motion',
      riskReduction: 30,
    },
    {
      id: '2',
      type: 'exercise',
      priority: 'medium',
      urgency: 'within_week',
      targetBodyPart: 'Lower Back',
      title: 'Core Strengthening',
      description: 'Build core strength to support lower back and prevent injury',
      frequency: '3x_per_week',
      expectedBenefit: 'Improve stability and reduce back pain',
      riskReduction: 25,
    },
  ]);

  const [painLogForm, setPainLogForm] = useState({
    bodyPart: '',
    painLevel: 5,
    painType: 'aching',
    notes: '',
  });

  const [jointHealthForm, setJointHealthForm] = useState({
    jointName: 'knee_right',
    painLevel: 0,
    rangeOfMotion: 100,
    stiffness: 0,
    notes: '',
  });

  useEffect(() => {
    loadInjuryData();
  }, []);

  const loadInjuryData = async () => {
    setLoading(true);
    try {
      // TODO: Implement API calls when server is running
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error loading injury data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'very_high': return '#dc2626';
      case 'high': return '#ef4444';
      case 'moderate': return '#f59e0b';
      case 'low': return '#3b82f6';
      case 'very_low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const handleLogPain = async () => {
    if (!painLogForm.bodyPart) {
      Alert.alert('Error', 'Please select a body part');
      return;
    }

    try {
      // TODO: Implement API call
      console.log('Logging pain:', painLogForm);
      Alert.alert('Success', 'Pain logged successfully');
      setShowPainLogModal(false);
      setPainLogForm({ bodyPart: '', painLevel: 5, painType: 'aching', notes: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to log pain');
    }
  };

  const handleLogJointHealth = async () => {
    try {
      // TODO: Implement API call
      console.log('Logging joint health:', jointHealthForm);
      Alert.alert('Success', 'Joint health logged successfully');
      setShowJointHealthModal(false);
      setJointHealthForm({ jointName: 'knee_right', painLevel: 0, rangeOfMotion: 100, stiffness: 0, notes: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to log joint health');
    }
  };

  const renderOverview = () => (
    <View style={styles.section}>
      {/* Overall Risk Score */}
      <View style={styles.riskCard}>
        <Text style={styles.cardTitle}>Injury Risk Score</Text>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color: getRiskColor(injuryRisk.riskLevel) }]}>
            {injuryRisk.overallScore}
          </Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(injuryRisk.riskLevel) }]}>
          <Text style={styles.riskText}>{injuryRisk.riskLevel.toUpperCase().replace('_', ' ')}</Text>
        </View>
        <Text style={styles.riskDescription}>
          {injuryRisk.riskLevel === 'very_high' && 'Very high risk - immediate action required'}
          {injuryRisk.riskLevel === 'high' && 'High risk - take preventive measures'}
          {injuryRisk.riskLevel === 'moderate' && 'Moderate risk - monitor closely'}
          {injuryRisk.riskLevel === 'low' && 'Low risk - maintain current approach'}
          {injuryRisk.riskLevel === 'very_low' && 'Very low risk - excellent status'}
        </Text>
      </View>

      {/* Risk Components */}
      <View style={styles.componentsCard}>
        <Text style={styles.cardTitle}>Risk Breakdown</Text>
        
        <View style={styles.componentRow}>
          <View style={styles.componentLabel}>
            <Ionicons name="barbell" size={20} color="#6b7280" />
            <Text style={styles.componentText}>Workload</Text>
          </View>
          <View style={styles.componentBar}>
            <View style={[styles.componentBarFill, { width: `${injuryRisk.workloadRisk}%`, backgroundColor: '#f59e0b' }]} />
          </View>
          <Text style={styles.componentValue}>{injuryRisk.workloadRisk}</Text>
        </View>

        <View style={styles.componentRow}>
          <View style={styles.componentLabel}>
            <Ionicons name="heart" size={20} color="#6b7280" />
            <Text style={styles.componentText}>Recovery</Text>
          </View>
          <View style={styles.componentBar}>
            <View style={[styles.componentBarFill, { width: `${injuryRisk.recoveryRisk}%`, backgroundColor: '#3b82f6' }]} />
          </View>
          <Text style={styles.componentValue}>{injuryRisk.recoveryRisk}</Text>
        </View>

        <View style={styles.componentRow}>
          <View style={styles.componentLabel}>
            <Ionicons name="alert-circle" size={20} color="#6b7280" />
            <Text style={styles.componentText}>Pain</Text>
          </View>
          <View style={styles.componentBar}>
            <View style={[styles.componentBarFill, { width: `${injuryRisk.painRisk}%`, backgroundColor: '#ef4444' }]} />
          </View>
          <Text style={styles.componentValue}>{injuryRisk.painRisk}</Text>
        </View>

        <View style={styles.componentRow}>
          <View style={styles.componentLabel}>
            <Ionicons name="body" size={20} color="#6b7280" />
            <Text style={styles.componentText}>Mobility</Text>
          </View>
          <View style={styles.componentBar}>
            <View style={[styles.componentBarFill, { width: `${injuryRisk.mobilityRisk}%`, backgroundColor: '#8b5cf6' }]} />
          </View>
          <Text style={styles.componentValue}>{injuryRisk.mobilityRisk}</Text>
        </View>

        <View style={styles.componentRow}>
          <View style={styles.componentLabel}>
            <Ionicons name="time" size={20} color="#6b7280" />
            <Text style={styles.componentText}>History</Text>
          </View>
          <View style={styles.componentBar}>
            <View style={[styles.componentBarFill, { width: `${injuryRisk.historyRisk}%`, backgroundColor: '#6b7280' }]} />
          </View>
          <Text style={styles.componentValue}>{injuryRisk.historyRisk}</Text>
        </View>
      </View>

      {/* High Risk Areas */}
      <View style={styles.areasCard}>
        <Text style={styles.cardTitle}>Highest Risk Areas</Text>
        {injuryRisk.highestRiskAreas.map((area, index) => (
          <View key={index} style={styles.areaItem}>
            <Ionicons name="warning" size={16} color="#ef4444" />
            <Text style={styles.areaText}>{area}</Text>
          </View>
        ))}
      </View>

      {/* Immediate Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Immediate Actions</Text>
        {injuryRisk.immediateActions.map((action, index) => (
          <View key={index} style={styles.actionItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#3b82f6" />
            <Text style={styles.actionText}>{action}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPain = () => (
    <View style={styles.section}>
      {/* Log Pain Button */}
      <TouchableOpacity style={styles.logButton} onPress={() => setShowPainLogModal(true)}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.logButtonText}>Log Pain</Text>
      </TouchableOpacity>

      {/* Active Pain Sites */}
      <Text style={styles.sectionTitle}>Active Pain Sites</Text>
      {painSites.map((site, index) => (
        <View key={index} style={styles.painSiteCard}>
          <View style={styles.painSiteHeader}>
            <Text style={styles.painSiteBody}>{site.bodyPart}</Text>
            <View style={[
              styles.painLevelBadge,
              { backgroundColor: site.avgPainLevel >= 7 ? '#dc2626' : site.avgPainLevel >= 5 ? '#f59e0b' : '#3b82f6' }
            ]}>
              <Text style={styles.painLevelText}>{site.avgPainLevel.toFixed(1)}/10</Text>
            </View>
          </View>

          <View style={styles.painSiteStats}>
            <View style={styles.painStat}>
              <Ionicons name="repeat" size={14} color="#6b7280" />
              <Text style={styles.painStatText}>{site.occurrenceCount} times</Text>
            </View>
            <View style={styles.painStat}>
              <Ionicons name="calendar" size={14} color="#6b7280" />
              <Text style={styles.painStatText}>Last: {site.lastOccurrence}</Text>
            </View>
          </View>

          <View style={styles.painSiteBar}>
            <View style={[
              styles.painSiteBarFill,
              { 
                width: `${(site.avgPainLevel / 10) * 100}%`,
                backgroundColor: site.avgPainLevel >= 7 ? '#dc2626' : site.avgPainLevel >= 5 ? '#f59e0b' : '#3b82f6'
              }
            ]} />
          </View>
        </View>
      ))}

      {/* Joint Health Tracking */}
      <TouchableOpacity style={styles.logButton} onPress={() => setShowJointHealthModal(true)}>
        <Ionicons name="fitness" size={24} color="#fff" />
        <Text style={styles.logButtonText}>Log Joint Health</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMobility = () => (
    <View style={styles.section}>
      <View style={styles.comingSoonCard}>
        <Ionicons name="body" size={64} color="#6b7280" />
        <Text style={styles.comingSoonTitle}>Mobility Assessments</Text>
        <Text style={styles.comingSoonText}>
          Comprehensive mobility assessments coming soon. Track flexibility, range of motion, and functional movement patterns.
        </Text>
      </View>
    </View>
  );

  const renderRecommendations = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Preventive Recommendations</Text>
      
      {recommendations.map((rec) => (
        <View key={rec.id} style={styles.recommendationCard}>
          <View style={styles.recHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority) }]}>
              <Text style={styles.priorityText}>{rec.priority.toUpperCase()}</Text>
            </View>
            <View style={styles.urgencyBadge}>
              <Ionicons name="time" size={12} color="#6b7280" />
              <Text style={styles.urgencyText}>{rec.urgency.replace('_', ' ')}</Text>
            </View>
          </View>

          <Text style={styles.recTitle}>{rec.title}</Text>
          <Text style={styles.recTarget}>Target: {rec.targetBodyPart}</Text>
          <Text style={styles.recDescription}>{rec.description}</Text>

          <View style={styles.recDetails}>
            <View style={styles.recDetail}>
              <Ionicons name="repeat" size={14} color="#6b7280" />
              <Text style={styles.recDetailText}>{rec.frequency.replace('_', ' ')}</Text>
            </View>
            <View style={styles.recDetail}>
              <Ionicons name="trending-down" size={14} color="#10b981" />
              <Text style={[styles.recDetailText, { color: '#10b981' }]}>-{rec.riskReduction}% risk</Text>
            </View>
          </View>

          <View style={styles.recBenefit}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.recBenefitText}>{rec.expectedBenefit}</Text>
          </View>

          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Program</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading injury prevention data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Injury Prevention</Text>
        <Text style={styles.subtitle}>Stay healthy and train smart</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Ionicons 
            name="shield-checkmark" 
            size={20} 
            color={selectedTab === 'overview' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pain' && styles.tabActive]}
          onPress={() => setSelectedTab('pain')}
        >
          <Ionicons 
            name="alert-circle" 
            size={20} 
            color={selectedTab === 'pain' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'pain' && styles.tabTextActive]}>
            Pain
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'mobility' && styles.tabActive]}
          onPress={() => setSelectedTab('mobility')}
        >
          <Ionicons 
            name="body" 
            size={20} 
            color={selectedTab === 'mobility' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'mobility' && styles.tabTextActive]}>
            Mobility
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'recommendations' && styles.tabActive]}
          onPress={() => setSelectedTab('recommendations')}
        >
          <Ionicons 
            name="bulb" 
            size={20} 
            color={selectedTab === 'recommendations' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'recommendations' && styles.tabTextActive]}>
            Tips
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'pain' && renderPain()}
        {selectedTab === 'mobility' && renderMobility()}
        {selectedTab === 'recommendations' && renderRecommendations()}
      </ScrollView>

      {/* Pain Log Modal */}
      <Modal visible={showPainLogModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Pain</Text>
              <TouchableOpacity onPress={() => setShowPainLogModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Body Part *</Text>
              <TextInput
                style={styles.input}
                value={painLogForm.bodyPart}
                onChangeText={(text) => setPainLogForm({ ...painLogForm, bodyPart: text })}
                placeholder="e.g., Right Shoulder, Lower Back"
              />

              <Text style={styles.inputLabel}>Pain Level (0-10) *</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{painLogForm.painLevel}</Text>
              </View>

              <Text style={styles.inputLabel}>Pain Type</Text>
              <TextInput
                style={styles.input}
                value={painLogForm.painType}
                onChangeText={(text) => setPainLogForm({ ...painLogForm, painType: text })}
                placeholder="e.g., sharp, dull, aching"
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={painLogForm.notes}
                onChangeText={(text) => setPainLogForm({ ...painLogForm, notes: text })}
                placeholder="Additional details..."
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleLogPain}>
                <Text style={styles.submitButtonText}>Log Pain</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Joint Health Modal */}
      <Modal visible={showJointHealthModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Joint Health</Text>
              <TouchableOpacity onPress={() => setShowJointHealthModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Joint *</Text>
              <TextInput
                style={styles.input}
                value={jointHealthForm.jointName}
                onChangeText={(text) => setJointHealthForm({ ...jointHealthForm, jointName: text })}
                placeholder="e.g., knee_right, shoulder_left"
              />

              <Text style={styles.inputLabel}>Pain Level (0-10)</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{jointHealthForm.painLevel}</Text>
              </View>

              <Text style={styles.inputLabel}>Range of Motion (%)</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{jointHealthForm.rangeOfMotion}%</Text>
              </View>

              <Text style={styles.inputLabel}>Stiffness (0-10)</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{jointHealthForm.stiffness}</Text>
              </View>

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={jointHealthForm.notes}
                onChangeText={(text) => setJointHealthForm({ ...jointHealthForm, notes: text })}
                placeholder="Additional details..."
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleLogJointHealth}>
                <Text style={styles.submitButtonText}>Log Joint Health</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  riskDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  componentsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  componentLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 100,
  },
  componentText: {
    fontSize: 13,
    color: '#374151',
  },
  componentBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  componentBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  componentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    width: 30,
    textAlign: 'right',
  },
  areasCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  areaText: {
    fontSize: 14,
    color: '#374151',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  painSiteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  painSiteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  painSiteBody: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  painLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  painLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  painSiteStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  painStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  painStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  painSiteBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  painSiteBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 10,
    color: '#6b7280',
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  recTarget: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  recDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  recDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  recDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  recBenefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginBottom: 12,
  },
  recBenefitText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
  startButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sliderContainer: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
