import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from '../types/navigation';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealLogData {
  mealType: MealType;
  description: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  notes: string;
}

export default function MealLogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [mealData, setMealData] = useState<MealLogData>({
    mealType: 'breakfast',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    notes: '',
  });

  const mealTypes: { value: MealType; label: string; icon: string; color: string }[] = [
    { value: 'breakfast', label: 'Breakfast', icon: 'sunny', color: '#f59e0b' },
    { value: 'lunch', label: 'Lunch', icon: 'partly-sunny', color: '#3b82f6' },
    { value: 'dinner', label: 'Dinner', icon: 'moon', color: '#8b5cf6' },
    { value: 'snack', label: 'Snack', icon: 'nutrition', color: '#10b981' },
  ];

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please set your user ID in Settings');
      return;
    }

    if (!mealData.description.trim()) {
      Alert.alert('Error', 'Please enter a meal description');
      return;
    }

    const calories = parseFloat(mealData.calories);
    const protein = parseFloat(mealData.protein);
    const carbs = parseFloat(mealData.carbs);
    const fats = parseFloat(mealData.fats);

    if (isNaN(calories) || calories <= 0) {
      Alert.alert('Error', 'Please enter valid calories');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/meal-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          photo_uri: 'manual_entry', // Manual entry, no photo
          meal_label: mealData.mealType,
          taken_at: new Date().toISOString(),
          notes: JSON.stringify({
            description: mealData.description,
            calories,
            protein: isNaN(protein) ? 0 : protein,
            carbs: isNaN(carbs) ? 0 : carbs,
            fats: isNaN(fats) ? 0 : fats,
            userNotes: mealData.notes,
          }),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert('Success', 'Meal logged successfully!', [
          {
            text: 'Log Another',
            onPress: () => {
              setMealData({
                mealType: 'breakfast',
                description: '',
                calories: '',
                protein: '',
                carbs: '',
                fats: '',
                notes: '',
              });
            },
          },
          {
            text: 'View Nutrition',
            onPress: () => navigation.navigate('NutritionDashboard'),
          },
        ]);
      } else {
        throw new Error(result.error || 'Failed to log meal');
      }
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to log meal');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (preset: { description: string; calories: number; protein: number; carbs: number; fats: number }) => {
    setMealData({
      ...mealData,
      description: preset.description,
      calories: preset.calories.toString(),
      protein: preset.protein.toString(),
      carbs: preset.carbs.toString(),
      fats: preset.fats.toString(),
    });
  };

  const quickAddPresets = [
    { description: 'Protein Shake', calories: 200, protein: 30, carbs: 10, fats: 3 },
    { description: 'Chicken Breast (6oz)', calories: 280, protein: 52, carbs: 0, fats: 6 },
    { description: 'Rice (1 cup)', calories: 200, protein: 4, carbs: 45, fats: 0 },
    { description: 'Banana', calories: 105, protein: 1, carbs: 27, fats: 0 },
  ];

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Set your user ID in Settings to log meals</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Log Meal</Text>
        <Text style={styles.subtitle}>Track your nutrition intake</Text>
      </View>

      {/* Meal Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Type</Text>
        <View style={styles.mealTypeGrid}>
          {mealTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.mealTypeCard,
                mealData.mealType === type.value && styles.mealTypeCardActive,
                { borderColor: type.color },
              ]}
              onPress={() => setMealData({ ...mealData, mealType: type.value })}
            >
              <Ionicons
                name={type.icon as any}
                size={32}
                color={mealData.mealType === type.value ? type.color : '#9ca3af'}
              />
              <Text
                style={[
                  styles.mealTypeLabel,
                  mealData.mealType === type.value && { color: type.color },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Add Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.presetsContainer}>
            {quickAddPresets.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetCard}
                onPress={() => handleQuickAdd(preset)}
              >
                <Text style={styles.presetDescription}>{preset.description}</Text>
                <Text style={styles.presetCalories}>{preset.calories} cal</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Meal Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Grilled chicken with rice and vegetables"
            value={mealData.description}
            onChangeText={(text) => setMealData({ ...mealData, description: text })}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Calories *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 500"
            value={mealData.calories}
            onChangeText={(text) => setMealData({ ...mealData, calories: text })}
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.macrosTitle}>Macronutrients (optional)</Text>
        
        <View style={styles.macrosRow}>
          <View style={styles.macroInput}>
            <Text style={styles.inputLabel}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={mealData.protein}
              onChangeText={(text) => setMealData({ ...mealData, protein: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.macroInput}>
            <Text style={styles.inputLabel}>Carbs (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={mealData.carbs}
              onChangeText={(text) => setMealData({ ...mealData, carbs: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.macroInput}>
            <Text style={styles.inputLabel}>Fats (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={mealData.fats}
              onChangeText={(text) => setMealData({ ...mealData, fats: text })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional notes..."
            value={mealData.notes}
            onChangeText={(text) => setMealData({ ...mealData, notes: text })}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('NutritionExtraction')}
        >
          <Ionicons name="camera" size={20} color="#3b82f6" />
          <Text style={styles.scanButtonText}>Scan Food Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Log Meal</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 8,
  },
  mealTypeCardActive: {
    borderWidth: 2,
    backgroundColor: '#f0f9ff',
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  presetsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  presetCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 140,
  },
  presetDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  presetCalories: {
    fontSize: 12,
    color: '#6b7280',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  macrosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  macroInput: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  scanButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});
