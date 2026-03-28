# Bloodwork Intelligence Engine - Deployment Guide

## Overview
This document provides the deployment instructions for the Bloodwork Intelligence Engine, which evaluates bloodwork trends and results, detects meaningful signals, and generates structured recommendations for future control tower, dashboard, and verbal agent integration.

## Architecture Components

### Backend Components
- **Recommendation Database**: Structured storage for bloodwork recommendations
- **Rule-Based Engine**: Deterministic logic for evaluating bloodwork patterns
- **Recommendation Service**: Core business logic for generating recommendations
- **API Endpoints**: RESTful endpoints for recommendation management

### Frontend Components
- **Recommendations Screen**: Interactive display of bloodwork recommendations
- **Service Layer**: API integration and data processing
- **Filtering & Grouping**: Organization by category, severity, and status

## Backend Implementation

### New Files Created
- `src/types/bloodworkRecommendations.ts` - Recommendation type definitions
- `src/services/bloodworkRecommendationService.ts` - Core recommendation logic
- `src/controllers/bloodworkRecommendationsController.ts` - API controllers
- `src/routes/bloodworkRecommendationsRoutes.ts` - API routes
- `src/scripts/validateBloodworkRecommendations.ts` - Validation script

### Updated Files
- `src/types/database.ts` - Added bloodwork_recommendations table types
- `src/index.ts` - Added recommendation routes

### Database Schema
- `bloodwork_recommendations` table with all required fields
- Indexes for performance optimization
- RLS policies for security
- Triggers for timestamp management

### API Endpoints Added
- `POST /bloodwork/recommendations/generate/:user_id` - Generate recommendations
- `GET /bloodwork/recommendations/:user_id` - Get all recommendations
- `GET /bloodwork/recommendations/:user_id/active` - Get active recommendations
- `POST /bloodwork/recommendations` - Create manual recommendation
- `PUT /bloodwork/recommendations/:id/status` - Update recommendation status

### New NPM Scripts
- `npm run validate:recommendations` - Run recommendation engine validation

## Recommendation Engine Logic

### Supported Recommendation Types
- **cardiovascular**: Heart and blood vessel health
- **metabolic**: Blood sugar and metabolic health
- **hormonal**: Hormone balance and endocrine health
- **inflammation**: Systemic inflammation markers
- **follow_up**: Follow-up testing recommendations
- **monitoring**: Ongoing monitoring needs
- **lifestyle**: Lifestyle modification suggestions
- **supplement_review**: Supplement evaluation needs
- **workout_review**: Exercise routine assessment

### Supported Severity Levels
- **high**: Critical issues requiring immediate attention
- **medium**: Important issues requiring timely action
- **low**: Minor issues for awareness and monitoring

### Supported Status Values
- **active**: Currently relevant and actionable
- **superseded**: Replaced by newer recommendation
- **resolved**: Issue addressed or resolved

### Recommendation Rules

#### Cardiovascular Markers
| Marker | Conditions | Severity | Recommendation |
|--------|------------|----------|----------------|
| LDL | Worsening + > 100 mg/dL + >10% change | Medium | Cardiovascular review |
| LDL | Worsening + > 130 mg/dL | High | Cardiovascular review |
| ApoB | Worsening + > 90 mg/dL | Medium | Cardiovascular review |
| hsCRP | Worsening + > 3 mg/L | Medium | Inflammation review |
| Triglycerides | Worsening + > 150 mg/dL | Medium | Cardiovascular review |
| HDL | Worsening + < 40 mg/dL | Medium | Cardiovascular review |

#### Metabolic Markers
| Marker | Conditions | Severity | Recommendation |
|--------|------------|----------|----------------|
| HbA1c | Worsening + > 5.7% | Medium | Metabolic review |
| HbA1c | Worsening + > 6.5% | High | Metabolic review |
| Glucose | Worsening + > 100 mg/dL | Medium | Metabolic review |
| Fasting Glucose | Worsening + > 100 mg/dL | Medium | Metabolic review |
| Insulin | Worsening + > 25 µIU/mL | Medium | Metabolic review |

