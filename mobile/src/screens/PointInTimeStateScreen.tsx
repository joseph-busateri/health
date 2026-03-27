import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import pointInTimeService from '../services/pointInTimeService';
import {
  PointInTimeState,
  AvailableDates,
  PointInTimeScreenState,
  StateComparison
} from '../types/pointInTime';

const PointInTimeStateScreen: React.FC = () => {
  const [state, setState] = useState<PointInTimeScreenState>({
    currentDate: new Date().toISOString().split('T')[0],
    selectedDate: null,
    currentState: null,
    historicalState: null,
    availableDates: null,
    isLoading: false,
    error: null,
    viewMode: 'current'
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Test user ID

  // Load current state on mount
  useEffect(() => {
    loadCurrentState();
    loadAvailableDates();
  }, []);

  // Load historical state when date is selected
  useEffect(() => {
    if (state.selectedDate && state.selectedDate !== state.currentDate) {
      loadHistoricalState(state.selectedDate);
    }
  }, [state.selectedDate]);

  const loadCurrentState = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const currentState = await pointInTimeService.getCurrentState(testUserId);
      
      setState(prev => ({
        ...prev,
        currentState,
        isLoading: false,
        viewMode: 'current'
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load current state'
      }));
    }
  }, []);

  const loadHistoricalState = useCallback(async (date: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const historicalState = await pointInTimeService.getHistoricalState(testUserId, date, true);
      
      setState(prev => ({
        ...prev,
        historicalState,
        isLoading: false,
        viewMode: 'historical'
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load historical state'
      }));
    }
  }, []);

  const loadAvailableDates = useCallback(async () => {
    try {
      const availableDates = await pointInTimeService.getAvailableDates(testUserId);
      setState(prev => ({ ...prev, availableDates }));
    } catch (error) {
      console.error('Failed to load available dates:', error);
    }
  }, []);

  const handleDateSelect = (date: string) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  };

  const handleCurrentDateSelect = () => {
    setState(prev => ({ 
      ...prev, 
      selectedDate: null,
      viewMode: 'current'
    }));
  };

  const handleDatePickerConfirm = () => {
    setShowDatePicker(false);
    
    // Create date and validate
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    // Validate date is not in the future
    const today = new Date();
    if (selectedDate > today) {
      Alert.alert('Invalid Date', 'Cannot select future dates');
      return;
    }
    
    // Validate date is reasonable (not too far in the past)
    const minDate = new Date(2020, 0, 1); // Jan 1, 2020
    if (selectedDate < minDate) {
      Alert.alert('Invalid Date', 'Date is too far in the past');
      return;
    }
    
    const dateString = pointInTimeService.formatDateForApi(selectedDate);
    handleDateSelect(dateString);
  };

  const onRefresh = useCallback(() => {
    if (state.viewMode === 'current') {
      loadCurrentState();
    } else if (state.selectedDate) {
      loadHistoricalState(state.selectedDate);
    }
    loadAvailableDates();
  }, [state.viewMode, state.selectedDate]);

  const renderStateHeader = () => {
    const displayDate = state.selectedDate || state.currentDate;
    const isHistorical = state.selectedDate !== null && state.selectedDate !== state.currentDate;
    
    return (
      <View style={styles.stateHeader}>
        <Text style={styles.stateTitle}>
          {isHistorical ? 'Historical State' : 'Current State'}
        </Text>
        <Text style={styles.stateDate}>
          {pointInTimeService.formatDateForDisplay(displayDate)}
          {isHistorical && (
            <Text style={styles.relativeDate}>
              {' • '}{pointInTimeService.getRelativeDateDescription(displayDate)}
            </Text>
          )}
        </Text>
      </View>
    );
  };

  const renderDateSelector = () => (
    <View style={styles.dateSelector}>
      <TouchableOpacity
        style={[styles.dateButton, state.viewMode === 'current' && styles.activeDateButton]}
        onPress={handleCurrentDateSelect}
      >
        <Text style={[styles.dateButtonText, state.viewMode === 'current' && styles.activeDateButtonText]}>
          Current
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.dateButton, state.viewMode === 'historical' && styles.activeDateButton]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.dateButtonText, state.viewMode === 'historical' && styles.activeDateButtonText]}>
          {state.selectedDate ? pointInTimeService.formatDateForDisplay(state.selectedDate) : 'Select Date'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderGoals = (goals: any[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Goals</Text>
      {goals.length === 0 ? (
        <Text style={styles.emptyText}>No goals found</Text>
      ) : (
        goals.map((goal, index) => (
          <View key={goal.id || index} style={styles.item}>
            <Text style={styles.itemTitle}>{goal.title}</Text>
            <Text style={styles.itemSubtitle}>{goal.category}</Text>
            {goal.target_value && (
              <Text style={styles.itemDetail}>
                Target: {goal.target_value} {goal.unit || ''}
              </Text>
            )}
            <Text style={styles.itemStatus}>Status: {goal.status || 'active'}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderWorkoutBaseline = (baseline: any) => {
    if (!baseline) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Baseline</Text>
        <Text style={styles.itemTitle}>{baseline.split_type || 'Custom Split'}</Text>
        {baseline.training_days && (
          <Text style={styles.itemDetail}>Training Days: {baseline.training_days}/week</Text>
        )}
        {baseline.session_duration && (
          <Text style={styles.itemDetail}>Session Duration: {baseline.session_duration} min</Text>
        )}
        {baseline.focus_areas && baseline.focus_areas.length > 0 && (
          <Text style={styles.itemDetail}>
            Focus: {baseline.focus_areas.join(', ')}
          </Text>
        )}
      </View>
    );
  };

  const renderSupplementBaseline = (baseline: any) => {
    if (!baseline) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supplement Stack</Text>
        <Text style={styles.itemTitle}>{baseline.stack_name}</Text>
        {baseline.total_active_items && (
          <Text style={styles.itemDetail}>
            Active Items: {baseline.total_active_items}
          </Text>
        )}
        {baseline.timing_notes && (
          <Text style={styles.itemDetail}>Timing: {baseline.timing_notes}</Text>
        )}
        {baseline.frequency_notes && (
          <Text style={styles.itemDetail}>Frequency: {baseline.frequency_notes}</Text>
        )}
      </View>
    );
  };

  const renderSupplementItems = (items: any[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Supplement Items</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No supplement items found</Text>
      ) : (
        items.map((item, index) => (
          <View key={item.id || index} style={styles.item}>
            <Text style={styles.itemTitle}>{item.supplement_name}</Text>
            <Text style={styles.itemDetail}>
              {item.dosage} {item.dosage_unit} • {item.frequency}
            </Text>
            <Text style={styles.itemDetail}>Timing: {item.timing}</Text>
            <Text style={styles.itemStatus}>Status: {item.status || 'active'}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderState = (pointInTimeState: PointInTimeState) => (
    <ScrollView style={styles.stateContent}>
      {renderGoals(pointInTimeState.goals)}
      {renderWorkoutBaseline(pointInTimeState.workout_baseline)}
      {renderSupplementBaseline(pointInTimeState.supplement_baseline)}
      {renderSupplementItems(pointInTimeState.supplement_items)}
      
      {pointInTimeState.changes_since && pointInTimeState.changes_since.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Changes</Text>
          {pointInTimeState.changes_since.slice(0, 5).map((change, index) => (
            <View key={change.id || index} style={styles.changeItem}>
              <Text style={styles.changeField}>{change.field_name}</Text>
              <Text style={styles.changeValue}>
                {change.old_value ? `From: ${change.old_value}` : ''}
              </Text>
              <Text style={styles.changeValue}>
                {change.new_value ? `To: ${change.new_value}` : ''}
              </Text>
              <Text style={styles.changeDate}>
                {pointInTimeService.formatDateForDisplay(change.effective_at)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const activeState = state.viewMode === 'current' ? state.currentState : state.historicalState;

  if (state.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{state.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderStateHeader()}
      {renderDateSelector()}
      
      {state.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading state...</Text>
        </View>
      ) : activeState ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={state.isLoading} onRefresh={onRefresh} />
          }
        >
          {renderState(activeState)}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No state data available</Text>
        </View>
      )}

      {showDatePicker && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date</Text>
              
              <View style={styles.datePickerRow}>
                <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.datePickerButton} onPress={handleDatePickerConfirm}>
                  <Text style={styles.datePickerButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateSelection}>
                <Text style={styles.dateLabel}>Year: {selectedYear}</Text>
                <View style={styles.dateButtons}>
                  <TouchableOpacity 
                    style={styles.modalDateButton} 
                    onPress={() => setSelectedYear(Math.max(2020, selectedYear - 1))}
                  >
                    <Text style={styles.modalDateButtonText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalDateButton} 
                    onPress={() => setSelectedYear(Math.min(new Date().getFullYear(), selectedYear + 1))}
                  >
                    <Text style={styles.modalDateButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.dateLabel}>Month: {selectedMonth + 1}</Text>
                <View style={styles.dateButtons}>
                  <TouchableOpacity 
                    style={styles.modalDateButton} 
                    onPress={() => setSelectedMonth(Math.max(0, selectedMonth - 1))}
                  >
                    <Text style={styles.modalDateButtonText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalDateButton} 
                    onPress={() => setSelectedMonth(Math.min(11, selectedMonth + 1))}
                  >
                    <Text style={styles.modalDateButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.dateLabel}>Day: {selectedDay}</Text>
                <View style={styles.dateButtons}>
                  <TouchableOpacity 
                    style={styles.modalDateButton} 
                    onPress={() => setSelectedDay(Math.max(1, selectedDay - 1))}
                  >
                    <Text style={styles.modalDateButtonText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalDateButton} 
                    onPress={() => setSelectedDay(Math.min(31, selectedDay + 1))}
                  >
                    <Text style={styles.modalDateButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  stateHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  stateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  stateDate: {
    fontSize: 16,
    color: '#8E8E93',
  },
  relativeDate: {
    fontSize: 14,
    color: '#007AFF',
  },
  dateSelector: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeDateButton: {
    backgroundColor: '#007AFF',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1D1D1F',
  },
  activeDateButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  stateContent: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  item: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 14,
    color: '#48484A',
    marginBottom: 2,
  },
  itemStatus: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#48484A',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  changeItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
  },
  changeField: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  changeValue: {
    fontSize: 12,
    color: '#48484A',
  },
  changeDate: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  dateSelection: {
    gap: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  dateButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  modalDateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PointInTimeStateScreen;
