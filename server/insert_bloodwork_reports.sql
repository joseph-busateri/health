-- ===============================================================
-- BLOODWORK DATA INGESTION - TWO REPORTS
-- ===============================================================
-- Report 1: June 12, 2023 (Accession A07026360000598) - 47 analytes
-- Report 2: August 2, 2023 (Accession A07026360000695) - 41 analytes
-- ===============================================================
-- IMPORTANT: Replace '<USER_ID>' with your actual user_id before running
-- ===============================================================

BEGIN;

-- ===============================================================
-- REPORT 1: JUNE 12, 2023 (A07026360000598)
-- ===============================================================

-- Insert Document Record
INSERT INTO bloodwork_documents (
  user_id,
  file_url,
  file_name,
  document_type,
  source,
  test_date,
  parse_status,
  processing_status,
  accession_number,
  account_name,
  patient_sex,
  patient_dob,
  specimen_datetime,
  final_reported_datetime,
  panel_names_detected,
  extraction_confidence
) VALUES (
  '<USER_ID>',
  'manual://bloodwork_2023-06-12',
  'bloodwork_2023-06-12.pdf',
  'comprehensive',
  'manual_upload',
  '2023-06-12',
  'parsed',
  'complete',
  'A07026360000598',
  'Joseph Busateri',
  'Male',
  '1967-01-05',
  '2023-06-12 16:10:00+00',
  '2023-06-13 11:34:00+00',
  ARRAY['Hormones & Related Tests', 'Complete Blood Count (CBC)', 'Differential', 'Absolute Counts', 'Comprehensive Metabolic Panel (CMP)'],
  1.0
);

-- Capture document_id for Report 1
-- In Supabase SQL Editor, you'll need to get this ID and use it below
-- Or use a variable if your SQL client supports it

-- For now, we'll use a CTE to capture the ID
WITH doc1 AS (
  SELECT id FROM bloodwork_documents WHERE accession_number = 'A07026360000598'
)

-- ===============================================================
-- REPORT 1: HORMONES & RELATED TESTS (3 analytes)
-- ===============================================================

INSERT INTO bloodwork_results (document_id, user_id, raw_test_name, normalized_test_name, category, panel_name, value_text, value_numeric, unit, reference_range_low, reference_range_high, reference_range_text, abnormal_flag, test_date, lab_timestamp, source, confidence)
SELECT id, '<USER_ID>', 'Estradiol', 'Estradiol', 'Hormonal', 'Hormones & Related Tests', '16.8', 16.8, 'pg/mL', 11.3, 43.2, '11.3 – 43.2', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Testosterone, Total', 'Testosterone Total', 'Hormonal', 'Hormones & Related Tests', '817', 817.0, 'ng/dL', 200.0, 800.0, '200 – 800', 'H', '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Sex Hormone Binding Globulin', 'SHBG', 'Hormonal', 'Hormones & Related Tests', '27.3', 27.3, 'nmol/L', NULL, NULL, '—', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1

-- ===============================================================
-- REPORT 1: COMPLETE BLOOD COUNT (10 analytes)
-- ===============================================================

