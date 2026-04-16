import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from '../types/navigation';

interface ExtractedNutrition {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence: number;
}

export default function NutritionExtractionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedNutrition | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedNutrition | null>(null);

  const handleTakePhoto = async () => {
    Alert.alert(
      'Photo Capture',
      'Camera functionality requires native modules. For now, this is a placeholder.',
      [
        {
          text: 'Use Demo Photo',
          onPress: () => {
            setPhotoUri('https://via.placeholder.com/400x300?text=Food+Photo');
            simulateAIExtraction();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const simulateAIExtraction = async () => {
    setLoading(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockExtraction: ExtractedNutrition = {
      foodName: 'Grilled Chicken Breast with Rice and Vegetables',
      calories: 520,
      protein: 45,
      carbs: 52,
      fats: 12,
      confidence: 0.87,
    };
    
    setExtractedData(mockExtraction);
    setEditedData(mockExtraction);
    setLoading(false);
  };

  const handleExtractFromPhoto = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please set your user ID in Settings');
      return;
    }

    if (!photoUri) {
      Alert.alert('Error', 'Please take or select a photo first');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/nutrition/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          photo_uri: photoUri,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const extraction: ExtractedNutrition = {
          foodName: result.data.foodName || 'Unknown Food',
          calories: result.data.calories || 0,
          protein: result.data.protein || 0,
          carbs: result.data.carbs || 0,
          fats: result.data.fats || 0,
          confidence: result.data.confidence || 0.5,
        };
        setExtractedData(extraction);
        setEditedData(extraction);
      } else {
        throw new Error(result.error || 'Failed to extract nutrition data');
      }
    } catch (error) {
      console.error('Error extracting nutrition:', error);
      Alert.alert('Error', 'Failed to extract nutrition data. Using demo data instead.');
      simulateAIExtraction();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToMealLog = async () => {
    if (!editedData || !userId) return;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/meal-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          photo_uri: photoUri || 'extracted',
          meal_label: 'extracted',
          taken_at: new Date().toISOString(),
          notes: JSON.stringify({
            description: editedData.foodName,
            calories: editedData.calories,
            protein: editedData.protein,
            carbs: editedData.carbs,
            fats: editedData.fats,
            aiConfidence: editedData.confidence,
            source: 'ai_extraction',
          }),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert('Success', 'Meal saved to log!', [
          {
            text: 'View Nutrition',
            onPress: () => navigation.navigate('NutritionDashboard'),
          },
          {
            text: 'Scan Another',
            onPress: () => {
              setPhotoUri(null);
              setExtractedData(null);
              setEditedData(null);
              setIsEditing(false);
            },
          },
        ]);
      } else {
        throw new Error(result.error || 'Failed to save meal');
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save meal');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Set your user ID in Settings to use AI extraction</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Food Scanner</Text>
        <Text style={styles.subtitle}>Scan food photos for instant nutrition data</Text>
      </View>

      {/* Photo Section */}
      {!photoUri ? (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="camera-outline" size={64} color="#9ca3af" />
          <Text style={styles.photoPlaceholderText}>No photo selected</Text>
          <TouchableOpacity style={styles.takePhotoButton} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.takePhotoButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => {
              setPhotoUri(null);
              setExtractedData(null);
              setEditedData(null);
            }}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* AI Processing */}
      {photoUri && !extractedData && !loading && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.extractButton} onPress={handleExtractFromPhoto}>
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.extractButtonText}>Extract Nutrition with AI</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>AI analyzing your food...</Text>
        </View>
      )}

      {/* Extracted Data */}
      {extractedData && !loading && (
        <>
          {/* Confidence Badge */}
          <View style={styles.section}>
            <View style={styles.confidenceCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <View style={styles.confidenceContent}>
                <Text style={styles.confidenceLabel}>AI Confidence</Text>
                <Text style={styles.confidenceValue}>
                  {Math.round(extractedData.confidence * 100)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Extracted Nutrition */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Extracted Nutrition</Text>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                <Ionicons name={isEditing ? 'checkmark' : 'create'} size={24} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {/* Food Name */}
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Food</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.dataInput}
                    value={editedData?.foodName}
                    onChangeText={(text) =>
                      setEditedData(prev => prev ? { ...prev, foodName: text } : null)
                    }
                  />
                ) : (
                  <Text style={styles.dataValue}>{editedData?.foodName}</Text>
                )}
              </View>

              {/* Calories */}
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Calories</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.dataInput}
                    value={editedData?.calories.toString()}
                    onChangeText={(text) =>
                      setEditedData(prev => prev ? { ...prev, calories: parseFloat(text) || 0 } : null)
                    }
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.dataValue}>{editedData?.calories} cal</Text>
                )}
              </View>

              {/* Protein */}
              <View style={styles.dataRow}>
                <View style={styles.macroLabelContainer}>
                  <View style={[styles.macroDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.dataLabel}>Protein</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.dataInput}
                    value={editedData?.protein.toString()}
                    onChangeText={(text) =>
                      setEditedData(prev => prev ? { ...prev, protein: parseFloat(text) || 0 } : null)
                    }
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.dataValue}>{editedData?.protein}g</Text>
                )}
              </View>

              {/* Carbs */}
              <View style={styles.dataRow}>
                <View style={styles.macroLabelContainer}>
                  <View style={[styles.macroDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.dataLabel}>Carbs</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.dataInput}
                    value={editedData?.carbs.toString()}
                    onChangeText={(text) =>
                      setEditedData(prev => prev ? { ...prev, carbs: parseFloat(text) || 0 } : null)
                    }
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.dataValue}>{editedData?.carbs}g</Text>
                )}
              </View>

              {/* Fats */}
              <View style={styles.dataRow}>
                <View style={styles.macroLabelContainer}>
                  <View style={[styles.macroDot, { backgroundColor: '#8b5cf6' }]} />
                  <Text style={styles.dataLabel}>Fats</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.dataInput}
                    value={editedData?.fats.toString()}
                    onChangeText={(text) =>
                      setEditedData(prev => prev ? { ...prev, fats: parseFloat(text) || 0 } : null)
                    }
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.dataValue}>{editedData?.fats}g</Text>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => navigation.navigate('MealLog')}
            >
              <Ionicons name="create" size={20} color="#6b7280" />
              <Text style={styles.manualButtonText}>Manual Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSaveToMealLog}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save to Log</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How it works</Text>
        <View style={styles.infoItem}>
          <Ionicons name="camera" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>Take a photo of your meal</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="flash" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>AI analyzes the food and estimates nutrition</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="create" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>Review and edit if needed</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>Save to your meal log</Text>
        </View>
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
  photoPlaceholder: {
    margin: 16,
    padding: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 16,
  },
  photoPlaceholderText: {
    fontSize: 16,
    color: '#6b7280',
  },
  takePhotoButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  takePhotoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoContainer: {
    margin: 16,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  retakeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  extractButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  extractButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  confidenceCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confidenceContent: {
    flex: 1,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 2,
  },
  confidenceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#15803d',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  dataValue: {
    fontSize: 16,
    color: '#111827',
  },
  dataInput: {
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 120,
    textAlign: 'right',
  },
  macroLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  manualButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  manualButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
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
