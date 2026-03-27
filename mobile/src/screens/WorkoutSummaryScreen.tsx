import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutBaseline } from '../types/workoutDocument';

type Props = NativeStackScreenProps<any, 'WorkoutSummary'>;

const WorkoutSummaryScreen: React.FC<Props> = ({ route, navigation }) => {
  const { baseline } = route.params as { baseline: WorkoutBaseline };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 mb-3">{title}</Text>
      {children}
    </View>
  );

  const renderField = (label: string, value?: string | number | null) => {
    if (!value) return null;
    return (
      <View className="mb-2">
        <Text className="text-sm font-medium text-gray-600">{label}</Text>
        <Text className="text-sm text-gray-900">{value}</Text>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Workout Baseline Summary
          </Text>
          <Text className="text-sm text-gray-600">
            Your structured workout program details
          </Text>
        </View>

        {/* Program Structure */}
        {renderSection('Program Structure', (
          <View className="bg-white p-4 rounded-lg">
            {renderField('Program Name', baseline.programName)}
            {renderField('Split Name', baseline.splitName)}
            {renderField('Workout Days Per Week', baseline.workoutDaysPerWeek)}
            {renderField('Rest Days Per Week', baseline.restDaysPerWeek)}
            {renderField('Training Style', baseline.trainingStyle)}
            {baseline.programNotes && (
              <View className="mt-3">
                <Text className="text-sm font-medium text-gray-600">Program Notes</Text>
                <Text className="text-sm text-gray-900">{baseline.programNotes}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Weekly Schedule */}
        {renderSection('Weekly Schedule', (
          <View className="bg-white p-4 rounded-lg">
            {[
              { day: 'Monday', plan: baseline.mondayPlan },
              { day: 'Tuesday', plan: baseline.tuesdayPlan },
              { day: 'Wednesday', plan: baseline.wednesdayPlan },
              { day: 'Thursday', plan: baseline.thursdayPlan },
              { day: 'Friday', plan: baseline.fridayPlan },
              { day: 'Saturday', plan: baseline.saturdayPlan },
              { day: 'Sunday', plan: baseline.sundayPlan },
            ].map(({ day, plan }) => (
              plan && (
                <View key={day} className="mb-3">
                  <Text className="text-sm font-medium text-gray-600">{day}</Text>
                  <Text className="text-sm text-gray-900">{plan}</Text>
                </View>
              )
            ))}
          </View>
        ))}

        {/* Workout Context */}
        {renderSection('Workout Context', (
          <View className="bg-white p-4 rounded-lg">
            {baseline.muscleGroupFocus && baseline.muscleGroupFocus.length > 0 && (
              <View className="mb-3">
                <Text className="text-sm font-medium text-gray-600">Muscle Group Focus</Text>
                <Text className="text-sm text-gray-900">{baseline.muscleGroupFocus.join(', ')}</Text>
              </View>
            )}
            
            {baseline.frequencyByMuscleGroup && Object.keys(baseline.frequencyByMuscleGroup).length > 0 && (
              <View className="mb-3">
                <Text className="text-sm font-medium text-gray-600">Frequency by Muscle Group</Text>
                {Object.entries(baseline.frequencyByMuscleGroup).map(([muscle, frequency]) => (
                  <Text key={muscle} className="text-sm text-gray-900">
                    {muscle}: {frequency}x/week
                  </Text>
                ))}
              </View>
            )}
            
            {renderField('Planned Volume Notes', baseline.plannedVolumeNotes)}
            {renderField('Planned Intensity Notes', baseline.plannedIntensityNotes)}
            {renderField('Cardio/Conditioning Notes', baseline.cardioOrConditioningNotes)}
            {renderField('Mobility/Recovery Notes', baseline.mobilityOrRecoveryNotes)}
          </View>
        ))}

        {/* Exercise Layer */}
        {baseline.exercises && baseline.exercises.length > 0 && renderSection('Exercise Details', (
          <View className="bg-white p-4 rounded-lg">
            {baseline.exercises.map((exercise, index) => (
              <View key={index} className="mb-3 pb-3 border-b border-gray-200 last:border-b-0">
                <Text className="text-sm font-medium text-gray-900">{exercise.name}</Text>
                <Text className="text-sm text-gray-600">Day: {exercise.dayAssociation}</Text>
                {exercise.setRepLoadNotes && (
                  <Text className="text-sm text-gray-700">{exercise.setRepLoadNotes}</Text>
                )}
                {exercise.grouping && (
                  <Text className="text-sm text-gray-700">Group: {exercise.grouping}</Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Metadata */}
        {renderSection('Upload Information', (
          <View className="bg-white p-4 rounded-lg">
            <View className="mb-2">
              <Text className="text-sm font-medium text-gray-600">Document ID</Text>
              <Text className="text-xs text-gray-900">{baseline.documentId}</Text>
            </View>
            <View className="mb-2">
              <Text className="text-sm font-medium text-gray-600">Extracted On</Text>
              <Text className="text-sm text-gray-900">
                {new Date(baseline.extractedAt).toLocaleDateString()}
              </Text>
            </View>
            <View className="mb-2">
              <Text className="text-sm font-medium text-gray-600">Last Updated</Text>
              <Text className="text-sm text-gray-900">
                {new Date(baseline.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}

        {/* Action Buttons */}
        <View className="mt-6 space-y-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-gray-200 py-3 px-4 rounded-md"
          >
            <Text className="text-center text-gray-800 font-medium">Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('WorkoutUpload')}
            className="bg-blue-600 py-3 px-4 rounded-md"
          >
            <Text className="text-center text-white font-medium">Upload New Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default WorkoutSummaryScreen;