#### Hormonal Markers
| Marker | Conditions | Severity | Recommendation |
|--------|------------|----------|----------------|
| Testosterone | Worsening + < 300 ng/dL | Medium | Hormonal review |
| Free Testosterone | Worsening + < 9 ng/dL | Medium | Hormonal review |
| SHBG | Worsening + > 80 nmol/L | Low | Hormonal review |
| Estradiol | Worsening + > 80 pg/mL | Medium | Hormonal review |

### Recommendation Generation Process

1. **Trend Analysis**: Evaluate bloodwork trends for each marker
2. **Rule Matching**: Apply recommendation rules based on conditions
3. **Confidence Calculation**: Adjust confidence based on data quality
4. **Template Processing**: Generate text using templates with data substitution
5. **Source Linking**: Connect to original bloodwork data
6. **Duplicate Prevention**: Avoid redundant recommendations
7. **Status Management**: Handle active/superseded/resolved states

### Data Structure

#### BloodworkRecommendation Interface
```typescript
interface BloodworkRecommendation {
  id: string;
  user_id: string;
  test_name: string;
  normalized_test_name?: string;
  category?: string;
  recommendation_type: RecommendationType;
  recommendation_title: string;
  recommendation_text: string;
  rationale: string;
  confidence: number; // 0-1 scale
  severity: RecommendationSeverity;
  status: RecommendationStatus;
  source_document_ids: string[];
  source_result_ids: string[];
  source_trend_window: {
    start_date: string;
    end_date: string;
    data_points: number;
  };
  created_at: string;
  updated_at: string;
}
```

## Frontend Implementation

### New Files Created
- `mobile/src/types/bloodworkRecommendations.ts` - Frontend type definitions
- `mobile/src/services/bloodworkRecommendationsService.ts` - API service layer
- `mobile/src/screens/BloodworkRecommendationsScreen.tsx` - Main recommendations screen

### Features Implemented

#### Bloodwork Recommendations Screen
- **Statistics Overview**: Total, active, and priority recommendations
- **Category Filtering**: Filter by recommendation type and severity
- **Grouped Display**: Organized by recommendation categories
- **Detailed View**: Full recommendation text, rationale, and metadata
- **Status Management**: Mark recommendations as resolved
- **Generation Control**: Trigger new recommendation generation

#### Recommendation Service Features
- **Data Fetching**: Get all, active, or filtered recommendations
- **Status Updates**: Mark recommendations as resolved/superseded
- **Grouping**: Organize by category and severity
- **Filtering**: Filter by type, severity, and status
- **Formatting**: Consistent display of recommendation data
- **Priority Detection**: Identify high-priority recommendations

### UI Components

#### Statistics Grid
- 4-quadrant display of total, active, high priority, and needs attention
- Priority recommendations section
- Quick insights into recommendation landscape

#### Category Sections
- Expandable/collapsible sections by recommendation type
- Category statistics (high/medium/low counts)
- Individual recommendations with full details

#### Recommendation Items
- Recommendation title with type icon
- Severity and status indicators
- Full recommendation text and rationale
- Source information and trend window
- Action buttons for status updates

## Validation

### Validation Script
Run `npm run validate:recommendations` to test the complete recommendation engine:

1. **Database Schema**: Validates table structure and constraints
2. **Recommendation Rules**: Tests rule definitions and logic
3. **Generation Process**: Tests recommendation generation from trends
4. **API Endpoints**: Tests all recommendation endpoints
5. **Business Logic**: Tests recommendation accuracy and appropriateness
6. **Future Readiness**: Tests extensibility and integration readiness

### Expected Results
- 5/5 validation categories should pass
- 100% success rate for production readiness
- All API endpoints functional
- Rule-based logic working correctly
- Proper confidence calculations

## Data Structures

### Recommendation Rule Interface
```typescript
interface RecommendationRule {
  marker_name: string;
  recommendation_type: RecommendationType;
  conditions: {
    trend_direction?: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
    min_data_points?: number;
    value_threshold?: {
      operator: '>' | '<' | '>=' | '<=' | '==';
      value: number;
    };
    trend_threshold?: {
      operator: '>' | '<';
      value: number; // percent change
    };
  };
  recommendation: {
    title: string;
    text_template: string;
    rationale_template: string;
    severity: RecommendationSeverity;
    base_confidence: number;
  };
}
```

