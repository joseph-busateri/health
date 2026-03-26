import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import api from '../services/api';
import {
  DetailsScreenNavigationProp,
  DetailsScreenRouteProp,
} from '../types/navigation';

interface HealthHistoryPoint {
  date: string;
  value: number;
}

interface HealthDetail {
  id: string;
  title: string;
  description: string;
  value: number;
  unit: string;
  history: HealthHistoryPoint[];
  recommendations: string[];
}

interface Props {
  navigation: DetailsScreenNavigationProp;
  route: DetailsScreenRouteProp;
}

const DetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [healthDetail, setHealthDetail] = useState<HealthDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthDetail();
  }, [id]);

  const fetchHealthDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/health/${id}`);
      setHealthDetail(response.data);
    } catch (err) {
      setError('Failed to fetch health details');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (error || !healthDetail) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'No data available'}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchHealthDetail}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{healthDetail.title}</Text>
        <Text style={styles.description}>{healthDetail.description}</Text>
      </View>

      <View style={styles.currentValueSection}>
        <Text style={styles.sectionTitle}>Current Value</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{healthDetail.value}</Text>
          <Text style={styles.unit}>{healthDetail.unit}</Text>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>History</Text>
        {healthDetail.history.map((item, index) => (
          <View key={index} style={styles.historyItem}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyValue}>
              {item.value} {healthDetail.unit}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {healthDetail.recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationText}>• {recommendation}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  currentValueSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
  },
  unit: {
    fontSize: 18,
    color: '#666',
  },
  historySection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  historyDate: {
    fontSize: 16,
    color: '#666',
  },
  historyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recommendationsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 20,
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});

export default DetailsScreen;
