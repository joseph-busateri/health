import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, subtitle, style, children }) => (
  <View style={[styles.card, style]}
  >
    {title ? <Text style={styles.title}>{title}</Text> : null}
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
});

export default DashboardCard;
