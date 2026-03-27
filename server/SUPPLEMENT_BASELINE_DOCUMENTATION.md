# Wave 1, Step 3: Supplement Stack Baseline Document Engine

## Overview

This document provides comprehensive documentation for the Supplement Stack Baseline Document Engine, a document-driven system that allows users to upload supplement stack documents, extract structured context, persist it, and make it available to the rest of the health system.

## Architecture

### Database Schema

The system uses five core tables in Supabase PostgreSQL:

#### `supplement_documents`
Stores metadata about uploaded supplement documents.
- `id`: UUID primary key
- `user_id`: User identifier
- `file_reference`: Optional file reference
- `storage_path`: Optional storage path
- `upload_date`: Document upload date
- `document_type`: Type (pdf, docx, txt, manual_entry, spreadsheet)
- `parse_status`: Processing status (pending, processing, completed, failed)
- `extraction_confidence`: Confidence score (0-1)
- `notes`: Optional notes
- `created_at/updated_at`: Timestamps

#### `supplement_baseline`
Stores the structured supplement context extracted from documents.
- `id`: UUID primary key
- `user_id`: User identifier
- `document_id`: Reference to supplement_documents
- `stack_name`: Name of the supplement stack
- `stack_notes`: Optional stack notes
- `total_active_items`: Count of active supplements
- `timing_notes`: Optional timing instructions
- `frequency_notes`: Optional frequency instructions
- `extracted_at`: Extraction timestamp
- `created_at/updated_at`: Timestamps

#### `supplement_items`
Stores individual supplement entries.
- `id`: UUID primary key
- `supplement_baseline_id`: Reference to supplement_baseline
- `supplement_name`: Name of supplement
- `dosage`: Numeric dosage value
- `dosage_unit`: Dosage unit (mg, g, IU, etc.)
- `frequency`: Frequency instructions
- `timing`: Timing instructions
- `status`: Status (active, paused, removed)
- `notes`: Optional notes
- `created_at/updated_at`: Timestamps

#### `supplement_extracted_sections`
Stores raw text segments from document processing.
- `id`: UUID primary key
- `user_id`: User identifier
- `document_id`: Reference to supplement_documents
- `raw_text`: Extracted text content
- `normalized_name`: Normalized section name
- `extraction_confidence`: Confidence score (0-1)
- `created_at`: Creation timestamp

#### `supplement_change_log`
Tracks changes for future agent refinement.
- `id`: UUID primary key
- `user_id`: User identifier
- `supplement_baseline_id`: Reference to supplement_baseline
- `supplement_item_id`: Optional reference to supplement_items
- `field_name`: Name of changed field
- `old_value`: Previous value
- `new_value`: New value
- `change_source`: Source of change (document_upload, agent_refinement, user_correction, system_update)
- `rationale`: Optional change rationale
- `changed_at`: Change timestamp

## API Endpoints

### POST /supplement-document
Uploads a supplement document and creates the baseline structure.

**Request Body:**
```json
{
  "userId": "string",
  "documentType": "pdf|docx|txt|manual_entry|spreadsheet",
  "fileReference": "string (optional)",
  "storagePath": "string (optional)",
  "notes": "string (optional)",
  "manualSupplementData": {
    "stackName": "string",
    "stackNotes": "string (optional)",
    "timingNotes": "string (optional)",
    "frequencyNotes": "string (optional)",
    "supplements": [
      {
        "supplementName": "string",
        "dosage": "number",
        "dosageUnit": "string",
        "frequency": "string",
        "timing": "string",
        "status": "active|paused|removed",
        "notes": "string (optional)"
      }
    ]
  } (optional)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document": { /* supplement document */ },
    "baseline": { /* supplement baseline */ },
    "items": [ /* supplement items */ ],
    "extractedSections": [ /* extracted sections */ ]
  }
}
```

