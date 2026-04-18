import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

interface Goal {
  id: string;
  goalName: string;
  category: string;
  progress: number;
  daysRemaining: number;
  onTrack: boolean;
  targetDate: string;
  status: string;
}

interface GoalTemplate {
  id: string;
  templateName: string;
  category: string;
  description: string;
  difficultyLevel: string;
  defaultDurationDays: number;
  successTips: string[];
}

interface Milestone {
  id: string;
  milestoneName: string;
  milestonePercentage: number;
  achieved: boolean;
  achievedDate?: string;
  celebrationMessage?: string;
  celebrationEmoji?: string;
}

interface Achievement {
  id: string;
  achievementName: string;
  achievementType: string;
  achievementDate: string;
  badgeIcon: string;
  celebrationMessage: string;
  pointsEarned: number;
}

export default function GoalManagementScreen() {
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'active' | 'templates' | 'achievements'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [celebrationData, setCelebrationData] = useState<Achievement | null>(null);
  const [creating, setCreating] = useState(false);

  // Real data from API
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  // Custom goal form state
  const [customGoalName, setCustomGoalName] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customTargetDate, setCustomTargetDate] = useState('');
  const [customMotivation, setCustomMotivation] = useState('');

  const [goalStats, setGoalStats] = useState({
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    completionRate: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    if (userId) {
      loadGoalData();
    }
  }, [userId]);

  const loadGoalData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Load templates
      const templatesResponse = await healthApi.goals.getTemplates();
      if (templatesResponse.data?.data) {
        setTemplates(templatesResponse.data.data);
      }

      // Load active goals
      const goalsResponse = await healthApi.goals.getActive(userId);
      if (goalsResponse.data?.data) {
        const goals = goalsResponse.data.data || [];
        setActiveGoals(goals);
        
        // Update stats
        setGoalStats({
          totalGoals: goals.length,
          activeGoals: goals.filter((g: any) => g.status === 'active').length,
          completedGoals: goals.filter((g: any) => g.status === 'completed').length,
          completionRate: goals.length > 0 ? Math.round((goals.filter((g: any) => g.status === 'completed').length / goals.length) * 100) : 0,
          totalPoints: goals.reduce((sum: number, g: any) => sum + (g.pointsEarned || 0), 0),
        });
      }

      // Load achievements (from goal progress)
      // For now, achievements are derived from goal milestones
      const achievementsList: Achievement[] = [];
      const goals = goalsResponse.data?.data || [];
      goals.forEach((goal: any) => {
        if (goal.milestones) {
          goal.milestones.filter((m: any) => m.achieved).forEach((milestone: any) => {
            achievementsList.push({
              id: milestone.id,
              achievementName: `${milestone.milestoneName} - ${goal.goalName}`,
              achievementType: 'milestone_reached',
              achievementDate: milestone.achievedDate,
              badgeIcon: milestone.celebrationEmoji || '🎉',
              celebrationMessage: milestone.celebrationMessage || 'Great job!',
              pointsEarned: milestone.pointsEarned || 10,
            });
          });
        }
      });
      setAchievements(achievementsList);
    } catch (error) {
      console.error('Error loading goal data:', error);
      Alert.alert('Error', 'Failed to load goal data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      weight_loss: '#ef4444',
      muscle_gain: '#10b981',
      strength: '#f59e0b',
      endurance: '#3b82f6',
      health: '#8b5cf6',
      performance: '#ec4899',
    };
    return colorMap[category] || '#6b7280';
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      weight_loss: 'trending-down',
      muscle_gain: 'fitness',
      strength: 'barbell',
      endurance: 'bicycle',
      health: 'heart',
      performance: 'flash',
    };
    return iconMap[category] || 'flag';
  };

  const getDifficultyColor = (level: string) => {
    const colorMap: { [key: string]: string } = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444',
      expert: '#dc2626',
    };
    return colorMap[level] || '#6b7280';
  };

  const handleCreateFromTemplate = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleTemplateSubmit = async () => {
    if (!userId || !selectedTemplate) return;
    
    setCreating(true);
    try {
      const response = await healthApi.goals.createFromTemplate(userId, {
        templateId: selectedTemplate.id,
        customizations: {
          goalName: selectedTemplate.templateName,
          targetDate: new Date(Date.now() + selectedTemplate.defaultDurationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      });
      
      if (response.data) {
        Alert.alert('Success', 'Goal created successfully!');
        setShowTemplateModal(false);
        setSelectedTemplate(null);
        // Reload goals
        await loadGoalData();
      }
    } catch (error) {
      console.error('Error creating goal from template:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCustomGoalSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID required');
      return;
    }
    
    if (!customGoalName || !customCategory || !customTargetDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setCreating(true);
    try {
      const response = await healthApi.goals.createCustom(userId, {
        goalData: {
          goalName: customGoalName,
          goalCategory: customCategory,
          targetDate: customTargetDate,
          description: customMotivation,
        },
        metrics: [],
      });
      
      if (response.data) {
        Alert.alert('Success', 'Goal created successfully!');
        setShowCreateModal(false);
        // Clear form
        setCustomGoalName('');
        setCustomCategory('');
        setCustomTargetDate('');
        setCustomMotivation('');
        // Reload goals
        await loadGoalData();
      }
    } catch (error) {
      console.error('Error creating custom goal:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderActiveGoals = () => (
    <View style={styles.section}>
      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{goalStats.activeGoals}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{goalStats.completedGoals}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{goalStats.completionRate}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{goalStats.totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      {/* Active Goals */}
      <Text style={styles.sectionTitle}>Active Goals</Text>
      {activeGoals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="flag-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>No active goals</Text>
          <Text style={styles.emptyStateText}>Create your first goal to start tracking your progress</Text>
        </View>
      ) : (
        activeGoals.map((goal) => (
        <TouchableOpacity key={goal.id} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleRow}>
              <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(goal.category) }]}>
                <Ionicons name={getCategoryIcon(goal.category) as any} size={20} color="#fff" />
              </View>
              <View style={styles.goalTitleContainer}>
                <Text style={styles.goalName}>{goal.goalName}</Text>
                <Text style={styles.goalCategory}>{goal.category.replace('_', ' ')}</Text>
              </View>
            </View>
            {goal.onTrack && (
              <View style={styles.onTrackBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.onTrackText}>On Track</Text>
              </View>
            )}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressBarFill, { width: `${goal.progress}%`, backgroundColor: getCategoryColor(goal.category) }]} />
            </View>
            <Text style={styles.progressText}>{goal.progress}%</Text>
          </View>

          <View style={styles.goalFooter}>
            <View style={styles.goalStat}>
              <Ionicons name="calendar" size={14} color="#6b7280" />
              <Text style={styles.goalStatText}>{goal.daysRemaining} days left</Text>
            </View>
            <View style={styles.goalStat}>
              <Ionicons name="flag" size={14} color="#6b7280" />
              <Text style={styles.goalStatText}>{goal.targetDate}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))
      )}

      {/* Create Goal Button */}
      <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.createButtonText}>Create New Goal</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTemplates = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Goal Templates</Text>
      <Text style={styles.sectionSubtitle}>Choose a template to get started quickly</Text>

      {templates.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="apps-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>No templates available</Text>
          <Text style={styles.emptyStateText}>Check back later for new goal templates</Text>
        </View>
      ) : (
        templates.map((template) => (
        <View key={template.id} style={styles.templateCard}>
          <View style={styles.templateHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(template.category) }]}>
              <Ionicons name={getCategoryIcon(template.category) as any} size={20} color="#fff" />
            </View>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{template.templateName}</Text>
              <Text style={styles.templateCategory}>{template.category.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(template.difficultyLevel) }]}>
              <Text style={styles.difficultyText}>{template.difficultyLevel}</Text>
            </View>
          </View>

          <Text style={styles.templateDescription}>{template.description}</Text>

          <View style={styles.templateDetails}>
            <View style={styles.templateDetail}>
              <Ionicons name="time" size={14} color="#6b7280" />
              <Text style={styles.templateDetailText}>{template.defaultDurationDays} days</Text>
            </View>
          </View>

          <View style={styles.successTips}>
            <Text style={styles.successTipsTitle}>Success Tips:</Text>
            {template.successTips.slice(0, 2).map((tip, index) => (
              <Text key={index} style={styles.successTip}>• {tip}</Text>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.useTemplateButton, { backgroundColor: getCategoryColor(template.category) }]}
            onPress={() => handleCreateFromTemplate(template)}
          >
            <Text style={styles.useTemplateButtonText}>Use This Template</Text>
          </TouchableOpacity>
        </View>
      ))
      )}
    </View>
  );

  const renderAchievements = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <Text style={styles.sectionSubtitle}>Celebrate your progress!</Text>

      {achievements.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>No achievements yet</Text>
          <Text style={styles.emptyStateText}>Complete milestones to earn achievements</Text>
        </View>
      ) : (
        achievements.map((achievement) => (
        <View key={achievement.id} style={styles.achievementCard}>
          <View style={styles.achievementHeader}>
            <Text style={styles.achievementEmoji}>{achievement.badgeIcon}</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>{achievement.achievementName}</Text>
              <Text style={styles.achievementDate}>{achievement.achievementDate}</Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>+{achievement.pointsEarned}</Text>
            </View>
          </View>

          <Text style={styles.celebrationMessage}>{achievement.celebrationMessage}</Text>
        </View>
      ))
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <Text style={styles.subtitle}>Track your progress and celebrate wins</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => setSelectedTab('active')}
        >
          <Ionicons name="flag" size={20} color={selectedTab === 'active' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>Active</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'templates' && styles.tabActive]}
          onPress={() => setSelectedTab('templates')}
        >
          <Ionicons name="apps" size={20} color={selectedTab === 'templates' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, selectedTab === 'templates' && styles.tabTextActive]}>Templates</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'achievements' && styles.tabActive]}
          onPress={() => setSelectedTab('achievements')}
        >
          <Ionicons name="trophy" size={20} color={selectedTab === 'achievements' ? '#3b82f6' : '#6b7280'} />
          <Text style={[styles.tabText, selectedTab === 'achievements' && styles.tabTextActive]}>Achievements</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'active' && renderActiveGoals()}
        {selectedTab === 'templates' && renderTemplates()}
        {selectedTab === 'achievements' && renderAchievements()}
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Custom Goal</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Goal Name *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g., Lose 10 pounds"
                value={customGoalName}
                onChangeText={setCustomGoalName}
              />

              <Text style={styles.inputLabel}>Category *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g., weight_loss"
                value={customCategory}
                onChangeText={setCustomCategory}
              />

              <Text style={styles.inputLabel}>Target Date *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="YYYY-MM-DD"
                value={customTargetDate}
                onChangeText={setCustomTargetDate}
              />

              <Text style={styles.inputLabel}>Why is this important to you?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Your personal motivation..."
                multiline
                numberOfLines={4}
                value={customMotivation}
                onChangeText={setCustomMotivation}
              />

              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleCustomGoalSubmit}
                disabled={creating}
              >
                <Text style={styles.submitButtonText}>
                  {creating ? 'Creating...' : 'Create Goal'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Template Modal */}
      <Modal visible={showTemplateModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize Your Goal</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedTemplate && (
              <ScrollView>
                <Text style={styles.templateModalName}>{selectedTemplate.templateName}</Text>
                <Text style={styles.templateModalDescription}>{selectedTemplate.description}</Text>

                <Text style={styles.inputLabel}>Goal Name</Text>
                <TextInput style={styles.input} defaultValue={selectedTemplate.templateName} />

                <Text style={styles.inputLabel}>Target Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  defaultValue={
                    new Date(Date.now() + selectedTemplate.defaultDurationDays * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0]
                  }
                />

                <Text style={styles.inputLabel}>Why is this important to you?</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Your personal motivation..."
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleTemplateSubmit}
                  disabled={creating}
                >
                  <Text style={styles.submitButtonText}>
                    {creating ? 'Creating...' : 'Create Goal'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Celebration Modal */}
      <Modal visible={showCelebrationModal} animationType="fade" transparent={true}>
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>Milestone Achieved!</Text>
            {celebrationData && (
              <>
                <Text style={styles.celebrationMessage}>{celebrationData.celebrationMessage}</Text>
                <Text style={styles.celebrationPoints}>+{celebrationData.pointsEarned} points</Text>
              </>
            )}
            <TouchableOpacity style={styles.celebrationButton} onPress={() => setShowCelebrationModal(false)}>
              <Text style={styles.celebrationButtonText}>Awesome!</Text>
            </TouchableOpacity>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
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
    fontSize: 12,
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
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  goalCategory: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  onTrackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  onTrackText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
    textAlign: 'right',
  },
  goalFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  goalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  templateCard: {
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
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  templateCategory: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  templateDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  templateDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  templateDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  successTips: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  successTipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  successTip: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 2,
  },
  useTemplateButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  useTemplateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  achievementCard: {
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
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  achievementEmoji: {
    fontSize: 40,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  pointsBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
  },
  celebrationMessage: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
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
  templateModalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  templateModalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
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
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  celebrationPoints: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f59e0b',
    marginTop: 8,
  },
  celebrationButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  celebrationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
