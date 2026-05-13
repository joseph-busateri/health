import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { uploadWorkoutDocument } from '../services/workoutDocumentService';
import type { ManualWorkoutData } from '../types/workoutDocument';
import type { RootStackParamList } from '../types/navigation';
import { useUser, DEFAULT_USER_ID } from '../context/UserContext';

const WorkoutUploadScreen = () => {
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState('manual_entry');
  const [programStartDate, setProgramStartDate] = useState('');
  const [notes, setNotes] = useState('');

  // Program Structure
  const [programName, setProgramName] = useState('');
  const [splitName, setSplitName] = useState('');
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState('');
  const [restDaysPerWeek, setRestDaysPerWeek] = useState('');
  const [trainingStyle, setTrainingStyle] = useState('');
  const [programNotes, setProgramNotes] = useState('');
  
  // Weekly Schedule
  const [mondayPlan, setMondayPlan] = useState('');
  const [tuesdayPlan, setTuesdayPlan] = useState('');
  const [wednesdayPlan, setWednesdayPlan] = useState('');
  const [thursdayPlan, setThursdayPlan] = useState('');
  const [fridayPlan, setFridayPlan] = useState('');
  const [saturdayPlan, setSaturdayPlan] = useState('');
  const [sundayPlan, setSundayPlan] = useState('');
  
  // Workout Context
  const [plannedVolumeNotes, setPlannedVolumeNotes] = useState('');
  const [plannedIntensityNotes, setPlannedIntensityNotes] = useState('');
  const [cardioOrConditioningNotes, setCardioOrConditioningNotes] = useState('');
  const [mobilityOrRecoveryNotes, setMobilityOrRecoveryNotes] = useState('');

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useUser();
  const resolvedUserId = userId ?? DEFAULT_USER_ID;

  const weeklyPlans = useMemo(
    () => [
      { label: 'Monday', value: mondayPlan, setter: setMondayPlan },
      { label: 'Tuesday', value: tuesdayPlan, setter: setTuesdayPlan },
      { label: 'Wednesday', value: wednesdayPlan, setter: setWednesdayPlan },
      { label: 'Thursday', value: thursdayPlan, setter: setThursdayPlan },
      { label: 'Friday', value: fridayPlan, setter: setFridayPlan },
      { label: 'Saturday', value: saturdayPlan, setter: setSaturdayPlan },
      { label: 'Sunday', value: sundayPlan, setter: setSundayPlan },
    ],
    [
      fridayPlan,
      mondayPlan,
      saturdayPlan,
      sundayPlan,
      thursdayPlan,
      tuesdayPlan,
      wednesdayPlan,
    ],
  );

  const handleSubmit = async () => {
    if (!programName || !workoutDaysPerWeek || !trainingStyle) {
      Alert.alert('Missing Required Fields', 'Please fill in program name, workout days per week, and training style.');
      return;
    }

    setLoading(true);

    try {
      const manualWorkoutData: ManualWorkoutData = {
        programName,
        splitName,
        workoutDaysPerWeek: parseInt(workoutDaysPerWeek),
        restDaysPerWeek: restDaysPerWeek ? parseInt(restDaysPerWeek) : undefined,
        trainingStyle,
        programNotes,
        mondayPlan,
        tuesdayPlan,
        wednesdayPlan,
        thursdayPlan,
        fridayPlan,
        saturdayPlan,
        sundayPlan,
        plannedVolumeNotes,
        plannedIntensityNotes,
        cardioOrConditioningNotes,
        mobilityOrRecoveryNotes,
      };

      const result = await uploadWorkoutDocument({
        userId: resolvedUserId,
        documentType,
        manualWorkoutData,
        programStartDate: programStartDate || undefined,
        notes: notes || undefined,
      });

      Alert.alert(
        'Success',
        'Workout baseline uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('WorkoutSummary', { baseline: result.baseline });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upload workout baseline. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Upload Workout Baseline</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Document Type</Text>
          <Text style={styles.helperText}>Manual Entry</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Program Structure</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Program Name *</Text>
            <TextInput
              style={styles.input}
              value={programName}
              onChangeText={setProgramName}
              placeholder="e.g., Push-Pull-Legs, Upper-Lower Split"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Split Name</Text>
            <TextInput
              style={styles.input}
              value={splitName}
              onChangeText={setSplitName}
              placeholder="e.g., 4-Day Upper/Lower, 3-Day Full Body"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Workout Days Per Week *</Text>
            <TextInput
              style={styles.input}
              value={workoutDaysPerWeek}
              onChangeText={setWorkoutDaysPerWeek}
              placeholder="e.g., 3, 4, 5"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Rest Days Per Week</Text>
            <TextInput
              style={styles.input}
              value={restDaysPerWeek}
              onChangeText={setRestDaysPerWeek}
              placeholder="e.g., 2, 3, 4"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Training Style *</Text>
            <TextInput
              style={styles.input}
              value={trainingStyle}
              onChangeText={setTrainingStyle}
              placeholder="e.g., Strength Training, Hypertrophy, Powerlifting"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Program Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, styles.inputTall]}
              value={programNotes}
              onChangeText={setProgramNotes}
              placeholder="Additional notes about the program..."
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>

          {weeklyPlans.map(plan => (
            <View key={plan.label} style={styles.fieldTight}>
              <Text style={styles.label}>{plan.label}</Text>
              <TextInput
                style={styles.input}
                value={plan.value}
                onChangeText={plan.setter}
                placeholder="e.g., Upper Body, Lower Body, Rest"
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Context</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Planned Volume Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={plannedVolumeNotes}
              onChangeText={setPlannedVolumeNotes}
              placeholder="e.g., 3-4 sets per exercise, 8-12 reps..."
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Planned Intensity Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={plannedIntensityNotes}
              onChangeText={setPlannedIntensityNotes}
              placeholder="e.g., RPE 7-8, Progressive overload..."
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cardio/Conditioning Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={cardioOrConditioningNotes}
              onChangeText={setCardioOrConditioningNotes}
              placeholder="e.g., 20 min LISS post-workout, HIIT 2x/week..."
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mobility/Recovery Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={mobilityOrRecoveryNotes}
              onChangeText={setMobilityOrRecoveryNotes}
              placeholder="e.g., 10 min stretching, foam rolling..."
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Options</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Program Start Date</Text>
            <TextInput
              style={styles.input}
              value={programStartDate}
              onChangeText={setProgramStartDate}
              placeholder="YYYY-MM-DD (optional)"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes about this upload..."
              multiline
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Upload Workout Baseline</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutUploadScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  helperText: {
    fontSize: 14,
    color: '#4B5563',
  },
  field: {
    gap: 6,
  },
  fieldTight: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#111827',
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  inputTall: {
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
});
