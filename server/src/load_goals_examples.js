const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Example 1: Weight Loss Goal
const weightLossGoal = {
  userId: '11111',
  goalName: 'Lose 25 Pounds',
  goalCategory: 'weight_loss',
  goalType: 'weight_loss',
  description: 'Lose 25 pounds through diet and consistent exercise',
  startDate: '2026-01-01',
  targetDate: '2026-06-01',
  whyImportant: 'Improve overall health and energy levels',
  motivationLevel: 9,
  metrics: [
    {
      metricName: 'body_weight',
      metricType: 'numeric',
      metricUnit: 'lb',
      startingValue: 270,
      targetValue: 245,
      currentValue: 268,
      direction: 'decrease',
      isPrimary: true,
      updateFrequency: 'weekly'
    },
    {
      metricName: 'body_fat_percent',
      metricType: 'numeric',
      metricUnit: '%',
      startingValue: 20,
      targetValue: 15,
      currentValue: 19.5,
      direction: 'decrease',
      isPrimary: false,
      updateFrequency: 'monthly'
    }
  ]
};

// Example 2: Strength Goal
const strengthGoal = {
  userId: '11111',
  goalName: 'Increase Bench Press by 50 lbs',
  goalCategory: 'strength',
  goalType: 'strength',
  description: 'Increase bench press 1RM from 200 to 250 pounds',
  startDate: '2026-01-15',
  targetDate: '2026-04-15',
  whyImportant: 'Build upper body strength and confidence',
  motivationLevel: 8,
  metrics: [
    {
      metricName: 'bench_press_1rm',
      metricType: 'numeric',
      metricUnit: 'lb',
      startingValue: 200,
      targetValue: 250,
      currentValue: 215,
      direction: 'increase',
      isPrimary: true,
      updateFrequency: 'weekly'
    },
    {
      metricName: 'squat_1rm',
      metricType: 'numeric',
      metricUnit: 'lb',
      startingValue: 225,
      targetValue: 275,
      currentValue: 235,
      direction: 'increase',
      isPrimary: false,
      updateFrequency: 'weekly'
    }
  ]
};

// Example 3: Health Goal
const healthGoal = {
  userId: '11111',
  goalName: 'Improve Sleep Quality',
  goalCategory: 'health',
  goalType: 'health',
  description: 'Consistently get 8 hours of quality sleep per night',
  startDate: '2026-02-01',
  targetDate: '2026-03-01',
  whyImportant: 'Better recovery and mental clarity',
  motivationLevel: 7,
  metrics: [
    {
      metricName: 'sleep_duration_hours',
      metricType: 'numeric',
      metricUnit: 'hours',
      startingValue: 6.5,
      targetValue: 8,
      currentValue: 7.2,
      direction: 'increase',
      isPrimary: true,
      updateFrequency: 'daily'
    },
    {
      metricName: 'resting_heart_rate',
      metricType: 'numeric',
      metricUnit: 'bpm',
      startingValue: 72,
      targetValue: 65,
      currentValue: 70,
      direction: 'decrease',
      isPrimary: false,
      updateFrequency: 'weekly'
    }
  ]
};

// Example 4: Endurance Goal
const enduranceGoal = {
  userId: '11111',
  goalName: 'Run 5K Without Stopping',
  goalCategory: 'endurance',
  goalType: 'endurance',
  description: 'Build cardiovascular endurance to run 5K continuously',
  startDate: '2026-01-01',
  targetDate: '2026-03-01',
  whyImportant: 'Improve cardiovascular health and fitness',
  motivationLevel: 8,
  metrics: [
    {
      metricName: 'running_distance',
      metricType: 'numeric',
      metricUnit: 'miles',
      startingValue: 1,
      targetValue: 3.1, // 5K
      currentValue: 2.2,
      direction: 'increase',
      isPrimary: true,
      updateFrequency: 'weekly'
    },
    {
      metricName: 'resting_heart_rate',
      metricType: 'numeric',
      metricUnit: 'bpm',
      startingValue: 72,
      targetValue: 60,
      currentValue: 68,
      direction: 'decrease',
      isPrimary: false,
      updateFrequency: 'weekly'
    }
  ]
};

