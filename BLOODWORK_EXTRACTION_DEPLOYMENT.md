# Bloodwork Extraction Engine - Deployment Guide

## Overview
This document provides the deployment instructions for the Bloodwork Extraction Engine, which includes database schema changes, API endpoints, and frontend components.

## Database Migration

### Required SQL Changes
The following SQL needs to be executed in your Supabase dashboard:

```sql
-- Create bloodwork_results table
CREATE TABLE IF NOT EXISTS bloodwork_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES bloodwork_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  raw_test_name TEXT NOT NULL,
  normalized_test_name TEXT,
  category TEXT,
  value_text TEXT,
  value_numeric DECIMAL(10, 4),
  unit TEXT,
  reference_range_low DECIMAL(10, 4),
  reference_range_high DECIMAL(10, 4),
  reference_range_text TEXT,
  abnormal_flag BOOLEAN,
  confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  test_date DATE,
  source TEXT DEFAULT 'extraction',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_user_id ON bloodwork_results(user_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_document_id ON bloodwork_results(document_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_normalized_name ON bloodwork_results(normalized_test_name) WHERE normalized_test_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_category ON bloodwork_results(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_test_date ON bloodwork_results(test_date) WHERE test_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_user_date ON bloodwork_results(user_id, test_date DESC) WHERE test_date IS NOT NULL;

-- Create RLS policies
ALTER TABLE bloodwork_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own results
CREATE POLICY "Users can read own bloodwork results" ON bloodwork_results
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own results
CREATE POLICY "Users can insert own bloodwork results" ON bloodwork_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own results
CREATE POLICY "Users can update own bloodwork results" ON bloodwork_results
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own results
CREATE POLICY "Users can delete own bloodwork results" ON bloodwork_results
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role full access to bloodwork_results" ON bloodwork_results
  FOR ALL USING (role() = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bloodwork_results_updated_at
  BEFORE UPDATE ON bloodwork_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Backend Components

### New Files Created
- `src/types/bloodworkResults.ts` - Type definitions for bloodwork results
- `src/services/bloodworkNormalizationService.ts` - Normalization logic for common markers
- `src/services/bloodworkExtractionService.ts` - Extraction and storage service
- `src/controllers/bloodworkResultsController.ts` - API controllers
- `src/routes/bloodworkResultsRoutes.ts` - API routes
- `src/scripts/validateBloodworkExtraction.ts` - Validation script

### Updated Files
- `src/types/database.ts` - Added bloodwork_results table definition
- `src/index.ts` - Added new routes

### API Endpoints Added
- `POST /bloodwork/parse/:document_id` - Parse bloodwork document
- `GET /bloodwork/results/:user_id` - Get user's bloodwork results
- `GET /bloodwork/results/document/:document_id` - Get results for specific document
- `GET /bloodwork/results/:user_id/timeline` - Get timeline view
- `PUT /bloodwork/results/:id` - Update bloodwork result
- `DELETE /bloodwork/results/document/:document_id` - Delete results for document

### New NPM Scripts
- `npm run validate:extraction` - Run extraction engine validation

## Frontend Components

### New Files Created
- `mobile/src/types/bloodworkResults.ts` - Frontend type definitions
- `mobile/src/services/bloodworkResultsService.ts` - API service layer
- `mobile/src/screens/BloodworkResultsScreen.tsx` - Results view screen
- `mobile/src/screens/BloodworkTimelineScreen.tsx` - Timeline view screen

### Features Implemented
- Bloodwork results display with filtering by category
- Timeline view with chronological data
- Confidence indicators and abnormal flags
- Expandable result details
- Chart placeholder for future trend visualization

## Normalization Support

### Supported Markers
**Cardiovascular:**
- LDL, LDL-C, HDL, Triglycerides, ApoB, hsCRP, Total Cholesterol

**Metabolic:**
- A1c, HbA1c, Glucose, Fasting Glucose, Insulin

**Hormonal:**
- Testosterone, Free Testosterone, SHBG, Estradiol

**General:**
- WBC, RBC, Hemoglobin, Hematocrit, Platelets
- Sodium, Potassium, Creatinine, eGFR
- ALT, AST, Total Bilirubin

### Normalization Features
- Exact matching (100% confidence)
- Contains matching (80% confidence)
- Fuzzy matching (70% confidence)
- Category classification
- Extensible rule system

## Validation

### Validation Script
Run `npm run validate:extraction` to test the complete extraction workflow:

1. **Database Schema** - Validates table structure and indexes
2. **Normalization** - Tests marker normalization accuracy
3. **Extraction** - Tests document parsing and result extraction
4. **Storage** - Validates result persistence
5. **API Endpoints** - Tests all API endpoints
6. **Timeline Data** - Validates timeline structure
7. **Cleanup** - Removes test data

### Expected Results
- 8/8 tests should pass
- 100% success rate for production readiness
- All API endpoints functional
- Database operations working correctly

## Architecture Design

### Key Principles
1. **Document-First**: Every result links to source document
2. **Flexible Schema**: Supports varying document formats
3. **Dual Storage**: Raw + normalized values preserved
4. **Confidence Tracking**: Extraction quality metrics
5. **Timeline Ready**: Chronological data organization
6. **Extensible**: Ready for AI enhancement

### Data Flow
```
Document Upload → Parse Request → Extraction Service → Normalization → Storage → API → Frontend
```

### Future Readiness
- **AI Parsing**: Architecture ready for ML enhancement
- **Trend Engine**: Data structured for analysis
- **Control Tower**: Integration points defined
- **Recommendations**: Foundation for insights
- **Review Workflow**: Confidence-based validation

## Testing

### Manual Testing Steps
1. Deploy database schema
2. Start backend server (`npm run dev`)
3. Upload a bloodwork document
4. Parse the document via API
5. View results in frontend
6. Validate timeline functionality

### Automated Testing
```bash
# Run full validation
npm run validate:extraction

# Test individual components
npm run test:supabase
npm run validate:bloodwork
```

## Troubleshooting

### Common Issues
1. **Table Not Found**: Run database migration manually
2. **Permission Errors**: Check RLS policies
3. **Normalization Failures**: Review rule patterns
4. **API Errors**: Verify route registration
5. **Frontend Issues**: Check API service configuration

### Debug Commands
```bash
# Check database connection
npm run test:supabase

# Validate upload engine
npm run validate:bloodwork

# Validate extraction engine
npm run validate:extraction
```

## Production Deployment Checklist

- [ ] Execute database migration in Supabase
- [ ] Deploy backend code to production
- [ ] Update frontend build with new screens
- [ ] Run validation scripts in production
- [ ] Test end-to-end workflow
- [ ] Monitor API performance
- [ ] Set up error tracking
- [ ] Document API endpoints for consumers

## Next Steps

After deployment, the system is ready for:
1. **Bloodwork Normalization Engine** (Wave 2 Step 3)
2. **Bloodwork Trend Engine** (Wave 2 Step 4)
3. **AI Enhancement** (Wave 3)
4. **Control Tower Integration** (Wave 4)

The extraction engine provides the foundation for advanced bloodwork analysis and health insights.