### Generation Request Interface
```typescript
interface GenerateRecommendationsRequest {
  user_id: string;
  force_regenerate?: boolean;
}
```

## Future Extensibility

### Control Tower Integration Ready
- Structured recommendation data for scoring algorithms
- Severity levels for priority weighting
- Confidence scores for decision reliability
- Status tracking for resolution monitoring

### Dashboard Highlights Ready
- Summary statistics for overview widgets
- Priority recommendations for attention items
- Category-based organization for focused views
- Trend-based recommendation generation

### Verbal Agent Ready
- Natural language recommendation titles and text
- Detailed rationale for explanation
- Source linking for evidence-based responses
- Priority and severity for urgency assessment

### Supplement/Workout Correlation Ready
- Source document and result linking
- Trend window data for temporal correlation
- Category-based analysis for targeted interventions
- Status tracking for outcome monitoring

### Recommendation Resolution Flow Ready
- Status management (active/superseded/resolved)
- Source tracking for outcome validation
- Confidence scoring for effectiveness measurement
- Duplicate prevention for consistency

## Performance Considerations

### Database Optimization
- Indexes on user_id, status, recommendation_type, severity
- Efficient filtering and sorting queries
- Proper pagination for large datasets
- Connection pooling for concurrent access

### API Performance
- Response time targets under 500ms
- Efficient rule evaluation algorithms
- Caching for frequently accessed recommendations
- Batch processing for multiple recommendations

### Frontend Performance
- Lazy loading of recommendation data
- Efficient list rendering with virtualization
- Optimized filtering and grouping logic
- Offline data caching for reliability

## Testing Strategy

### Unit Tests
- Rule evaluation algorithms
- Confidence calculation logic
- Template substitution accuracy
- Data structure validation

### Integration Tests
- API endpoint functionality
- Database integration
- Service layer interactions
- Error handling scenarios

### End-to-End Tests
- Complete recommendation generation workflow
- Multi-marker recommendation scenarios
- Status update workflows
- Frontend interaction testing

### Performance Tests
- Large dataset handling
- Concurrent user access
- Rule evaluation performance
- Memory usage optimization

## Troubleshooting

### Common Issues
1. **No Recommendations Generated**: Check bloodwork trends exist and match rules
2. **Incorrect Severity**: Verify rule thresholds and conditions
3. **Missing Categories**: Check recommendation type mappings
4. **API Errors**: Verify endpoint implementations and permissions
5. **Template Issues**: Check placeholder substitution logic

### Debug Commands
```bash
# Check database connection
npm run test:supabase

# Validate trends engine
npm run validate:trends

# Validate recommendations engine
npm run validate:recommendations

# Run full E2E validation
npm run validate:e2e
```

## Production Deployment Checklist

### Backend Deployment
- [ ] Deploy recommendation database schema
- [ ] Deploy recommendation service
- [ ] Deploy API endpoints
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Test recommendation generation

### Frontend Deployment
- [ ] Deploy Recommendations screen
- [ ] Configure API integration
- [ ] Test user interactions
- [ ] Validate filtering and grouping
- [ ] Test status management

### Validation in Production
- [ ] Run recommendation validation script
- [ ] Test with real bloodwork data
- [ ] Validate rule accuracy
- [ ] Monitor generation performance
- [ ] Check recommendation quality

### Monitoring Setup
- [ ] API response time monitoring
- [ ] Recommendation generation metrics
- [ ] Database performance monitoring
- [ ] User interaction analytics
- [ ] Rule effectiveness tracking

## Next Steps

After deployment, the Bloodwork Intelligence Engine enables:

1. **Wave 2 Step 4**: Enhanced trend analysis with recommendations
2. **Wave 3**: AI-enhanced recommendation generation
3. **Wave 4**: Control tower integration with recommendation scoring

The recommendation engine provides the analytical foundation for actionable health insights, personalized recommendations, and intelligent health management.

---

*Deployment Guide created March 26, 2026*  
*Next: Deploy database schema and begin production recommendation generation*
