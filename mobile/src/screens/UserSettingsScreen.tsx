import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from '../types/navigation';

export default function UserSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId, setUserId, clearUserId } = useUser();
  const [inputUserId, setInputUserId] = useState(userId || '');

  const handleSaveUserId = async () => {
    if (!inputUserId.trim()) {
      Alert.alert('Error', 'Please enter a user ID');
      return;
    }

    try {
      await setUserId(inputUserId.trim());
      Alert.alert('Success', 'User ID saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save user ID');
    }
  };

  const handleClearUserId = async () => {
    Alert.alert(
      'Clear User ID',
      'Are you sure you want to clear your user ID? You will need to set it again to use the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearUserId();
              setInputUserId('');
              Alert.alert('Success', 'User ID cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear user ID');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Configuration</Text>
        
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => navigation.navigate('BaselineProfile')}
          activeOpacity={0.7}
        >
          <View style={styles.profileCardContent}>
            <Text style={styles.profileCardTitle}>Health Profile</Text>
            <Text style={styles.profileCardSubtitle}>Edit demographics, medical history, and preferences</Text>
          </View>
          <Text style={styles.profileCardArrow}>→</Text>
        </TouchableOpacity>
        
        <View style={styles.card}>
          <Text style={styles.label}>User ID</Text>
          <Text style={styles.helpText}>
            Enter your unique user ID. This is used to identify you across all API requests.
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter your user ID (UUID format)"
            value={inputUserId}
            onChangeText={setInputUserId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {userId && (
            <View style={styles.currentIdContainer}>
              <Text style={styles.currentIdLabel}>Current ID:</Text>
              <Text style={styles.currentId}>{userId}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveUserId}>
            <Text style={styles.saveButtonText}>Save User ID</Text>
          </TouchableOpacity>

          {userId && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearUserId}>
              <Text style={styles.clearButtonText}>Clear User ID</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>
        
        <View style={styles.card}>
          <Text style={styles.infoLabel}>API Base URL</Text>
          <Text style={styles.infoValue}>http://localhost:3000</Text>
          
          <Text style={[styles.helpText, { marginTop: 15 }]}>
            Make sure your server is running on this address. Change in .env file if needed.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>API Endpoints</Text>
            <Text style={styles.infoValue}>70+ endpoints</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Systems</Text>
            <Text style={styles.infoValue}>14 health systems</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Setup Guide</Text>
        
        <View style={styles.card}>
          <Text style={styles.stepTitle}>1. Start the Server</Text>
          <Text style={styles.stepText}>cd server && npm run dev</Text>
          
          <Text style={styles.stepTitle}>2. Set Your User ID</Text>
          <Text style={styles.stepText}>Enter any unique ID above (or use a UUID)</Text>
          
          <Text style={styles.stepTitle}>3. Start Using the App</Text>
          <Text style={styles.stepText}>Navigate to Dashboard to see your health data</Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Extra padding for tab bar
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  currentIdContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  currentIdLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  currentId: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
  },
  profileCard: {
    backgroundColor: '#2563EB',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCardContent: {
    flex: 1,
  },
  profileCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileCardSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  profileCardArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
