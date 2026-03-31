# Bloodwork System - Implementation Plan

**Architecture:** ✅ Hybrid Approach (Rules + AI Services)  
**Status:** Ready for Implementation  
**Last Updated:** March 30, 2026

---

## Implementation Overview

### Approved Architecture

**Hybrid approach combining:**
- Rule-based logic for reliability and speed
- AI services for flexibility and intelligence
- No AI agents (too expensive, unpredictable)

**Cost per document:** $0.02-0.10  
**Processing time:** 5-10 seconds  
**Reliability:** High (rules provide baseline, AI handles edge cases)

---

## Phase 1: OCR & Pattern Matching (Foundation)

### Goal
Extract text from lab documents and parse common formats using patterns.

### Tasks

#### 1.1 Implement OCR Service
**File:** `server/src/services/ocrService.ts`

**Requirements:**
- Accept PDF or image buffer
- Extract text using Tesseract OCR
- Return raw text with confidence score
- Handle errors gracefully

**Implementation:**
```typescript
interface OCRResult {
  text: string;
  confidence: number;
  pageCount: number;
  processingTime: number;
}

async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<OCRResult>
```

**Dependencies:**
- `tesseract.js` for OCR
- `pdf-parse` for PDF text extraction (try this first, faster than OCR)

**Success Criteria:**
- Can extract text from PDF lab reports
- Can extract text from image lab reports
- Returns confidence score
- Handles multi-page documents

---

#### 1.2 Build Pattern Matching Library
**File:** `server/src/services/bloodworkPatternMatching.ts`

**Requirements:**
- Define regex patterns for common lab formats
- Quest Diagnostics format
- LabCorp format
- Standard table layouts
- Return structured data with confidence

**Pattern Examples:**
```typescript
// Quest format: "LDL Cholesterol    95 mg/dL    0-129"
const QUEST_PATTERN = /^(.+?)\s+(\d+\.?\d*)\s+(\w+\/\w+)\s+(.+)$/;

// LabCorp format: "LDL-C | 95 | mg/dL | <100"
const LABCORP_PATTERN = /^(.+?)\s*\|\s*(\d+\.?\d*)\s*\|\s*(\w+\/\w+)\s*\|\s*(.+)$/;

// Generic table: "Test Name | Value | Unit | Range"
const TABLE_PATTERN = /^(.+?)\s+(\d+\.?\d*)\s+(\w+\/\w+)\s+(\d+\.?\d*\s*-\s*\d+\.?\d*)$/;
```

**Functions:**
```typescript
interface PatternMatchResult {
  markers: ExtractedMarker[];
  confidence: number;
  format: 'quest' | 'labcorp' | 'generic' | 'unknown';
}

async function tryPatternMatching(text: string): Promise<PatternMatchResult>
```

**Success Criteria:**
- Can parse Quest Diagnostics format
- Can parse LabCorp format
- Can parse generic table formats
- Returns confidence score (0.0-1.0)
- Confidence > 0.8 means skip AI parsing

---

#### 1.3 Update Extraction Service
**File:** `server/src/services/bloodworkExtractionService.ts`

**Requirements:**
- Integrate OCR service
- Integrate pattern matching
- Fallback to AI if confidence < 0.8
- Track which method was used

**Flow:**
```typescript
async function parseBloodworkDocument(documentId: string) {
  // 1. Get document from database
  const doc = await getDocument(documentId);
  
  // 2. Download file from storage
  const buffer = await downloadFile(doc.file_url);
  
  // 3. Extract text via OCR
  const ocrResult = await extractTextFromBuffer(buffer, doc.mime_type);
  
  // 4. Try pattern matching
  const patternResult = await tryPatternMatching(ocrResult.text);
  
  // 5. If confidence high, use pattern result
  if (patternResult.confidence > 0.8) {
    return {
      markers: patternResult.markers,
      method: 'pattern',
      confidence: patternResult.confidence
    };
  }
  
  // 6. Otherwise, fallback to AI parsing
  const aiResult = await parseWithAI(ocrResult.text);
  return {
    markers: aiResult.markers,
    method: 'ai',
    confidence: aiResult.confidence
  };
}
```

**Success Criteria:**
- OCR extracts text successfully
- Pattern matching tries all formats
- Falls back to AI when needed
- Tracks which method was used
- Returns structured marker data

---

## Phase 2: AI Parsing (Fallback)

### Goal
Use OpenAI GPT-4 to parse complex or unusual lab formats.

### Tasks

#### 2.1 Implement AI Parsing Service
**File:** `server/src/services/bloodworkAIParser.ts`

**Requirements:**
- Send text to OpenAI GPT-4
- Use structured output (JSON mode)
- Extract markers, values, units, ranges
- Handle API errors and retries

