-- Update bloodwork_recommendations check constraint to include new V2 recommendation types
-- This migration adds: liver, kidney, hematology, thyroid, nutritional, prostate to the recommendation_type check constraint

-- First, drop the existing check constraint
ALTER TABLE bloodwork_recommendations 
DROP CONSTRAINT IF EXISTS bloodwork_recommendations_recommendation_type_check;

-- Add the updated check constraint with all V2 types
ALTER TABLE bloodwork_recommendations 
ADD CONSTRAINT bloodwork_recommendations_recommendation_type_check 
CHECK (recommendation_type IN (
  'cardiovascular',
  'metabolic',
  'hormonal',
  'inflammation',
  'liver',
  'kidney',
  'hematology',
  'thyroid',
  'nutritional',
  'prostate',
  'follow_up',
  'monitoring',
  'lifestyle',
  'supplement_review',
  'workout_review'
));

-- Verify the constraint was added
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'bloodwork_recommendations'::regclass
  AND conname = 'bloodwork_recommendations_recommendation_type_check';