UNION ALL
SELECT id, '<USER_ID>', 'WBC', 'White Blood Cell Count', 'Hematology', 'Complete Blood Count (CBC)', '10.8', 10.8, '10³/µL', 3.6, 10.2, '3.6 – 10.2', 'H', '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'RBC', 'Red Blood Cell Count', 'Hematology', 'Complete Blood Count (CBC)', '6.32', 6.32, '10⁶/µL', 4.40, 6.00, '4.40 – 6.00', 'H', '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Hemoglobin (HGB)', 'Hemoglobin', 'Hematology', 'Complete Blood Count (CBC)', '18.1', 18.1, 'g/dL', 13.2, 18.0, '13.2 – 18.0', 'H', '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Hematocrit (HCT)', 'Hematocrit', 'Hematology', 'Complete Blood Count (CBC)', '52.4', 52.4, '%', 41.0, 55.0, '41.0 – 55.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'MCV', 'Mean Corpuscular Volume', 'Hematology', 'Complete Blood Count (CBC)', '82.9', 82.9, 'fL', 82.0, 99.0, '82.0 – 99.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'MCH', 'Mean Corpuscular Hemoglobin', 'Hematology', 'Complete Blood Count (CBC)', '28.6', 28.6, 'pg', 27.0, 33.0, '27.0 – 33.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'MCHC', 'Mean Corpuscular Hemoglobin Concentration', 'Hematology', 'Complete Blood Count (CBC)', '34.5', 34.5, 'g/dL', 32.0, 36.0, '32.0 – 36.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'RDW', 'Red Cell Distribution Width', 'Hematology', 'Complete Blood Count (CBC)', '13.1', 13.1, '%', 11.0, 15.0, '11.0 – 15.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Platelets (PLT)', 'Platelet Count', 'Hematology', 'Complete Blood Count (CBC)', '216', 216.0, '10³/µL', 150.0, 450.0, '150 – 450', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'MPV', 'Mean Platelet Volume', 'Hematology', 'Complete Blood Count (CBC)', '11.9', 11.9, 'fL', 9.8, 12.7, '9.8 – 12.7', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1

-- ===============================================================
-- REPORT 1: DIFFERENTIAL (6 analytes)
-- ===============================================================

UNION ALL
SELECT id, '<USER_ID>', 'Neutrophils', 'Neutrophils', 'Hematology', 'Differential', '64.8', 64.8, '%', 37.0, 72.0, '37.0 – 72.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Lymphocytes', 'Lymphocytes', 'Hematology', 'Differential', '24.4', 24.4, '%', 16.0, 48.0, '16.0 – 48.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Monocytes', 'Monocytes', 'Hematology', 'Differential', '7.8', 7.8, '%', 4.0, 14.0, '4.0 – 14.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Eosinophils', 'Eosinophils', 'Hematology', 'Differential', '1.9', 1.9, '%', 0.0, 9.0, '0.0 – 9.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Basophils', 'Basophils', 'Hematology', 'Differential', '0.5', 0.5, '%', 0.0, 2.0, '0.0 – 2.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Immature Granulocytes', 'Immature Granulocytes', 'Hematology', 'Differential', '0.6', 0.6, '%', NULL, NULL, 'No defined range', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1

-- ===============================================================
-- REPORT 1: ABSOLUTE COUNTS (6 analytes)
-- ===============================================================

UNION ALL
SELECT id, '<USER_ID>', 'Absolute Neutrophils', 'Absolute Neutrophils', 'Hematology', 'Absolute Counts', '7.0', 7.0, '10³/µL', 1.1, 6.0, '1.1 – 6.0', 'H', '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Absolute Lymphocytes', 'Absolute Lymphocytes', 'Hematology', 'Absolute Counts', '2.6', 2.6, '10³/µL', 0.7, 3.4, '0.7 – 3.4', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Absolute Monocytes', 'Absolute Monocytes', 'Hematology', 'Absolute Counts', '0.8', 0.8, '10³/µL', 0.3, 1.0, '0.3 – 1.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Absolute Eosinophils', 'Absolute Eosinophils', 'Hematology', 'Absolute Counts', '0.2', 0.2, '10³/µL', 0.0, 0.6, '0.0 – 0.6', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Absolute Basophils', 'Absolute Basophils', 'Hematology', 'Absolute Counts', '0.1', 0.1, '10³/µL', 0.0, 0.1, '0.0 – 0.1', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Absolute NRBCs', 'Absolute NRBCs', 'Hematology', 'Absolute Counts', '0.0', 0.0, '10³/µL', 0.0, 0.0, '0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1

-- ===============================================================
-- REPORT 1: COMPREHENSIVE METABOLIC PANEL (16 analytes)
-- ===============================================================