// Example 5: Muscle Gain Goal
const muscleGainGoal = {
  userId: '11111',
  goalName: 'Gain 10 Pounds of Muscle',
  goalCategory: 'muscle_gain',
  goalType: 'muscle_gain',
  description: 'Gain 10 pounds of lean muscle mass through resistance training',
  startDate: '2026-01-01',
  targetDate: '2026-04-01',
  whyImportant: 'Improve body composition and strength',
  motivationLevel: 9,
  metrics: [
    {
      metricName: 'lean_body_mass',
      metricType: 'numeric',
      metricUnit: 'lb',
      startingValue: 216, // 80% of 270lb at 20% body fat
      targetValue: 226,
      currentValue: 218,
      direction: 'increase',
      isPrimary: true,
      updateFrequency: 'monthly'
    },
    {
      metricName: 'body_fat_percent',
      metricType: 'numeric',
      metricUnit: '%',
      startingValue: 20,
      targetValue: 18,
      currentValue: 19.5,
      direction: 'decrease',
      isPrimary: false,
      updateFrequency: 'monthly'
    }
  ]
};

async function loadGoalExamples() {
  try {
    console.log('Loading goal examples...');
    
    const goals = [weightLossGoal, strengthGoal, healthGoal, enduranceGoal, muscleGainGoal];
    
    for (const goalData of goals) {
      console.log(`\nLoading goal: ${goalData.goalName}`);
      
      // Create goal
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: goalData.userId,
          goal_name: goalData.goalName,
          goal_category: goalData.goalCategory,
          goal_type: goalData.goalType,
          description: goalData.description,
          start_date: goalData.startDate,
          target_date: goalData.targetDate,
          why_important: goalData.whyImportant,
          motivation_level: goalData.motivationLevel,
          status: 'active'
        })
        .select()
        .single();
      
      if (goalError) {
        console.error('Error creating goal:', goalError);
        continue;
      }
      
      console.log(`Created goal with ID: ${goal.id}`);
      
      // Create metrics
      for (const metric of goalData.metrics) {
        const { data: metricData, error: metricError } = await supabase
          .from('goal_metrics')
          .insert({
            goal_id: goal.id,
            metric_name: metric.metricName,
            metric_type: metric.metricType,
            metric_unit: metric.metricUnit,
            starting_value: metric.startingValue,
            target_value: metric.targetValue,
            current_value: metric.currentValue,
            direction: metric.direction,
            is_primary: metric.isPrimary,
            update_frequency: metric.updateFrequency
          })
          .select()
          .single();
        
        if (metricError) {
          console.error('Error creating metric:', metricError);
        } else {
          console.log(`  Created metric: ${metric.metricName}`);
        }
      }
      
      // Create default milestones
      const milestones = [25, 50, 75, 100];
      for (let i = 0; i < milestones.length; i++) {
        const { error: milestoneError } = await supabase
          .from('goal_milestones')
          .insert({
            goal_id: goal.id,
            milestone_name: `${milestones[i]}% Complete`,
            milestone_percentage: milestones[i],
            milestone_order: i + 1,
            celebration_message: getMilestoneMessage(milestones[i]),
            celebration_emoji: getMilestoneEmoji(milestones[i])
          });
        
        if (milestoneError) {
          console.error('Error creating milestone:', milestoneError);
        }
      }
    }
    
    console.log('\nAll goal examples loaded successfully!');
    
    // Verify loaded goals
    const { data: activeGoals, error: verifyError } = await supabase
      .rpc('get_active_goals', { p_user_id: '11111' });
    
    if (verifyError) {
      console.error('Error verifying goals:', verifyError);
    } else {
      console.log(`\nVerification: Found ${activeGoals.length} active goals`);
      activeGoals.forEach(goal => {
        console.log(`- ${goal.goal_name}: ${goal.progress_percentage}% complete, ${goal.days_remaining} days remaining`);
      });
    }
    
  } catch (error) {
    console.error('Error loading goal examples:', error);
  }
}

function getMilestoneMessage(percentage) {
  const messages = {
    25: "Great start! You're 25% there! Keep up the momentum! \ud83d\udcaa",
    50: "Halfway there! You're crushing it! \ud83c\udfaf",
    75: "Almost there! 75% complete! The finish line is in sight! \ud83c\udfc3",
    100: "\ud83c\udf89 GOAL ACHIEVED! You did it! Incredible work! \ud83c\udfc6"
  };
  return messages[percentage] || `${percentage}% complete! Keep going!`;
}

function getMilestoneEmoji(percentage) {
  const emojis = {
    25: '\ud83c\udf1f',
    50: '\ud83d\udd25',
    75: '\u26a1',
    100: '\ud83c\udfc6'
  };
  return emojis[percentage] || '\u2728';
}

loadGoalExamples();
