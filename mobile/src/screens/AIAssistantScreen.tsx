import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useUser } from '../context/UserContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface Recommendation {
  title: string;
  description: string;
  priority: string;
  category: string;
  actionSteps?: string[];
}

interface HealthAnalysis {
  observations?: string[];
  concerns?: string[];
  positives?: string[];
  recommendations?: string[];
}

const AIAssistantScreen: React.FC = () => {
  const { userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendations'>('analysis');
  const [healthAnalysis, setHealthAnalysis] = useState<HealthAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, activeTab, selectedCategory]);

  const loadData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      if (activeTab === 'analysis') {
        await loadHealthAnalysis();
      } else {
        await loadRecommendations();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHealthAnalysis = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-agent/${userId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setHealthAnalysis(data.data);
      }
    } catch (error) {
      console.error('Failed to load health analysis:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const url = selectedCategory
        ? `${API_BASE_URL}/api/ai-agent/${userId}/recommendations?category=${selectedCategory}`
        : `${API_BASE_URL}/api/ai-agent/${userId}/recommendations`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.data) {
        setRecommendations(data.data);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const categories = ['recovery', 'nutrition', 'workout', 'stress', 'metabolic', 'cardiovascular'];

  if (!userId) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please set your user ID in Settings</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Health Insights</Text>
        <Text style={styles.headerSubtitle}>Personalized analysis and recommendations</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
          onPress={() => setActiveTab('analysis')}
        >
          <Text style={[styles.tabText, activeTab === 'analysis' && styles.activeTabText]}>
            Analysis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
            Recommendations
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'recommendations' && (
        <ScrollView
          horizontal
          style={styles.categoryContainer}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Analyzing your health data...</Text>
          </View>
        ) : activeTab === 'analysis' ? (
          <View style={styles.analysisContainer}>
            {healthAnalysis?.observations && healthAnalysis.observations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔍 Key Observations</Text>
                {healthAnalysis.observations.map((obs, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{obs}</Text>
                  </View>
                ))}
              </View>
            )}

            {healthAnalysis?.positives && healthAnalysis.positives.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ Positive Trends</Text>
                {healthAnalysis.positives.map((pos, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{pos}</Text>
                  </View>
                ))}
              </View>
            )}

            {healthAnalysis?.concerns && healthAnalysis.concerns.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ Areas of Concern</Text>
                {healthAnalysis.concerns.map((concern, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{concern}</Text>
                  </View>
                ))}
              </View>
            )}

            {healthAnalysis?.recommendations && healthAnalysis.recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Recommendations</Text>
                {healthAnalysis.recommendations.map((rec, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {!healthAnalysis && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>🤖</Text>
                <Text style={styles.emptyStateText}>
                  Pull down to generate your personalized health analysis
                </Text>
              </View>
            )}

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                ⚕️ This is general health information. Consult a healthcare provider for medical
                advice.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.recommendationsContainer}>
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        rec.priority === 'high' && styles.priorityHigh,
                        rec.priority === 'medium' && styles.priorityMedium,
                        rec.priority === 'low' && styles.priorityLow,
                      ]}
                    >
                      <Text style={styles.priorityText}>
                        {rec.priority?.toUpperCase() || 'MEDIUM'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.categoryBadge}>{rec.category}</Text>
                  <Text style={styles.recommendationDescription}>{rec.description}</Text>
                  {rec.actionSteps && rec.actionSteps.length > 0 && (
                    <View style={styles.actionSteps}>
                      <Text style={styles.actionStepsTitle}>Action Steps:</Text>
                      {rec.actionSteps.map((step, stepIndex) => (
                        <View key={stepIndex} style={styles.actionStep}>
                          <Text style={styles.actionStepNumber}>{stepIndex + 1}.</Text>
                          <Text style={styles.actionStepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>💡</Text>
                <Text style={styles.emptyStateText}>
                  Pull down to generate personalized recommendations
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#2563EB',
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  analysisContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#2563EB',
    marginRight: 8,
    fontWeight: '700',
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  disclaimer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  recommendationsContainer: {
    padding: 16,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityMedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityLow: {
    backgroundColor: '#DBEAFE',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
  },
  categoryBadge: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionSteps: {
    marginTop: 8,
  },
  actionStepsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  actionStep: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  actionStepNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    marginRight: 6,
  },
  actionStepText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default AIAssistantScreen;