UNION ALL
SELECT id, '<USER_ID>', 'Sodium', 'Sodium', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '140', 140.0, 'mmol/L', 133.0, 146.0, '133 – 146', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Potassium', 'Potassium', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '4.4', 4.4, 'mmol/L', 3.5, 5.1, '3.5 – 5.1', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Chloride', 'Chloride', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '102', 102.0, 'mmol/L', 98.0, 107.0, '98 – 107', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Carbon Dioxide', 'Carbon Dioxide', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '27', 27.0, 'mmol/L', 21.0, 31.0, '21 – 31', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Anion Gap', 'Anion Gap', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '11', 11.0, 'mmol/L', 4.0, 13.0, '4 – 13', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Blood Urea Nitrogen', 'BUN', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '11', 11.0, 'mg/dL', 7.0, 25.0, '7 – 25', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Creatinine', 'Creatinine', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '1.27', 1.27, 'mg/dL', 0.60, 1.30, '0.60 – 1.30', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'eGFR (CKD EPI 2021)', 'eGFR', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '66', 66.0, 'mL/min/1.73m²', 60.0, NULL, '≥ 60', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Calcium', 'Calcium', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '10.1', 10.1, 'mg/dL', 8.3, 10.5, '8.3 – 10.5', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Glucose', 'Glucose', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '150', 150.0, 'mg/dL', 70.0, 100.0, '70 – 100', 'H', '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Total Protein', 'Total Protein', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '6.8', 6.8, 'g/dL', 6.4, 8.3, '6.4 – 8.3', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Albumin', 'Albumin', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '4.5', 4.5, 'g/dL', 3.5, 5.0, '3.5 – 5.0', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'ALT', 'ALT', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '28', 28.0, 'U/L', 11.0, 51.0, '11 – 51', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'AST', 'AST', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '24', 24.0, 'U/L', 13.0, 39.0, '13 – 39', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Alkaline Phosphatase', 'Alkaline Phosphatase', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '80', 80.0, 'U/L', 34.0, 104.0, '34 – 104', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1
UNION ALL
SELECT id, '<USER_ID>', 'Total Bilirubin', 'Total Bilirubin', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '0.6', 0.6, 'mg/dL', 0.2, 1.2, '0.2 – 1.2', NULL, '2023-06-12'::timestamp, '2023-06-12 16:10:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc1;

-- ===============================================================
-- REPORT 2: AUGUST 2, 2023 (A07026360000695)
-- ===============================================================

-- Insert Document Record
INSERT INTO bloodwork_documents (
  user_id,
  file_url,
  file_name,
  document_type,
  source,
  test_date,
  parse_status,
  processing_status,
  accession_number,
  account_name,
  patient_sex,
  patient_dob,
  specimen_datetime,
  final_reported_datetime,
  panel_names_detected,
  extraction_confidence
) VALUES (
  '<USER_ID>',
  'manual://bloodwork_2023-08-02',
  'bloodwork_2023-08-02.pdf',
  'comprehensive',
  'manual_upload',
  '2023-08-02',
  'parsed',
  'complete',
  'A07026360000695',
  'Joseph Busateri',
  'Male',
  '1967-01-05',
  '2023-08-02 11:50:00+00',
  '2023-08-03 09:47:00+00',
  ARRAY['Hormones & Related Tests', 'Complete Blood Count (CBC)', 'Differential', 'Absolute Counts', 'Comprehensive Metabolic Panel (CMP)'],
  1.0
);

-- Capture document_id for Report 2
WITH doc2 AS (
  SELECT id FROM bloodwork_documents WHERE accession_number = 'A07026360000695'
)

-- ===============================================================
-- REPORT 2: HORMONES & RELATED TESTS (3 analytes)
-- ===============================================================

INSERT INTO bloodwork_results (document_id, user_id, raw_test_name, normalized_test_name, category, panel_name, value_text, value_numeric, unit, reference_range_low, reference_range_high, reference_range_text, abnormal_flag, test_date, lab_timestamp, source, confidence)
SELECT id, '<USER_ID>', 'Estradiol', 'Estradiol', 'Hormonal', 'Hormones & Related Tests', '26.8', 26.8, 'pg/mL', 11.3, 43.2, '11.3 – 43.2', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Testosterone, Total', 'Testosterone Total', 'Hormonal', 'Hormones & Related Tests', '966', 966.0, 'ng/dL', 200.0, 800.0, '200 – 800', 'H', '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Sex Hormone Binding Globulin', 'SHBG', 'Hormonal', 'Hormones & Related Tests', '23.4', 23.4, 'nmol/L', NULL, NULL, '—', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2

