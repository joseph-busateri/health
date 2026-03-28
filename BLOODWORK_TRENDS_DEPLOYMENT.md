# Bloodwork Trend Engine - Deployment Guide

## Overview
This document provides the deployment instructions for the Bloodwork Trend Engine, which analyzes bloodwork markers over time, calculates trend directions, and prepares structured outputs for future control tower scoring and recommendations.

## Architecture Components

### Backend Components
- **Trend Calculation Service**: Core logic for calculating trends
- **Trend Summary Service**: Generates concise trend summaries
- **API Endpoints**: RESTful endpoints for trend data
- **Marker Rules**: Configurable rules for different marker types

### Frontend Components
- **Bloodwork Trends Screen**: Interactive trend visualization
- **Trend Service Layer**: API integration and data processing
- **Category Filtering**: Organized display by marker categories

## Backend Implementation

### New Files Created
- `src/types/bloodworkTrends.ts` - Trend type definitions
- `src/services/bloodworkTrendService.ts` - Core trend calculation logic
- `src/controllers/bloodworkTrendsController.ts` - API controllers
- `src/routes/bloodworkTrendsRoutes.ts` - API routes
- `src/scripts/validateBloodworkTrends.ts` - Validation script

### Updated Files
- `src/index.ts` - Added trend routes

### API Endpoints Added
- `GET /bloodwork/trends/:user_id` - Get user's bloodwork trends
- `GET /bloodwork/trends/:user_id/summary` - Get trend summary
- `GET /bloodwork/trends/supported-markers` - Get supported markers
- `GET /bloodwork/trends/categories` - Get marker categories

### New NPM Scripts
- `npm run validate:trends` - Run trend engine validation

## Trend Calculation Logic

### Supported Trend Directions
- **improving**: Values moving in healthy direction
- **worsening**: Values moving in unhealthy direction
- **stable**: Values not changing significantly
- **insufficient_data**: Not enough data points for analysis

### Marker Categories & Rules

#### Cardiovascular Markers
| Marker | Direction | Target Range | Unit | Threshold |
|--------|-----------|--------------|------|-----------|
| LDL | lower_is_better | < 100 mg/dL | mg/dL | 5% |
| HDL | higher_is_better | > 40 mg/dL | mg/dL | 5% |
| Triglycerides | lower_is_better | < 150 mg/dL | mg/dL | 10% |
| ApoB | lower_is_better | < 90 mg/dL | mg/dL | 5% |
| hsCRP | lower_is_better | < 3 mg/L | mg/L | 15% |
| Total Cholesterol | lower_is_better | < 200 mg/dL | mg/dL | 5% |

#### Metabolic Markers
| Marker | Direction | Target Range | Unit | Threshold |
|--------|-----------|--------------|------|-----------|
| HbA1c | lower_is_better | < 5.7% | % | 3% |
| A1c | lower_is_better | < 5.7% | % | 3% |
| Glucose | lower_is_better | < 100 mg/dL | mg/dL | 10% |
| Fasting Glucose | lower_is_better | < 100 mg/dL | mg/dL | 10% |
| Insulin | lower_is_better | < 25 µIU/mL | µIU/mL | 15% |

#### Hormonal Markers
| Marker | Direction | Target Range | Unit | Threshold |
|--------|-----------|--------------|------|-----------|
| Testosterone | higher_is_better | > 300 ng/dL | ng/dL | 10% |
| Free Testosterone | higher_is_better | > 9 ng/dL | ng/dL | 10% |
| SHBG | target_range | 10-80 nmol/L | nmol/L | 10% |
| Estradiol | target_range | 20-80 pg/mL | pg/mL | 15% |

### Trend Calculation Algorithm

1. **Data Collection**: Gather all results for a marker
2. **Chronological Sorting**: Order by test_date ascending
3. **Value Extraction**: Use numeric values or parse from text
4. **Change Calculation**: 
   - Absolute change = latest - prior
   - Percent change = (absolute / prior) * 100
5. **Direction Determination**: Based on marker rules and thresholds
6. **Significance Check**: Change must exceed threshold to be considered

## Frontend Implementation

### New Files Created
- `mobile/src/types/bloodworkTrends.ts` - Frontend type definitions
- `mobile/src/services/bloodworkTrendsService.ts` - API service layer
- `mobile/src/screens/BloodworkTrendsScreen.tsx` - Main trends screen

### Features Implemented

#### Bloodwork Trends Screen
- **Summary Section**: Overall trend statistics and priority markers
- **Category Filtering**: Filter by Cardiovascular, Metabolic, Hormonal
- **Expandable Categories**: Collapsible sections for each marker category
- **Trend Items**: Detailed view of each marker's trend
- **Visual Indicators**: Color-coded trend directions and icons
- **Significance Badges**: Highlights statistically significant changes

#### Trend Service Features
- **Data Grouping**: Organize trends by category
- **Direction Filtering**: Filter by trend direction
- **Significance Analysis**: Identify meaningful changes
- **Priority Detection**: Flag important trends for review
- **Formatting Helpers**: Consistent display of values and changes

### UI Components

#### Summary Grid
- 4-quadrant display of improving/worsening/stable/insufficient
- Priority markers section
- Analysis period display