**Implementation:**
```typescript
interface AIParseResult {
  markers: ExtractedMarker[];
  panels: ExtractedPanel[];
  confidence: number;
  tokensUsed: number;
  cost: number;
}

async function parseWithAI(text: string): Promise<AIParseResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a medical lab report parser. Extract all biomarkers from the text.
                  Return JSON with this structure:
                  {
                    "panels": [{"name": "Lipid Panel", "category": "cardiovascular"}],
                    "markers": [
                      {
                        "panel": "Lipid Panel",
                        "test_name": "LDL Cholesterol",
                        "value": 95,
                        "unit": "mg/dL",
                        "reference_range": "0-129",
                        "abnormal_flag": null
                      }
                    ]
                  }`
      },
      {
        role: "user",
        content: text
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.1 // Low temperature for consistency
  });
  
  const result = JSON.parse(response.choices[0].message.content);
  
  return {
    markers: result.markers,
    panels: result.panels,
    confidence: 0.9, // AI parsing generally high confidence
    tokensUsed: response.usage.total_tokens,
    cost: calculateCost(response.usage)
  };
}
```

**Success Criteria:**
- Can parse any lab format
- Returns structured JSON
- Handles API errors gracefully
- Tracks token usage and cost
- Confidence score reflects quality

---

## Phase 3: AI-Enhanced Recommendations

### Goal
Use AI to generate personalized recommendation text while rules control the logic.

### Tasks

#### 3.1 Update Recommendation Service
**File:** `server/src/services/bloodworkRecommendationService.ts`

**Current State:** Rule-based with template strings  
**Target State:** Rules trigger, AI generates text

**Implementation:**
```typescript
async function generateRecommendation(
  trend: BloodworkTrend,
  userContext: UserContext
): Promise<BloodworkRecommendation | null> {
  
  // STEP 1: Rule-based trigger logic (existing)
  const rule = findMatchingRule(trend);
  if (!rule) return null; // No recommendation needed
  
  // STEP 2: AI-enhanced text generation (NEW)
  const aiText = await generateRecommendationText({
    marker: trend.marker_name,
    latestValue: trend.latest_value,
    priorValue: trend.prior_value,
    trendDirection: trend.trend_direction,
    percentChange: trend.percent_change,
    category: trend.category,
    userAge: userContext.age,
    userActivity: userContext.activity_level,
    userGoals: userContext.goals
  });
  
  return {
    user_id: userContext.user_id,
    recommendation_type: rule.recommendation_type,
    severity: rule.severity,
    title: aiText.title,
    message: aiText.message,
    rationale: aiText.rationale,
    confidence: rule.confidence,
    related_markers: [trend.marker_name],
    status: 'active'
  };
}
```

#### 3.2 Implement AI Text Generation
**File:** `server/src/services/bloodworkAIRecommendations.ts`

**Requirements:**
- Generate personalized recommendation text
- Consider user context (age, activity, goals)
- Keep recommendations actionable and clear
- Handle API errors gracefully

**Implementation:**
```typescript
interface RecommendationTextRequest {
  marker: string;
  latestValue: string;
  priorValue: string;
  trendDirection: string;
  percentChange: number;
  category: string;
  userAge?: number;
  userActivity?: string;
  userGoals?: string[];
}

interface RecommendationText {
  title: string;
  message: string;
  rationale: string;
}