-- ===============================================================
-- REPORT 2: COMPLETE BLOOD COUNT (10 analytes)
-- ===============================================================

UNION ALL
SELECT id, '<USER_ID>', 'WBC', 'White Blood Cell Count', 'Hematology', 'Complete Blood Count (CBC)', '8.2', 8.2, '10³/µL', 3.6, 10.2, '3.6 – 10.2', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'RBC', 'Red Blood Cell Count', 'Hematology', 'Complete Blood Count (CBC)', '6.72', 6.72, '10⁶/µL', 4.40, 6.00, '4.40 – 6.00', 'H', '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Hemoglobin (HGB)', 'Hemoglobin', 'Hematology', 'Complete Blood Count (CBC)', '18.9', 18.9, 'g/dL', 13.2, 18.0, '13.2 – 18.0', 'H', '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Hematocrit (HCT)', 'Hematocrit', 'Hematology', 'Complete Blood Count (CBC)', '55.6', 55.6, '%', 41.0, 55.0, '41.0 – 55.0', 'H', '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'MCV', 'Mean Corpuscular Volume', 'Hematology', 'Complete Blood Count (CBC)', '82.7', 82.7, 'fL', 82.0, 99.0, '82.0 – 99.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'MCH', 'Mean Corpuscular Hemoglobin', 'Hematology', 'Complete Blood Count (CBC)', '28.1', 28.1, 'pg', 27.0, 33.0, '27.0 – 33.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'MCHC', 'Mean Corpuscular Hemoglobin Concentration', 'Hematology', 'Complete Blood Count (CBC)', '34.0', 34.0, 'g/dL', 32.0, 36.0, '32.0 – 36.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'RDW', 'Red Cell Distribution Width', 'Hematology', 'Complete Blood Count (CBC)', '14.5', 14.5, '%', 11.0, 15.0, '11.0 – 15.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Platelets (PLT)', 'Platelet Count', 'Hematology', 'Complete Blood Count (CBC)', '194', 194.0, '10³/µL', 150.0, 450.0, '150 – 450', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'MPV', 'Mean Platelet Volume', 'Hematology', 'Complete Blood Count (CBC)', '11.6', 11.6, 'fL', 9.8, 12.7, '9.8 – 12.7', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2

-- ===============================================================
-- REPORT 2: DIFFERENTIAL (6 analytes)
-- ===============================================================

UNION ALL
SELECT id, '<USER_ID>', 'Neutrophils', 'Neutrophils', 'Hematology', 'Differential', '58.5', 58.5, '%', 37.0, 72.0, '37.0 – 72.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Lymphocytes', 'Lymphocytes', 'Hematology', 'Differential', '28.9', 28.9, '%', 16.0, 48.0, '16.0 – 48.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Monocytes', 'Monocytes', 'Hematology', 'Differential', '8.3', 8.3, '%', 4.0, 14.0, '4.0 – 14.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Eosinophils', 'Eosinophils', 'Hematology', 'Differential', '3.2', 3.2, '%', 0.0, 9.0, '0.0 – 9.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Basophils', 'Basophils', 'Hematology', 'Differential', '0.5', 0.5, '%', 0.0, 2.0, '0.0 – 2.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Immature Granulocytes', 'Immature Granulocytes', 'Hematology', 'Differential', '0.6', 0.6, '%', NULL, NULL, 'No defined range', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2

-- ===============================================================
-- REPORT 2: ABSOLUTE COUNTS (6 analytes)
-- ===============================================================

