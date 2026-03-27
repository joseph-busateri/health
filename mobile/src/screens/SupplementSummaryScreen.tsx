import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import type { SupplementBaseline, SupplementItem } from '../types/supplementDocument';

type Props = NativeStackScreenProps<RootStackParamList, 'SupplementSummary'>;

const SupplementSummaryScreen: React.FC<Props> = ({ route, navigation }) => {
  const { baseline, items } = route.params;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'paused':
        return 'text-yellow-600';
      case 'removed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100';
      case 'paused':
        return 'bg-yellow-100';
      case 'removed':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Supplement Stack Summary
          </Text>
          <Text className="text-gray-600">
            Your current supplement regimen
          </Text>
        </View>

        {/* Stack Overview */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Stack Overview
          </Text>
          
          <View className="mb-3">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Stack Name
            </Text>
            <Text className="text-base text-gray-900">
              {baseline.stack_name}
            </Text>
          </View>

          {baseline.stack_notes && (
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Stack Notes
              </Text>
              <Text className="text-base text-gray-900">
                {baseline.stack_notes}
              </Text>
            </View>
          )}

          <View className="flex-row space-x-4 mb-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Total Items
              </Text>
              <Text className="text-base text-gray-900">
                {baseline.total_active_items} active
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Created
              </Text>
              <Text className="text-base text-gray-900">
                {new Date(baseline.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {baseline.timing_notes && (
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Timing Notes
              </Text>
              <Text className="text-base text-gray-900">
                {baseline.timing_notes}
              </Text>
            </View>
          )}

          {baseline.frequency_notes && (
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Frequency Notes
              </Text>
              <Text className="text-base text-gray-900">
                {baseline.frequency_notes}
              </Text>
            </View>
          )}
        </View>

        {/* Supplement Items */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Supplement Items ({items.length})
          </Text>

          {items.map((item, index) => (
            <View 
              key={item.id} 
              className={`border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:mb-0`}
            >
              <View className="flex-row justify-between items-start mb-3">
                <Text className="text-base font-semibold text-gray-900 flex-1">
                  {item.supplement_name}
                </Text>
                <View className={`px-2 py-1 rounded-md ${getStatusBg(item.status)}`}>
                  <Text className={`text-xs font-medium capitalize ${getStatusColor(item.status)}`}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View className="space-y-2">
                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-1">
                      Dosage
                    </Text>
                    <Text className="text-base text-gray-900">
                      {item.dosage} {item.dosage_unit}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </Text>
                    <Text className="text-base text-gray-900">
                      {item.frequency}
                    </Text>
                  </View>
                </View>

                <View className="mb-2">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Timing
                  </Text>
                  <Text className="text-base text-gray-900">
                    {item.timing}
                  </Text>
                </View>

                {item.notes && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </Text>
                    <Text className="text-base text-gray-900">
                      {item.notes}
                    </Text>
                  </View>
                )}

                <View className="flex-row space-x-4 mt-3">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500">
                      Added: {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {item.updated_at !== item.created_at && (
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500">
                        Updated: {new Date(item.updated_at).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}

          {items.length === 0 && (
            <View className="text-center py-8">
              <Text className="text-gray-500">
                No supplement items found
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={() => navigation.navigate('SupplementUpload')}
            className="bg-blue-500 p-4 rounded-md"
          >
            <Text className="text-white text-center font-semibold text-lg">
              Upload New Stack
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-gray-200 p-4 rounded-md"
          >
            <Text className="text-gray-800 text-center font-semibold text-lg">
              Back
            </Text>
          </TouchableOpacity>
        </View>

        {/* Metadata */}
        <View className="mt-6 p-4 bg-gray-100 rounded-lg">
          <Text className="text-xs text-gray-600 text-center">
            Document ID: {baseline.document_id}
          </Text>
          <Text className="text-xs text-gray-600 text-center">
            Baseline ID: {baseline.id}
          </Text>
          <Text className="text-xs text-gray-600 text-center">
            Extracted: {new Date(baseline.extracted_at).toLocaleString()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default SupplementSummaryScreen;