### GET /supplement-baseline/:user_id
Retrieves the latest supplement baseline with items for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "string",
    "document_id": "uuid",
    "stack_name": "string",
    "stack_notes": "string (optional)",
    "total_active_items": "number",
    "timing_notes": "string (optional)",
    "frequency_notes": "string (optional)",
    "extracted_at": "timestamp",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "items": [
      {
        "id": "uuid",
        "supplement_baseline_id": "uuid",
        "supplement_name": "string",
        "dosage": "number",
        "dosage_unit": "string",
        "frequency": "string",
        "timing": "string",
        "status": "active|paused|removed",
        "notes": "string (optional)",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
  }
}
```

### GET /supplement-document/:user_id/latest
Retrieves the latest supplement document for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "string",
    "file_reference": "string (optional)",
    "storage_path": "string (optional)",
    "upload_date": "date",
    "document_type": "string",
    "parse_status": "string",
    "extraction_confidence": "number (optional)",
    "notes": "string (optional)",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

## Frontend Implementation

### React Native Screens

#### SupplementUploadScreen
Allows users to manually enter supplement stack information:
- Stack name and notes
- Timing and frequency instructions
- Dynamic supplement item list with add/remove
- Form validation and error handling
- Success state with navigation to summary

#### SupplementSummaryScreen
Displays the uploaded supplement stack:
- Stack overview with metadata
- Complete supplement item list
- Status indicators and formatting
- Navigation options for further actions

### Services
- `supplementDocumentService.ts`: API communication layer
- `supplementDocument.ts`: TypeScript type definitions

## Deployment Instructions

### 1. Database Schema Deployment

Execute the SQL schema in `deploy_supplement_schema.sql` in the Supabase SQL Editor:

```sql
-- Copy contents of deploy_supplement_schema.sql
-- Execute in Supabase SQL Editor
-- Verify table creation and indexes
```

### 2. Backend Deployment

1. Ensure all TypeScript files are compiled:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

3. Verify endpoints are accessible:
```bash
curl http://localhost:3000/health
```

### 3. Frontend Integration

1. Add supplement screens to navigation
2. Import and register types
3. Test upload and retrieval functionality

## Validation

### Automated Validation Script

Run the comprehensive validation script:

```bash
cd server
npm run build
node -r ts-node/register src/scripts/validateSupplementDocument.ts
```

### Manual Validation Steps

1. **Schema Deployment**:
   - Verify all tables created in Supabase
   - Check indexes and constraints
   - Test RLS policies

2. **API Functionality**:
   - Test POST /supplement-document with valid payload
   - Test GET /supplement-baseline/:user_id
   - Test GET /supplement-document/:user_id/latest

3. **Frontend Integration**:
   - Test supplement upload form
   - Verify data persistence
   - Test summary display

4. **Error Handling**:
   - Test invalid payloads
   - Test missing required fields
   - Verify proper error responses

## Test Data

Use the provided test payload in `test_supplement_payload.json` for validation:

```bash
curl -X POST http://localhost:3000/supplement-document \
  -H "Content-Type: application/json" \
  -d @test_supplement_payload.json
```

## Design Principles

### Document-Driven Approach
- No manual supplement editing UI in this step
- All supplement data comes from document uploads
- Manual entry treated as document type

### Placeholder-Friendly Parsing
- Support for manual structured payload submission
- Architecture ready for future real parsing
- No dependency on OpenAI or embeddings

### Extensibility
- Change log table prepared for future agent refinement
- Point-in-time reconstruction capability
- Support for dosage/timing changes
- Recommendation tracking ready

### Data Integrity
- Foreign key constraints ensure referential integrity
- Check constraints enforce valid enum values
- RLS policies protect user data

## Future Enhancements

### Agent Refinement
- Use change log to track AI-driven improvements
- Implement point-in-time reconstruction
- Support dosage and timing optimizations

### Document Processing
- Real PDF/DOCX parsing with OCR
- Natural language extraction
- Confidence scoring improvements

### Integration Points
- Connect to recommendation engine
- Link to outcome correlation
- Integrate with verbal agent

## Troubleshooting

### Common Issues

1. **Schema Deployment Fails**:
   - Check Supabase permissions
   - Verify SQL syntax
   - Check for existing table conflicts

2. **API Returns 404**:
   - Verify server is running
   - Check route registration
   - Ensure correct endpoint URLs

3. **TypeScript Compilation Errors**:
   - Check type definitions
   - Verify imports
   - Update database types if needed

4. **Frontend Navigation Issues**:
   - Verify screen registration
   - Check navigation types
   - Ensure proper parameter passing

### Debug Commands

```bash
# Check server logs
npm run dev

# Verify database connection
psql $SUPABASE_URL

# Test API directly
curl -v http://localhost:3000/supplement-document

# Check TypeScript compilation
npm run build
```

## Security Considerations

- RLS policies restrict access to user data
- Service role key used for backend operations
- Input validation on all API endpoints
- No sensitive data in client-side storage

## Performance Notes

- Indexes on user_id and timestamps for fast queries
- Pagination support for large supplement lists
- Efficient JSON storage for flexible data structures
- Connection pooling via Supabase

## Conclusion

The Supplement Stack Baseline Document Engine provides a solid foundation for document-driven supplement management. The architecture supports future enhancements while maintaining clean separation of concerns and data integrity.
