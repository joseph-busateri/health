import { createClient } from '@supabase/supabase-js';
import {
  ChangeEvent,
  ChangeEventInsert,
  ReconstructedState,
  CurrentStateResponse,
  HistoricalStateResponse,
  ReconstructedGoal,
  ReconstructedWorkoutBaseline,
  ReconstructedSupplementBaseline,
  ReconstructedSupplementItem,
  StateComparison,
  StateDifference,
  StateRequest,
  StateReconstructionOptions,
  ChangeEventCreateParams,
  EntityType,
  ChangeSource,
  DEFAULT_STATE_OPTIONS
} from '../types/pointInTime';
import { Database } from '../types/database';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Change Event Management
export async function createChangeEvent(params: ChangeEventCreateParams): Promise<ChangeEvent> {
  try {
    const changeEvent: ChangeEventInsert = {
      user_id: params.user_id,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      field_name: params.field_name,
      old_value: params.old_value,
      new_value: params.new_value,
      change_source: params.change_source,
      rationale: params.rationale,
      confidence: params.confidence,
      effective_at: params.effective_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('change_events')
      .insert(changeEvent)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create change event: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating change event:', error);
    throw error;
  }
}

export async function getChangeEvents(
  userId: string,
  entityType?: EntityType,
  entityId?: string,
  limit: number = 100
): Promise<ChangeEvent[]> {
  try {
    let query = supabase
      .from('change_events')
      .select('*')
      .eq('user_id', userId)
      .order('effective_at', { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get change events: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting change events:', error);
    throw error;
  }
}

// State Reconstruction Service
export async function reconstructStateAsOf(
  userId: string,
  targetDate: string,
  options: StateReconstructionOptions = DEFAULT_STATE_OPTIONS
): Promise<HistoricalStateResponse> {
  try {
    const targetDateObj = new Date(targetDate);
    const now = new Date();
    const isCurrent = targetDateObj >= now;

    // Get reconstructed state for each entity type
    const [goals, workoutBaseline, supplementBaseline, supplementItems] = await Promise.all([
      reconstructGoalsAsOf(userId, targetDate, options),
      reconstructWorkoutBaselineAsOf(userId, targetDate, options),
      reconstructSupplementBaselineAsOf(userId, targetDate, options),
      reconstructSupplementItemsAsOf(userId, targetDate, options)
    ]);

    // Get changes since the target date if requested
    let changesSince: ChangeEvent[] = [];
    if (options.include_metadata) {
      changesSince = await getChangeEvents(userId, undefined, undefined, 500);
      changesSince = changesSince.filter(change => 
        new Date(change.effective_at) > targetDateObj
      );
    }

    return {
      user_id: userId,
      as_of_date: targetDate,
      is_current: isCurrent,
      goals,
      workout_baseline: workoutBaseline,
      supplement_baseline: supplementBaseline,
      supplement_items: supplementItems,
      changes_since: changesSince
    };
  } catch (error) {
    console.error('Error reconstructing state:', error);
    throw error;
  }
}

export async function getCurrentState(userId: string): Promise<CurrentStateResponse> {
  try {
    const now = new Date().toISOString();
    const historicalState = await reconstructStateAsOf(userId, now, {
      include_deleted: false,
      include_metadata: true,
      max_changes: 1000
    });

    return {
      user_id: userId,
      as_of_date: now,
      goals: historicalState.goals,
      workout_baseline: historicalState.workout_baseline,
      supplement_baseline: historicalState.supplement_baseline,
      supplement_items: historicalState.supplement_items
    };
  } catch (error) {
    console.error('Error getting current state:', error);
    throw error;
  }
}

// Entity-specific reconstruction methods
async function reconstructGoalsAsOf(
  userId: string,
  targetDate: string,
  options: StateReconstructionOptions
): Promise<ReconstructedGoal[]> {
  try {
    // First get baseline goals from baseline_profile
    const { data: baselineProfile, error: baselineError } = await supabase
      .from('baseline_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (baselineError && baselineError.code !== 'PGRST116') {
      throw new Error(`Failed to get baseline profile: ${baselineError.message}`);
    }

    let goals: ReconstructedGoal[] = [];

    if (baselineProfile?.goals) {
      // Parse goals from baseline profile
      const parsedGoals = typeof baselineProfile.goals === 'string' 
        ? JSON.parse(baselineProfile.goals)
        : baselineProfile.goals;

      goals = parsedGoals.map((goal: any) => ({
        id: goal.id || 'baseline-goal',
        category: goal.category || 'general',
        title: goal.title || 'Untitled Goal',
        description: goal.description,
        target_value: goal.target_value,
        current_value: goal.current_value,
        unit: goal.unit,
        target_date: goal.target_date,
        status: goal.status || 'active',
        priority: goal.priority || 'medium',
        created_at: baselineProfile.created_at,
        updated_at: baselineProfile.updated_at
      }));
    }

    // Apply changes up to target date
    const goalChanges = await getChangeEvents(userId, 'goal', undefined, options.max_changes);
    const relevantChanges = goalChanges.filter(change => 
      new Date(change.effective_at) <= new Date(targetDate)
    );

    // Apply changes chronologically
    for (const change of relevantChanges.sort((a, b) => 
      new Date(a.effective_at).getTime() - new Date(b.effective_at).getTime()
    )) {
      const goalIndex = goals.findIndex(g => g.id === change.entity_id);
      
      if (goalIndex >= 0) {
        // Apply change to existing goal
        (goals[goalIndex] as any)[change.field_name] = change.new_value;
      }
    }

    return goals;
  } catch (error) {
    console.error('Error reconstructing goals:', error);
    return [];
  }
}

async function reconstructWorkoutBaselineAsOf(
  userId: string,
  targetDate: string,
  options: StateReconstructionOptions
): Promise<ReconstructedWorkoutBaseline | null> {
  try {
    // Get the latest workout baseline as of target date
    const { data: workoutBaseline, error: baselineError } = await supabase
      .from('workout_baseline')
      .select('*')
      .eq('user_id', userId)
      .lte('extracted_at', targetDate)
      .order('extracted_at', { ascending: false })
      .limit(1)
      .single();

    if (baselineError && baselineError.code !== 'PGRST116') {
      throw new Error(`Failed to get workout baseline: ${baselineError.message}`);
    }

    if (!workoutBaseline) {
      return null;
    }

    // Get changes for this baseline
    const changes = await getChangeEvents(userId, 'workout_baseline', workoutBaseline.id, options.max_changes);
    const relevantChanges = changes.filter(change => 
      new Date(change.effective_at) <= new Date(targetDate)
    );

    // Apply changes to baseline
    let reconstructed: ReconstructedWorkoutBaseline = {
      id: workoutBaseline.id,
      user_id: workoutBaseline.user_id,
      document_id: workoutBaseline.document_id,
      split_type: workoutBaseline.split_type,
      training_days: workoutBaseline.training_days,
      rest_days: workoutBaseline.rest_days,
      session_duration: workoutBaseline.session_duration,
      focus_areas: workoutBaseline.focus_areas || [],
      experience_level: workoutBaseline.experience_level,
      notes: workoutBaseline.notes,
      extracted_at: workoutBaseline.extracted_at,
      created_at: workoutBaseline.created_at,
      updated_at: workoutBaseline.updated_at
    };

    for (const change of relevantChanges.sort((a, b) => 
      new Date(a.effective_at).getTime() - new Date(b.effective_at).getTime()
    )) {
      (reconstructed as any)[change.field_name] = change.new_value;
    }

    return reconstructed;
  } catch (error) {
    console.error('Error reconstructing workout baseline:', error);
    return null;
  }
}

async function reconstructSupplementBaselineAsOf(
  userId: string,
  targetDate: string,
  options: StateReconstructionOptions
): Promise<ReconstructedSupplementBaseline | null> {
  try {
    // Get the most recent supplement stack version before or on target date
    const { data: stackVersion, error: stackVersionError } = await supabase
      .from('supplement_stack_versions')
      .select('*')
      .eq('user_id', userId)
      .lte('created_at', targetDate)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (stackVersionError && stackVersionError.code !== 'PGRST116') {
      throw new Error(`Failed to get supplement stack version: ${stackVersionError.message}`);
    }

    if (!stackVersion) {
      return null;
    }

    // Map stack version to legacy baseline structure for backward compatibility
    let reconstructed: ReconstructedSupplementBaseline = {
      id: stackVersion.id,
      user_id: stackVersion.user_id,
      document_id: null, // Stack versions don't have direct document_id
      stack_name: stackVersion.version_name || 'Supplement Stack',
      stack_notes: stackVersion.created_reason,
      total_active_items: 0, // Will be calculated from supplements
      timing_notes: null,
      frequency_notes: null,
      extracted_at: stackVersion.created_at,
      created_at: stackVersion.created_at,
      updated_at: stackVersion.created_at
    };

    return reconstructed;
  } catch (error) {
    console.error('Error reconstructing supplement baseline:', error);
    return null;
  }
}

async function reconstructSupplementItemsAsOf(
  userId: string,
  targetDate: string,
  options: StateReconstructionOptions
): Promise<ReconstructedSupplementItem[]> {
  try {
    // Get supplement stack version first
    const baseline = await reconstructSupplementBaselineAsOf(userId, targetDate, options);
    
    if (!baseline) {
      return [];
    }

    // Get supplements for this stack version
    const { data: supplements, error: supplementsError } = await supabase
      .from('supplements')
      .select('*')
      .eq('stack_version_id', baseline.id)
      .lte('created_at', targetDate);

    if (supplementsError) {
      throw new Error(`Failed to get supplements: ${supplementsError.message}`);
    }

    if (!supplements || supplements.length === 0) {
      return [];
    }

    // Map supplements to legacy item structure for backward compatibility
    let reconstructedItems: ReconstructedSupplementItem[] = supplements.map(supplement => ({
      id: supplement.id,
      supplement_baseline_id: baseline.id,
      supplement_name: supplement.supplement_name,
      dosage: supplement.dosage_amount.toString(),
      dosage_unit: supplement.dosage_unit,
      frequency: supplement.frequency,
      timing: supplement.timing,
      status: supplement.status === 'discontinued' ? 'removed' : supplement.status,
      notes: supplement.goal,
      created_at: supplement.created_at,
      updated_at: supplement.created_at
    }));

    // Note: With stack versions, changes are tracked as new versions, not field-level changes
    // So we don't need to apply individual field changes here

    return reconstructedItems;
  } catch (error) {
    console.error('Error reconstructing supplement items:', error);
    return [];
  }
}

// State Comparison Service
export async function compareStates(
  userId: string,
  historicalDate: string,
  currentDate: string = new Date().toISOString()
): Promise<StateComparison> {
  try {
    const [historicalState, currentState] = await Promise.all([
      reconstructStateAsOf(userId, historicalDate, { include_metadata: false }),
      getCurrentState(userId)
    ]);

    const differences: StateDifference[] = [];

    // Compare goals
    const goalDiffs = compareEntities(
      historicalState.goals,
      currentState.goals,
      'goal',
      'title'
    );
    differences.push(...goalDiffs);

    // Compare workout baselines
    if (historicalState.workout_baseline && currentState.workout_baseline) {
      const workoutDiffs = compareSingleEntities(
        historicalState.workout_baseline,
        currentState.workout_baseline,
        'workout_baseline',
        'split_type'
      );
      differences.push(...workoutDiffs);
    }

    // Compare supplement baselines
    if (historicalState.supplement_baseline && currentState.supplement_baseline) {
      const supplementDiffs = compareSingleEntities(
        historicalState.supplement_baseline,
        currentState.supplement_baseline,
        'supplement_baseline',
        'stack_name'
      );
      differences.push(...supplementDiffs);
    }

    // Compare supplement items (now using supplements from stack versions)
    const itemDiffs = compareEntities(
      historicalState.supplement_items,
      currentState.supplement_items,
      'supplement_item',
      'supplement_name'
    );
    differences.push(...itemDiffs);

    return {
      user_id: userId,
      current_date: currentDate,
      historical_date: historicalDate,
      differences
    };
  } catch (error) {
    console.error('Error comparing states:', error);
    throw error;
  }
}

function compareEntities(
  historical: any[],
  current: any[],
  entityType: EntityType,
  nameField: string
): StateDifference[] {
  const differences: StateDifference[] = [];

  // Find added/removed entities
  const historicalIds = new Set(historical.map(e => e.id));
  const currentIds = new Set(current.map(e => e.id));

  // Added entities
  for (const entity of current) {
    if (!historicalIds.has(entity.id)) {
      differences.push({
        entity_type: entityType,
        entity_id: entity.id,
        entity_name: entity[nameField],
        field_name: 'entity',
        current_value: entity,
        historical_value: null,
        change_type: 'added'
      });
    }
  }

  // Removed entities
  for (const entity of historical) {
    if (!currentIds.has(entity.id)) {
      differences.push({
        entity_type: entityType,
        entity_id: entity.id,
        entity_name: entity[nameField],
        field_name: 'entity',
        current_value: null,
        historical_value: entity,
        change_type: 'removed'
      });
    }
  }

  // Modified entities
  for (const currentEntity of current) {
    const historicalEntity = historical.find(e => e.id === currentEntity.id);
    if (historicalEntity) {
      const fieldDiffs = compareFields(
        historicalEntity,
        currentEntity,
        entityType,
        currentEntity.id,
        currentEntity[nameField]
      );
      differences.push(...fieldDiffs);
    }
  }

  return differences;
}

function compareSingleEntities(
  historical: any,
  current: any,
  entityType: EntityType,
  nameField: string
): StateDifference[] {
  return compareFields(historical, current, entityType, historical.id, historical[nameField]);
}

function compareFields(
  historical: any,
  current: any,
  entityType: EntityType,
  entityId: string,
  entityName: string
): StateDifference[] {
  const differences: StateDifference[] = [];

  for (const key in current) {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      const historicalValue = historical[key];
      const currentValue = current[key];

      if (JSON.stringify(historicalValue) !== JSON.stringify(currentValue)) {
        differences.push({
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          field_name: key,
          current_value: currentValue,
          historical_value: historicalValue,
          change_type: 'modified'
        });
      }
    }
  }

  return differences;
}
