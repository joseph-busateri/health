-- Insert comprehensive supplement stack for user 550e8400-e29b-41d4-a716-446655440000
DO $$
DECLARE
  v_stack_id uuid := 'a24592ae-a595-44da-a1c8-2eb92123547a';
BEGIN
  -- Clean up any existing supplements for this stack version (if re-running)
  DELETE FROM supplements WHERE stack_version_id = v_stack_id;
  DELETE FROM supplement_inventory WHERE supplement_id IN (SELECT id FROM supplements WHERE stack_version_id = v_stack_id);
  DELETE FROM supplement_adherence_log WHERE stack_version_id = v_stack_id;
  DELETE FROM supplement_stack_changes WHERE to_version_id = v_stack_id;

  INSERT INTO supplements (
    stack_version_id,
    supplement_name,
    brand,
    form,
    dosage_amount,
    dosage_unit,
    timing,
    frequency,
    times_per_day,
    goal,
    reason_to_take,
    take_with_food,
    take_with_water,
    status,
    supplement_order
  ) VALUES
    (v_stack_id, 'Ashwagandha', NULL, 'capsule', 600, 'mg', 'morning', 'daily', 1, 'Stress Adaptation', 'Supports cortisol regulation and resilience', false, true, 'active', 1),
    (v_stack_id, 'Beetroot Powder', NULL, 'powder', 1000, 'mg', 'morning', 'daily', 1, 'Cardiovascular', 'Supports nitric oxide and blood flow', false, true, 'active', 2),
    (v_stack_id, 'Berberine', NULL, 'capsule', 2000, 'mg', 'with meals', '3x daily', 3, 'Metabolic', 'Supports glucose metabolism', true, true, 'active', 3),
    (v_stack_id, 'Boron', NULL, 'capsule', 10, 'mg', 'morning', 'daily', 1, 'Hormonal/Bone', 'Supports testosterone and bone health', false, true, 'active', 4),
    (v_stack_id, 'BPC-157 (oral)', NULL, 'capsule', 0.5, 'mg', 'morning', '2x daily', 2, 'Recovery', 'Supports gut and tissue healing', false, true, 'active', 5),
    (v_stack_id, 'Ceylon Cinnamon', NULL, 'capsule', 600, 'mg', 'with meals', '3x daily', 3, 'Metabolic', 'Supports insulin sensitivity', true, true, 'active', 6),
    (v_stack_id, 'Citrus Bergamot', NULL, 'capsule', 600, 'mg', 'morning', 'daily', 1, 'Cardiovascular', 'Supports lipid profile', false, true, 'active', 7),
    (v_stack_id, 'Collagen Peptides', NULL, 'powder', 10, 'g', 'morning', '2x daily', 2, 'Joint/Skin', 'Supports connective tissue and skin', true, true, 'active', 8),
    (v_stack_id, 'CoQ10 (Ubiquinol)', NULL, 'softgel', 200, 'mg', 'morning', 'daily', 1, 'Energy', 'Supports mitochondrial function', true, true, 'active', 9),
    (v_stack_id, 'Creatine Monohydrate', NULL, 'powder', 2.5, 'g', 'morning', '2x daily', 2, 'Performance', 'Supports strength and power', true, true, 'active', 10),
    (v_stack_id, 'DHEA', NULL, 'capsule', 25, 'mg', 'morning', 'daily', 1, 'Hormonal', 'Supports androgen precursor levels', false, true, 'active', 11),
    (v_stack_id, 'Digestive Enzymes', NULL, 'capsule', 620, 'mg', 'with meals', '3x daily', 3, 'Digestion', 'Supports nutrient breakdown', true, true, 'active', 12),
    (v_stack_id, 'Fenugreek', NULL, 'capsule', 600, 'mg', 'afternoon', 'daily', 1, 'Hormonal', 'Supports testosterone', false, true, 'active', 13),
    (v_stack_id, 'GABA', NULL, 'capsule', 750, 'mg', 'bedtime', 'daily', 1, 'Sleep', 'Supports relaxation and sleep onset', false, true, 'active', 14),
    (v_stack_id, 'Ginger Root Extract', NULL, 'capsule', 2200, 'mg', 'morning', 'daily', 1, 'Digestion', 'Supports gastrointestinal comfort', false, true, 'active', 15),
    (v_stack_id, 'Glucosamine', NULL, 'tablet', 900, 'mg', 'morning', '2x daily', 2, 'Joint', 'Supports cartilage health', true, true, 'active', 16),
    (v_stack_id, 'GlyNAC Powder', NULL, 'powder', 6, 'g', 'morning', '2x daily', 2, 'Recovery', 'Provides glycine and NAC for glutathione support', true, true, 'active', 17),
    (v_stack_id, 'Hibiscus Extract', NULL, 'capsule', 500, 'mg', 'morning', 'daily', 1, 'Cardiovascular', 'Supports healthy blood pressure', false, true, 'active', 18),
    (v_stack_id, 'L-Arginine', NULL, 'capsule', 3000, 'mg', 'afternoon', 'daily', 1, 'Performance', 'Supports nitric oxide production', false, true, 'active', 19),
    (v_stack_id, 'L-Carnitine', NULL, 'capsule', 1000, 'mg', 'afternoon', 'daily', 1, 'Energy', 'Supports fatty acid transport into mitochondria', false, true, 'active', 20),
    (v_stack_id, 'L-Citrulline', NULL, 'powder', 4500, 'mg', 'morning', '2x daily', 2, 'Performance', 'Supports nitric oxide and endurance', false, true, 'active', 21),
    (v_stack_id, 'L-Glycine', NULL, 'powder', 1, 'g', 'bedtime', 'daily', 1, 'Sleep', 'Supports sleep quality and collagen synthesis', false, true, 'active', 22),
    (v_stack_id, 'L-Leucine', NULL, 'powder', 2, 'g', 'morning', '2x daily', 2, 'Performance', 'Supports muscle protein synthesis', true, true, 'active', 23),
    (v_stack_id, 'Maca Root', NULL, 'capsule', 1500, 'mg', 'morning', 'daily', 1, 'Hormonal', 'Supports libido and energy', false, true, 'active', 24),
    (v_stack_id, 'Magnesium Glycinate', NULL, 'capsule', 420, 'mg', 'bedtime', 'daily', 1, 'Recovery', 'Supports sleep and muscle relaxation', false, true, 'active', 25),
    (v_stack_id, 'Methylated Multivitamin', NULL, 'tablet', 2, 'tablet', 'morning', 'daily', 1, 'Foundation', 'Provides baseline micronutrient support', true, true, 'active', 26),
    (v_stack_id, 'Methylcobalamin + Adenosylcobalamin B12', NULL, 'capsule', 1000, 'mcg', 'morning', 'daily', 1, 'Energy', 'Supports methylation and nerve health', false, true, 'active', 27),
    (v_stack_id, 'Mucuna Pruriens', NULL, 'capsule', 400, 'mg', 'morning', 'daily', 1, 'Hormonal', 'Supports dopamine and testosterone', false, true, 'active', 28),
    (v_stack_id, 'Nattokinase', NULL, 'capsule', 4000, 'FU', 'morning', '2x daily', 2, 'Cardiovascular', 'Supports fibrinolysis and circulation', false, true, 'active', 29),
    (v_stack_id, 'NMN — Liposomal', NULL, 'capsule', 500, 'mg', 'morning', 'daily', 1, 'Longevity', 'Supports NAD+ levels and cellular energy', false, true, 'active', 30),
    (v_stack_id, 'Omega-3', NULL, 'softgel', 1, 'g', 'morning', '2x daily', 2, 'Cardiovascular', 'Provides EPA/DHA for heart and brain health', true, true, 'active', 31),
    (v_stack_id, 'Panax Ginseng', NULL, 'capsule', 500, 'mg', 'morning', 'daily', 1, 'Energy', 'Supports energy and resilience', false, true, 'active', 32),
    (v_stack_id, 'Pine Bark / Pycnogenol', NULL, 'capsule', 6000, 'mg', 'morning', 'daily', 1, 'Cardiovascular', 'Supports endothelial function and circulation', false, true, 'active', 33),
    (v_stack_id, 'Potassium Citrate', NULL, 'capsule', 99, 'mg', 'morning', '2x daily', 2, 'Electrolyte', 'Supports electrolyte balance and hydration', true, true, 'active', 34),
    (v_stack_id, 'Ruge Ready (ED med)', NULL, 'tablet', 1, 'dose', 'as needed', 'as needed', 1, 'Performance', 'As prescribed for erectile function support', true, true, 'active', 35),
    (v_stack_id, 'Saffron', NULL, 'capsule', 88.5, 'mg', 'afternoon', 'daily', 1, 'Mood', 'Supports mood and cognitive performance', false, true, 'active', 36),
    (v_stack_id, 'Selenium', NULL, 'capsule', 200, 'mcg', 'morning', 'daily', 1, 'Thyroid', 'Supports thyroid hormone conversion and antioxidant status', false, true, 'active', 37),
    (v_stack_id, 'Taurine', NULL, 'capsule', 3, 'g', 'bedtime', 'daily', 1, 'Recovery', 'Supports cellular hydration and calming', false, true, 'active', 38),
    (v_stack_id, 'TMG (Trimethylglycine / Betaine)', NULL, 'capsule', 750, 'mg', 'morning', 'daily', 1, 'Methylation', 'Supports homocysteine metabolism and methyl donors', false, true, 'active', 39),
    (v_stack_id, 'TRT (Testosterone)', NULL, 'injection', 160, 'mg', 'anytime', '2x weekly', 1, 'Hormonal', 'Testosterone replacement therapy', false, true, 'active', 40),
    (v_stack_id, 'Turmeric (Curcumin)', NULL, 'capsule', 1600, 'mg', 'morning', 'daily', 1, 'Inflammation', 'Supports healthy inflammatory response', true, true, 'active', 41),
    (v_stack_id, 'Vitamin C', NULL, 'capsule', 1000, 'mg', 'morning', 'daily', 1, 'Immunity', 'Provides antioxidant and immune support', true, true, 'active', 42),
    (v_stack_id, 'Vitamin D3', NULL, 'capsule', 5000, 'IU', 'morning', 'daily', 1, 'Bone/Hormone', 'Supports vitamin D levels and bone health', false, true, 'active', 43),
    (v_stack_id, 'Vitamin K2 (MK-7)', NULL, 'capsule', 200, 'mcg', 'morning', 'daily', 1, 'Bone/Cardiovascular', 'Supports calcium metabolism and arterial health', false, true, 'active', 44),
    (v_stack_id, 'ZMA (Zinc/Magnesium/B6)', NULL, 'capsule', 3, 'capsule', 'bedtime', 'daily', 1, 'Recovery', 'Supports sleep quality and mineral status', false, true, 'active', 45);