async function generateRecommendationText(
  req: RecommendationTextRequest
): Promise<RecommendationText> {
  
  const prompt = `Generate a personalized health recommendation.

Marker: ${req.marker}
Latest Value: ${req.latestValue}
Previous Value: ${req.priorValue}
Trend: ${req.trendDirection} (${req.percentChange}% change)
Category: ${req.category}
User Age: ${req.userAge || 'unknown'}
Activity Level: ${req.userActivity || 'unknown'}
Goals: ${req.userGoals?.join(', ') || 'general health'}

Generate:
1. A clear, concise title (max 60 chars)
2. An actionable message explaining what this means (2-3 sentences)
3. Clinical rationale for why this matters (1-2 sentences)

Keep it:
- Personalized to the user's context
- Actionable (what can they do?)
- Clear and non-alarmist
- Evidence-based`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a health optimization coach providing personalized recommendations based on bloodwork trends."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7 // Slightly higher for natural language
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

**Success Criteria:**
- Generates personalized recommendations
- Considers user context
- Recommendations are actionable
- Text is clear and professional
- Handles missing user context gracefully

---

## Phase 4: Integration & Testing

### Goal
Connect all components and test end-to-end flow.

### Tasks

#### 4.1 Update Processing Pipeline
**File:** `server/src/services/bloodworkProcessingService.ts`

**Requirements:**
- Integrate new OCR service
- Integrate pattern matching
- Integrate AI parsing fallback
- Integrate AI recommendation text
- Update progress tracking

**Flow:**
```typescript
async function processBloodworkDocument(documentId: string, userId: string) {
  try {
    // Step 1: Update status to parsing
    await updateStatus(documentId, 'parsing', { progress: 10 });
    
    // Step 2: OCR + Pattern Matching
    const extractionResult = await parseBloodworkDocument(documentId);
    await updateStatus(documentId, 'extracting', { progress: 45 });
    
    // Step 3: Normalize markers
    const normalizedResults = await normalizeMarkers(extractionResult.markers);
    await updateStatus(documentId, 'extracting', { progress: 60 });
    
    // Step 4: Save to database
    await saveResults(documentId, userId, normalizedResults);
    await updateStatus(documentId, 'extracting', { progress: 70 });
    
    // Step 5: Calculate trends
    const trends = await calculateTrends(userId);
    await updateStatus(documentId, 'generating_trends', { progress: 85 });
    
    // Step 6: Generate recommendations (with AI text)
    const recommendations = await generateRecommendations(userId, trends);
    await updateStatus(documentId, 'generating_recommendations', { progress: 95 });
    
    // Step 7: Notify user
    await notifyUser(userId, documentId);
    await updateStatus(documentId, 'complete', { progress: 100 });
    
  } catch (error) {
    await markFailed(documentId, error.message);
    throw error;
  }
}
```

#### 4.2 Create Test Suite
**File:** `server/tests/bloodwork.test.ts`

**Test Cases:**
1. Upload PDF lab report
2. OCR extracts text correctly
3. Pattern matching identifies format
4. AI parsing handles unusual format
5. Markers are normalized
6. Results saved to database
7. Trends calculated correctly
8. Recommendations generated with AI text
9. User receives notification

#### 4.3 Manual Testing Checklist
- [ ] Upload Quest Diagnostics PDF
- [ ] Upload LabCorp PDF
- [ ] Upload image of lab report
- [ ] Upload unusual format (triggers AI)
- [ ] Verify all markers extracted
- [ ] Check trend calculations
- [ ] Review AI-generated recommendations
- [ ] Test error handling (bad file, API failure)

---

## Implementation Order

### Week 1: Foundation
1. ✅ Architecture decision (DONE)
2. ⏳ Implement OCR service
3. ⏳ Build pattern matching library
4. ⏳ Update extraction service
5. ⏳ Test with sample documents

### Week 2: AI Integration
1. ⏳ Implement AI parsing service
2. ⏳ Implement AI recommendation text
3. ⏳ Update recommendation service
4. ⏳ Test AI components

### Week 3: Integration
1. ⏳ Update processing pipeline
2. ⏳ End-to-end testing
3. ⏳ Error handling
4. ⏳ Performance optimization

### Week 4: Polish
1. ⏳ Cost tracking and optimization
2. ⏳ Monitoring and logging
3. ⏳ Documentation
4. ⏳ Mobile UI (if time permits)

---

## Dependencies to Install

```bash
cd server
npm install tesseract.js pdf-parse openai
```

**Package purposes:**
- `tesseract.js` - OCR for images
- `pdf-parse` - Extract text from PDFs (faster than OCR)
- `openai` - OpenAI API client (already installed)

---

## Environment Variables Needed

```bash
# Already have these
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# May need to add
OPENAI_MODEL=gpt-4  # or gpt-4-turbo for lower cost
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.1
```

---

## Cost Estimates

### Per Document Processing

**Pattern Matching Path (80% of documents):**
- OCR: $0 (Tesseract) or $0.001 (cloud)
- Pattern matching: $0
- Normalization: $0
- Trends: $0
- AI recommendations: $0.01-0.02 (1-3 recommendations)
- **Total: $0.01-0.02**

**AI Parsing Path (20% of documents):**
- OCR: $0 (Tesseract) or $0.001 (cloud)
- Pattern matching: $0 (tried first)
- AI parsing: $0.01-0.05
- Normalization: $0
- Trends: $0
- AI recommendations: $0.01-0.02
- **Total: $0.02-0.10**

**Average per document: $0.02-0.04**

### Monthly Estimates

**Scenario: 100 documents/month**
- Cost: $2-4/month
- Processing time: 8-16 minutes total
- Storage: ~500MB (PDFs)

**Scenario: 1,000 documents/month**
- Cost: $20-40/month
- Processing time: 80-160 minutes total
- Storage: ~5GB (PDFs)

---

## Success Metrics

### Technical Metrics
- [ ] OCR accuracy > 95%
- [ ] Pattern matching success rate > 80%
- [ ] AI parsing accuracy > 90%
- [ ] Processing time < 10 seconds per document
- [ ] Cost < $0.10 per document
- [ ] Error rate < 5%

### Business Metrics
- [ ] User can upload any lab format
- [ ] Results appear within 10 seconds
- [ ] Recommendations are actionable
- [ ] Users understand their trends
- [ ] System handles errors gracefully

---

## Next Immediate Steps

1. **Install dependencies**
   ```bash
   cd server
   npm install tesseract.js pdf-parse
   ```

2. **Create OCR service stub**
   - File: `server/src/services/ocrService.ts`
   - Implement basic text extraction

3. **Test with sample document**
   - Get a real lab report PDF
   - Extract text
   - Verify output

4. **Build pattern matching**
   - Start with Quest format
   - Test with real Quest report
   - Measure confidence

5. **Integrate into extraction service**
   - Update `bloodworkExtractionService.ts`
   - Add OCR + pattern matching flow
   - Test end-to-end

---

**Ready to start implementation?** Let me know if you want to begin with Phase 1 (OCR & Pattern Matching) or if you have questions about any part of the plan.