#### Category Sections
- Expandable/collapsible sections
- Category statistics (improving/worsening/stable counts)
- Individual trend items with detailed information

#### Trend Items
- Marker name and significance indicator
- Latest and prior values with units
- Change amount and percentage
- Data points count and date range
- Trend summary text

## Validation

### Validation Script
Run `npm run validate:trends` to test the complete trend engine:

1. **Trend Calculation**: Validates mathematical calculations
2. **Service Layer**: Tests business logic and data processing
3. **Trend Summary**: Validates summary generation
4. **API Endpoints**: Tests all API endpoints
5. **Marker Rules**: Validates rule definitions
6. **Future Readiness**: Tests extensibility and unknown markers

### Expected Results
- 6/6 validation categories should pass
- 100% success rate for production readiness
- All API endpoints functional
- Trend calculations accurate
- Summary generation working

## Data Structures

### BloodworkTrend Interface
```typescript
interface BloodworkTrend {
  marker_name: string;
  category?: string;
  latest_value: number | string;
  prior_value: number | string;
  absolute_change?: number;
  percent_change?: number;
  trend_direction: TrendDirection;
  data_points: number;
  first_test_date: string;
  latest_test_date: string;
  unit?: string;
  trend_summary?: string;
}
```

### BloodworkTrendSummary Interface
```typescript
interface BloodworkTrendSummary {
  improving_markers: string[];
  worsening_markers: string[];
  stable_markers: string[];
  insufficient_data_markers: string[];
  total_markers: number;
  analysis_date: string;
  date_range: {
    start: string;
    end: string;
  };
}
```

## Future Extensibility

### Control Tower Integration Ready
- Trend direction data for scoring algorithms
- Summary data for priority identification
- Significance metrics for decision making
- Historical trend data for pattern recognition

### Recommendation Engine Ready
- Improving/worsening marker identification
- Priority marker flagging
- Trend significance analysis
- Multi-marker correlation support

### Dashboard Highlights Ready
- Summary statistics for overview widgets
- Priority markers for attention items
- Category-based grouping for focused views
- Trend data for visual representations

### Supplement/Workout Correlation Ready
- Chronological data alignment
- Trend direction correlation
- Significance threshold support
- Multi-marker analysis foundation

### Verbal Agent Prioritization Ready
- Priority marker identification
- Trend summary for natural language
- Category-based organization
- Significance-based urgency

## Performance Considerations

### Database Optimization
- Indexes on user_id, normalized_test_name, test_date
- Efficient grouping and sorting queries
- Pagination support for large datasets
- Caching for frequently accessed trends

### API Performance
- Response time targets under 500ms
- Efficient data aggregation
- Minimal data transfer
- Error handling and timeouts

### Frontend Performance
- Lazy loading of trend data
- Efficient list rendering
- Smooth animations and transitions
- Offline data caching

## Testing Strategy

### Unit Tests
- Trend calculation algorithms
- Marker rule applications
- Data structure validation
- Edge case handling

### Integration Tests
- API endpoint functionality
- Database integration
- Service layer interactions
- Error handling scenarios

### End-to-End Tests
- Complete user workflows
- Multi-document scenarios
- Category filtering
- Trend visualization

### Performance Tests
- Large dataset handling
- Concurrent user access
- Memory usage optimization
- Response time validation

## Troubleshooting

### Common Issues
1. **Incorrect Trend Directions**: Check marker rule definitions
2. **Missing Trends**: Verify bloodwork_results data exists
3. **API Errors**: Check endpoint registration and permissions
4. **Frontend Display Issues**: Verify API integration and data formatting
5. **Performance Issues**: Check database queries and indexing

### Debug Commands
```bash
# Check database connection
npm run test:supabase

# Validate extraction engine
npm run validate:extraction

# Validate trend engine
npm run validate:trends

# Run full E2E validation
npm run validate:e2e
```

## Production Deployment Checklist

### Backend Deployment
- [ ] Deploy trend calculation service
- [ ] Deploy API endpoints
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Test API performance

### Frontend Deployment
- [ ] Deploy Bloodwork Trends screen
- [ ] Configure API integration
- [ ] Test user interactions
- [ ] Validate responsive design
- [ ] Test offline functionality

### Validation in Production
- [ ] Run trend validation script
- [ ] Test with real bloodwork data
- [ ] Validate calculation accuracy
- [ ] Monitor performance metrics
- [ ] Check error rates

### Monitoring Setup
- [ ] API response time monitoring
- [ ] Error rate tracking
- [ ] Database performance monitoring
- [ ] User interaction analytics
- [ ] Trend calculation performance

## Next Steps

After deployment, the Bloodwork Trend Engine enables:

1. **Wave 2 Step 3**: Enhanced bloodwork normalization
2. **Wave 2 Step 4**: Advanced trend analysis
3. **Wave 3**: AI-enhanced trend prediction
4. **Wave 4**: Control tower integration

The trend engine provides the analytical foundation for understanding bloodwork patterns and generating actionable health insights.

---

*Deployment Guide created March 26, 2026*  
*Next: Deploy and validate trend calculations*