END $$;

-- Seed inventory for the new supplements
INSERT INTO supplement_inventory (
  user_id,
  supplement_id,
  supplement_name,
  current_servings,
  servings_per_container,
  reorder_threshold,
  needs_reorder
)
SELECT
  '550e8400-e29b-41d4-a716-446655440000',
  s.id,
  s.supplement_name,
  60,
  60,
  7,
  false
FROM supplements s
WHERE s.stack_version_id = 'a24592ae-a595-44da-a1c8-2eb92123547a';

-- Seed a baseline adherence log for key supplements over last 7 days
INSERT INTO supplement_adherence_log (
  user_id,
  supplement_id,
  stack_version_id,
  scheduled_date,
  scheduled_time,
  taken,
  taken_at,
  planned_dosage_amount,
  actual_dosage_amount,
  dosage_unit,
  missed,
  side_effects_reported,
  perceived_effectiveness,
  notes
)
SELECT
  '550e8400-e29b-41d4-a716-446655440000',
  s.id,
  s.stack_version_id,
  CURRENT_DATE - i,
  CASE
    WHEN s.timing = 'morning' THEN 'morning'
    WHEN s.timing = 'afternoon' THEN 'afternoon'
    WHEN s.timing = 'bedtime' THEN 'bedtime'
    WHEN s.timing = 'with meals' THEN 'with meals'
    ELSE 'morning'
  END,
  true,
  (CURRENT_DATE - i)::timestamp +
    CASE
      WHEN s.timing = 'morning' THEN interval '08:00'
      WHEN s.timing = 'afternoon' THEN interval '14:00'
      WHEN s.timing = 'bedtime' THEN interval '21:00'
      WHEN s.timing = 'with meals' THEN interval '12:00'
      ELSE interval '08:00'
    END,
  s.dosage_amount,
  s.dosage_amount,
  s.dosage_unit,
  false,
  false,
  4,
  'Seeded adherence record'
FROM supplements s
CROSS JOIN generate_series(0, 6) AS i
WHERE s.stack_version_id = 'a24592ae-a595-44da-a1c8-2eb92123547a'
  AND s.supplement_name IN ('Vitamin D3', 'Magnesium Glycinate', 'Omega-3');

-- Record stack creation change event
INSERT INTO supplement_stack_changes (
  from_version_id,
  to_version_id,
  change_type,
  change_description,
  reason,
  triggered_by_bloodwork
) VALUES (
  NULL,
  'a24592ae-a595-44da-a1c8-2eb92123547a',
  'supplement_added',
  'Created comprehensive stack with 45 supplements',
  'Initial Phase 0-20 baseline alignment',
  false
);
