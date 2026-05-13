import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import type { BaselineProfile } from '../types/baselineDocument';

type BaselineSummaryScreenRouteProp = RouteProp<RootStackParamList, 'BaselineSummary'>;
type BaselineSummaryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BaselineSummary'>;

interface Props {
  route: BaselineSummaryScreenRouteProp;
  navigation: BaselineSummaryScreenNavigationProp;
}

export const BaselineSummaryScreen: React.FC<Props> = ({ route }) => {
  const { profile } = route.params;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderSection = (title: string, data: any) => {
    if (!data) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {Object.entries(data).map(([key, value]) => {
          if (!value) return null;
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:
              </Text>
              <Text style={styles.value}>
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Baseline Summary</Text>
      <Text style={styles.subtitle}>Extracted on {formatDate(profile.extractedAt)}</Text>
      
      {renderSection('Demographics', profile.demographics)}
      {renderSection('Training Context', profile.trainingContext)}
      {renderSection('Lifestyle Context', profile.lifestyleContext)}
      {renderSection('Overall Health Goals', profile.overallHealthGoals)}
      {renderSection('Sexual Performance Goals', profile.sexualPerformanceGoals)}
      {renderSection('Workout Goals', profile.workoutGoals)}
      {renderSection('Secondary Goals', profile.secondaryGoals)}
      {renderSection('Priority Order', profile.priorityOrder)}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This baseline profile was extracted from your uploaded document and will be used to personalize your health tracking and recommendations.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});
