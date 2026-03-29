import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutUploadScreen() {
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

      const result = await uploadWorkoutDocument(
        'current-user', // This should come from auth context
        documentType,
        manualWorkoutData,
        undefined, // fileReference
        undefined, // storagePath
        programStartDate || undefined,
        notes || undefined
      );

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
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Upload Workout Baseline
        </Text>

        {/* Document Type */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Document Type</Text>
          <Text className="text-sm text-gray-600">Manual Entry</Text>
        </View>

        {/* Program Structure */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Program Structure</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Program Name *</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={programName}
              onChangeText={setProgramName}
              placeholder="e.g., Push-Pull-Legs, Upper-Lower Split"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Split Name</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={splitName}
              onChangeText={setSplitName}
              placeholder="e.g., 4-Day Upper/Lower, 3-Day Full Body"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Workout Days Per Week *</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={workoutDaysPerWeek}
              onChangeText={setWorkoutDaysPerWeek}
              placeholder="e.g., 3, 4, 5"
              keyboardType="numeric"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Rest Days Per Week</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={restDaysPerWeek}
              onChangeText={setRestDaysPerWeek}
              placeholder="e.g., 2, 3, 4"
              keyboardType="numeric"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Training Style *</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={trainingStyle}
              onChangeText={setTrainingStyle}
              placeholder="e.g., Strength Training, Hypertrophy, Powerlifting"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Program Notes</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white h-20"
              value={programNotes}
              onChangeText={setProgramNotes}
              placeholder="Additional notes about the program..."
              multiline
            />
          </View>
        </View>

        {/* Weekly Schedule */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Weekly Schedule</Text>
          
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
            <View key={day} className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">{day}</Text>
              <TextInput
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
                value={
                  [mondayPlan, tuesdayPlan, wednesdayPlan, thursdayPlan, fridayPlan, saturdayPlan, sundayPlan][index]
                }
                onChangeText={(text) => {
                  const setters = [
                    setMondayPlan, setTuesdayPlan, setWednesdayPlan,
                    setThursdayPlan, setFridayPlan, setSaturdayPlan, setSundayPlan
                  ];
                  setters[index](text);
                }}
                placeholder={`e.g., Upper Body, Lower Body, Rest`}
              />
            </View>
          ))}
        </View>

        {/* Workout Context */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Workout Context</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Planned Volume Notes</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white h-16"
              value={plannedVolumeNotes}
              onChangeText={setPlannedVolumeNotes}
              placeholder="e.g., 3-4 sets per exercise, 8-12 reps..."
              multiline
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Planned Intensity Notes</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white h-16"
              value={plannedIntensityNotes}
              onChangeText={setPlannedIntensityNotes}
              placeholder="e.g., RPE 7-8, Progressive overload..."
              multiline
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Cardio/Conditioning Notes</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white h-16"
              value={cardioOrConditioningNotes}
              onChangeText={setCardioOrConditioningNotes}
              placeholder="e.g., 20 min LISS post-workout, HIIT 2x/week..."
              multiline
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Mobility/Recovery Notes</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white h-16"
              value={mobilityOrRecoveryNotes}
              onChangeText={setMobilityOrRecoveryNotes}
              placeholder="e.g., 10 min stretching, foam rolling..."
              multiline
            />
          </View>
        </View>

        {/* Additional Options */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Additional Options</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Program Start Date</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={programStartDate}
              onChangeText={setProgramStartDate}
              placeholder="YYYY-MM-DD (optional)"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Notes</Text>
            <TextInput
              className="border border-gray-300 rounded-md px-3 py-2 bg-white h-16"
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes about this upload..."
              multiline
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-blue-600 py-3 px-4 rounded-md items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Upload Workout Baseline</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default WorkoutUploadScreen;