UNION ALL
SELECT id, '<USER_ID>', 'Absolute Neutrophils', 'Absolute Neutrophils', 'Hematology', 'Absolute Counts', '4.8', 4.8, '10³/µL', 1.1, 6.0, '1.1 – 6.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Absolute Lymphocytes', 'Absolute Lymphocytes', 'Hematology', 'Absolute Counts', '2.4', 2.4, '10³/µL', 0.7, 3.4, '0.7 – 3.4', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Absolute Monocytes', 'Absolute Monocytes', 'Hematology', 'Absolute Counts', '0.7', 0.7, '10³/µL', 0.3, 1.0, '0.3 – 1.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Absolute Eosinophils', 'Absolute Eosinophils', 'Hematology', 'Absolute Counts', '0.3', 0.3, '10³/µL', 0.0, 0.6, '0.0 – 0.6', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Absolute Basophils', 'Absolute Basophils', 'Hematology', 'Absolute Counts', '0.0', 0.0, '10³/µL', 0.0, 0.1, '0.0 – 0.1', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Absolute NRBCs', 'Absolute NRBCs', 'Hematology', 'Absolute Counts', '0.0', 0.0, '10³/µL', 0.0, 0.0, '0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2

-- ===============================================================
-- REPORT 2: COMPREHENSIVE METABOLIC PANEL (16 analytes)
-- ===============================================================

UNION ALL
SELECT id, '<USER_ID>', 'Sodium', 'Sodium', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '141', 141.0, 'mmol/L', 133.0, 146.0, '133 – 146', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Potassium', 'Potassium', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '4.6', 4.6, 'mmol/L', 3.5, 5.1, '3.5 – 5.1', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Chloride', 'Chloride', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '103', 103.0, 'mmol/L', 98.0, 107.0, '98 – 107', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Carbon Dioxide', 'Carbon Dioxide', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '26', 26.0, 'mmol/L', 21.0, 31.0, '21 – 31', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Anion Gap', 'Anion Gap', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '12', 12.0, 'mmol/L', 4.0, 13.0, '4 – 13', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Blood Urea Nitrogen', 'BUN', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '13', 13.0, 'mg/dL', 7.0, 25.0, '7 – 25', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Creatinine', 'Creatinine', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '1.28', 1.28, 'mg/dL', 0.60, 1.30, '0.60 – 1.30', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'eGFR (CKD EPI 2021)', 'eGFR', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '66', 66.0, 'mL/min/1.73m²', 60.0, NULL, '≥ 60', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Calcium', 'Calcium', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '9.5', 9.5, 'mg/dL', 8.3, 10.5, '8.3 – 10.5', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Glucose', 'Glucose', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '131', 131.0, 'mg/dL', 70.0, 100.0, '70 – 100', 'H', '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Total Protein', 'Total Protein', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '7.2', 7.2, 'g/dL', 6.4, 8.3, '6.4 – 8.3', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Albumin', 'Albumin', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '4.7', 4.7, 'g/dL', 3.5, 5.0, '3.5 – 5.0', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'ALT', 'ALT', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '41', 41.0, 'U/L', 11.0, 51.0, '11 – 51', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'AST', 'AST', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '32', 32.0, 'U/L', 13.0, 39.0, '13 – 39', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Alkaline Phosphatase', 'Alkaline Phosphatase', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '83', 83.0, 'U/L', 34.0, 104.0, '34 – 104', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2
UNION ALL
SELECT id, '<USER_ID>', 'Total Bilirubin', 'Total Bilirubin', 'Metabolic', 'Comprehensive Metabolic Panel (CMP)', '0.8', 0.8, 'mg/dL', 0.2, 1.2, '0.2 – 1.2', NULL, '2023-08-02'::timestamp, '2023-08-02 11:50:00+00'::timestamptz, 'manual_entry', 1.0 FROM doc2;

COMMIT;

-- ===============================================================
-- VERIFICATION QUERIES
-- ===============================================================

-- Check document count
SELECT COUNT(*) as document_count FROM bloodwork_documents;

-- Check results count per document
SELECT 
  d.accession_number,
  d.test_date,
  COUNT(r.id) as result_count
FROM bloodwork_documents d
LEFT JOIN bloodwork_results r ON r.document_id = d.id
GROUP BY d.id, d.accession_number, d.test_date
ORDER BY d.test_date;

-- Expected output:
-- A0702636000