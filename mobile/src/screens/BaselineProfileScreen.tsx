import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getBaselineProfile, updateBaselineProfile } from '../services/healthDataHubService';
import type { BaselineProfileData } from '../types/healthDataHub';

export default function BaselineProfileScreen() {
  const [profile, setProfile] = useState<BaselineProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getBaselineProfile();
      setProfile(data || {
        demographics: {},
        healthGoals: [],
        sexualHealthGoals: [],
        workoutGoals: [],
        secondaryGoals: [],
        completionPercentage: 0,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      const success = await updateBaselineProfile(profile);
      if (success) {
        Alert.alert('Success', 'Profile updated successfully');
        setEditMode(false);
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Baseline Profile</Text>
        <Text style={styles.subtitle}>
          Your foundational health information
        </Text>
        {profile && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${profile.completionPercentage}%` },
              ]}
            />
          </View>
        )}
        <Text style={styles.progressText}>
          {profile?.completionPercentage || 0}% Complete
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demographics</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={profile?.demographics?.age?.toString() || ''}
            editable={editMode}
            keyboardType="numeric"
            placeholder="Enter age"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <TextInput
            style={styles.input}
            value={profile?.demographics?.gender || ''}
            editable={editMode}
            placeholder="Enter gender"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Height (inches)</Text>
          <TextInput
            style={styles.input}
            value={profile?.demographics?.height?.toString() || ''}
            editable={editMode}
            keyboardType="numeric"
            placeholder="Enter height"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            value={profile?.demographics?.weight?.toString() || ''}
            editable={editMode}
            keyboardType="numeric"
            placeholder="Enter weight"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Health Goals</Text>
        <Text style={styles.helperText}>
          What are your primary health objectives?
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile?.healthGoals?.join(', ') || ''}
          editable={editMode}
          multiline
          numberOfLines={3}
          placeholder="e.g., Improve energy, Build muscle, Reduce stress"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sexual Health Goals</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile?.sexualHealthGoals?.join(', ') || ''}
          editable={editMode}
          multiline
          numberOfLines={3}
          placeholder="Enter sexual health goals"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Goals</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile?.workoutGoals?.join(', ') || ''}
          editable={editMode}
          multiline
          numberOfLines={3}
          placeholder="e.g., Increase strength, Improve endurance"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Secondary Goals</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile?.secondaryGoals?.join(', ') || ''}
          editable={editMode}
          multiline
          numberOfLines={3}
          placeholder="Enter secondary goals"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training Context</Text>
        <Text style={styles.helperText}>
          Describe your training history and experience
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile?.trainingContext || ''}
          editable={editMode}
          multiline
          numberOfLines={4}
          placeholder="e.g., 5 years lifting, currently doing PPL split"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lifestyle Context</Text>
        <Text style={styles.helperText}>
          Describe your daily routine, work schedule, stress levels
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile?.lifestyleContext || ''}
          editable={editMode}
          multiline
          numberOfLines={4}
          placeholder="e.g., Desk job, high stress, sleep 6-7 hours"
        />
      </View>

      <View style={styles.actions}>
        {!editMode ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setEditMode(true)}
          >
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setEditMode(false);
                loadProfile();
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
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
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    padding: 20,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
