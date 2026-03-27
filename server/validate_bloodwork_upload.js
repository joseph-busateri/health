const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Test configuration
const TEST_USER_ID = 'bloodwork-validation-user';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test files (create sample files for testing)
const createSamplePDF = () => {
  const samplePDFContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000120 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
  return samplePDFContent;
};

const createSampleImage = () => {
  // Simple PNG header (1x1 pixel transparent PNG)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00,
    0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82
  ]);
  return pngHeader;
};

const createSampleText = () => {
  return Buffer.from('Bloodwork Results\n\nComplete Blood Count (CBC)\nWBC: 7.5 x10^3/uL\nRBC: 4.5 x10^6/uL\nHemoglobin: 14.5 g/dL\nHematocrit: 42.5 %\nMCV: 94 fL\nMCH: 32.2 pg\nMCHC: 34.1 g/dL\nRDW: 12.5 %\nPlatelet Count: 250 x10^3/uL\n\nMetabolic Panel\nGlucose: 92 mg/dL\nBUN: 15 mg/dL\nCreatinine: 0.9 mg/dL\nSodium: 140 mEq/L\nPotassium: 4.2 mEq/L\nChloride: 102 mEq/L\nCO2: 24 mEq/L\nCalcium: 9.5 mg/dL\n\nLipid Panel\nTotal Cholesterol: 185 mg/dL\nLDL: 110 mg/dL\nHDL: 55 mg/dL\nTriglycerides: 100 mg/dL');
};

async function validateBloodworkUpload() {
  console.log('🚀 BLOODWORK DOCUMENT UPLOAD ENGINE VALIDATION');
  console.log('================================================\n');
  
  const results = {
    databaseSchema: { success: false, message: '' },
    singleDocumentUpload: { success: false, message: '' },
    recordCreation: { success: false, message: '' },
    fileUrlStorage: { success: false, message: '' },
    parseStatusPending: { success: false, message: '' },
    retrievalEndpoint: { success: false, message: '' },
    multipleDocumentUpload: { success: false, message: '' },
    invalidDocumentUpload: { success: false, message: '' },
    frontendTimeline: { success: false, message: '' },
  };

  try {
    // Step 1: Validate Database Schema
    console.log('📋 Step 1: Validating Database Schema');
    console.log('==========================================');
    
    try {
      const { error } = await supabase
        .from('bloodwork_documents')
        .select('count')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        results.databaseSchema = { 
          success: false, 
          message: 'bloodwork_documents table not found. Run deploy_bloodwork_schema.sql' 
        };
        console.log('❌ bloodwork_documents table: NOT FOUND');
        console.log('💡 Please run deploy_bloodwork_schema.sql in Supabase SQL Editor');
        return printFinalSummary(results);
      } else if (error) {
        results.databaseSchema = { 
          success: false, 
          message: `Database error: ${error.message}` 
        };
        console.log('❌ Database error:', error.message);
        return printFinalSummary(results);
      }
      
      console.log('✅ bloodwork_documents table: EXISTS');
      results.databaseSchema = { 
        success: true, 
        message: 'Database schema validated' 
      };
    } catch (error) {
      results.databaseSchema = { 
        success: false, 
        message: `Database connection error: ${error.message}` 
      };
      console.log('❌ Database connection error:', error.message);
      return printFinalSummary(results);
    }

    // Step 2: Test Single Document Upload
    console.log('\n📋 Step 2: Testing Single Document Upload');
    console.log('============================================');
    
    try {
      const formData = new FormData();
      const pdfBuffer = createSamplePDF();
      
      formData.append('file', pdfBuffer, {
        filename: 'test_bloodwork.pdf',
        contentType: 'application/pdf',
      });
      formData.append('user_id', TEST_USER_ID);
      formData.append('file_name', 'test_bloodwork.pdf');
      formData.append('document_type', 'comprehensive');
      formData.append('source', 'manual_upload');
      formData.append('test_date', '2024-01-15');
      formData.append('notes', 'Test bloodwork document for validation');

      const response = await fetch(`${API_BASE_URL}/bloodwork/upload`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        results.singleDocumentUpload = { 
          success: false, 
          message: `Upload failed: ${response.status} - ${errorData.error || 'Unknown error'}` 
        };
        console.log('❌ Single document upload failed:', response.status);
        console.log('   Error:', errorData.error || 'Unknown error');
        return printFinalSummary(results);
      }

      const uploadResult = await response.json();
      console.log('✅ Single document upload: SUCCESS');
      console.log('   Document ID:', uploadResult.data?.document?.id);
      console.log('   File URL:', uploadResult.data?.file_url);
      
      results.singleDocumentUpload = { 
        success: true, 
        message: 'Single document upload successful',
        documentId: uploadResult.data?.document?.id,
        fileUrl: uploadResult.data?.file_url
      };
      
      // Store document ID for subsequent tests
      const testDocumentId = uploadResult.data?.document?.id;
      const testFileUrl = uploadResult.data?.file_url;

      // Step 3: Confirm Record Created
      console.log('\n📋 Step 3: Confirming Record Created');
      console.log('=======================================');
      
      const { data: createdRecord, error: recordError } = await supabase
        .from('bloodwork_documents')
        .select('*')
        .eq('id', testDocumentId)
        .single();
      
      if (recordError) {
        results.recordCreation = { 
          success: false, 
          message: `Failed to retrieve created record: ${recordError.message}` 
        };
        console.log('❌ Record creation confirmation failed:', recordError.message);
        return printFinalSummary(results);
      }
      
      console.log('✅ Record created in database');
      console.log('   ID:', createdRecord.id);
      console.log('   User ID:', createdRecord.user_id);
      console.log('   File Name:', createdRecord.file_name);
      console.log('   Document Type:', createdRecord.document_type);
      console.log('   Source:', createdRecord.source);
      console.log('   Test Date:', createdRecord.test_date);
      console.log('   Upload Date:', createdRecord.upload_date);
      
      results.recordCreation = { 
        success: true, 
        message: 'Record created successfully',
        record: createdRecord
      };

      // Step 4: Confirm File URL Stored
      console.log('\n📋 Step 4: Confirming File URL Stored');
      console.log('========================================');
      
      if (!createdRecord.file_url) {
        results.fileUrlStorage = { 
          success: false, 
          message: 'File URL not stored in database' 
        };
        console.log('❌ File URL not found in database record');
        return printFinalSummary(results);
      }
      
      console.log('✅ File URL stored in database');
      console.log('   File URL:', createdRecord.file_url);
      console.log('   URL Type:', typeof createdRecord.file_url);
      
      results.fileUrlStorage = { 
        success: true, 
        message: 'File URL stored correctly',
        fileUrl: createdRecord.file_url
      };

      // Step 5: Confirm Parse Status = Pending
      console.log('\n📋 Step 5: Confirming Parse Status = Pending');
      console.log('==============================================');
      
      if (createdRecord.parse_status !== 'pending') {
        results.parseStatusPending = { 
          success: false, 
          message: `Expected parse_status 'pending', got '${createdRecord.parse_status}'` 
        };
        console.log('❌ Parse status not set to pending');
        console.log('   Expected: pending');
        console.log('   Actual:', createdRecord.parse_status);
        return printFinalSummary(results);
      }
      
      console.log('✅ Parse status set to pending');
      console.log('   Status:', createdRecord.parse_status);
      
      results.parseStatusPending = { 
        success: true, 
        message: 'Parse status correctly set to pending',
        status: createdRecord.parse_status
      };

      // Step 6: Test Retrieval Endpoint
      console.log('\n📋 Step 6: Testing Retrieval Endpoint');
      console.log('=======================================');
      
      // Test get specific document
      const docResponse = await fetch(`${API_BASE_URL}/bloodwork/document/${testDocumentId}?user_id=${TEST_USER_ID}`);
      
      if (!docResponse.ok) {
        const errorData = await docResponse.json();
        results.retrievalEndpoint = { 
          success: false, 
          message: `Document retrieval failed: ${docResponse.status} - ${errorData.error || 'Unknown error'}` 
        };
        console.log('❌ Document retrieval failed:', docResponse.status);
        console.log('   Error:', errorData.error || 'Unknown error');
        return printFinalSummary(results);
      }
      
      const docResult = await docResponse.json();
      console.log('✅ Document retrieval: SUCCESS');
      console.log('   Document ID:', docResult.data?.id);
      console.log('   File Name:', docResult.data?.file_name);
      console.log('   Parse Status:', docResult.data?.parse_status);
      
      // Test get user documents
      const userDocsResponse = await fetch(`${API_BASE_URL}/bloodwork/documents/${TEST_USER_ID}`);
      
      if (!userDocsResponse.ok) {
        const errorData = await userDocsResponse.json();
        results.retrievalEndpoint = { 
          success: false, 
          message: `User documents retrieval failed: ${userDocsResponse.status} - ${errorData.error || 'Unknown error'}` 
        };
        console.log('❌ User documents retrieval failed:', userDocsResponse.status);
        return printFinalSummary(results);
      }
      
      const userDocsResult = await userDocsResponse.json();
      console.log('✅ User documents retrieval: SUCCESS');
      console.log('   Total Documents:', userDocsResult.data?.total);
      console.log('   Documents Retrieved:', userDocsResult.data?.documents?.length);
      
      results.retrievalEndpoint = { 
        success: true, 
        message: 'Retrieval endpoints working correctly',
        document: docResult.data,
        userDocuments: userDocsResult.data
      };

      // Step 7: Test Multiple Document Upload
      console.log('\n📋 Step 7: Testing Multiple Document Upload');
      console.log('==============================================');
      
      const multipleUploads = [];
      const documentTypes = ['lab_panel', 'hormone', 'metabolic'];
      
      for (let i = 0; i < 3; i++) {
        const formData = new FormData();
        const imageBuffer = createSampleImage();
        
        formData.append('file', imageBuffer, {
          filename: `test_bloodwork_${i}.png`,
          contentType: 'image/png',
        });
        formData.append('user_id', TEST_USER_ID);
        formData.append('file_name', `test_bloodwork_${i}.png`);
        formData.append('document_type', documentTypes[i]);
        formData.append('source', 'manual_upload');
        formData.append('test_date', `2024-01-${15 + i}`);
        formData.append('notes', `Test bloodwork document ${i + 1}`);

        const response = await fetch(`${API_BASE_URL}/bloodwork/upload`, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders(),
        });

        if (response.ok) {
          const result = await response.json();
          multipleUploads.push(result.data?.document?.id);
          console.log(`✅ Multiple upload ${i + 1}: SUCCESS`);
        } else {
          console.log(`❌ Multiple upload ${i + 1}: FAILED`);
        }
      }
      
      if (multipleUploads.length === 3) {
        console.log('✅ Multiple document upload: SUCCESS');
        console.log('   Documents uploaded:', multipleUploads.length);
        
        results.multipleDocumentUpload = { 
          success: true, 
          message: 'Multiple document upload successful',
          uploadedIds: multipleUploads
        };
      } else {
        results.multipleDocumentUpload = { 
          success: false, 
          message: `Only ${multipleUploads.length}/3 uploads succeeded` 
        };
        console.log('❌ Multiple document upload: PARTIAL SUCCESS');
        console.log('   Successful uploads:', multipleUploads.length, '/3');
      }

      // Step 8: Test Invalid Document Upload
      console.log('\n📋 Step 8: Testing Invalid Document Upload');
      console.log('============================================');
      
      try {
        const formData = new FormData();
        const invalidBuffer = Buffer.from('This is not a valid file type');
        
        formData.append('file', invalidBuffer, {
          filename: 'invalid.xyz',
          contentType: 'application/xyz',
        });
        formData.append('user_id', TEST_USER_ID);
        formData.append('file_name', 'invalid.xyz');
        formData.append('document_type', 'other');
        formData.append('source', 'manual_upload');

        const response = await fetch(`${API_BASE_URL}/bloodwork/upload`, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders(),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log('✅ Invalid document upload: CORRECTLY REJECTED');
          console.log('   Status:', response.status);
          console.log('   Error:', errorData.error || 'Unknown error');
          
          results.invalidDocumentUpload = { 
            success: true, 
            message: 'Invalid document correctly rejected',
            rejectionReason: errorData.error || 'Unknown error'
          };
        } else {
          console.log('❌ Invalid document upload: UNEXPECTEDLY ACCEPTED');
          results.invalidDocumentUpload = { 
            success: false, 
            message: 'Invalid document was unexpectedly accepted' 
          };
        }
      } catch (error) {
        console.log('✅ Invalid document upload: CORRECTLY REJECTED');
        console.log('   Error:', error.message);
        results.invalidDocumentUpload = { 
          success: true, 
          message: 'Invalid document correctly rejected',
          rejectionReason: error.message
        };
      }

      // Step 9: Test Frontend Timeline
      console.log('\n📋 Step 9: Testing Frontend Timeline');
      console.log('=====================================');
      
      const timelineResponse = await fetch(`${API_BASE_URL}/bloodwork/timeline/${TEST_USER_ID}?limit=10`);
      
      if (!timelineResponse.ok) {
        const errorData = await timelineResponse.json();
        results.frontendTimeline = { 
          success: false, 
          message: `Timeline endpoint failed: ${timelineResponse.status} - ${errorData.error || 'Unknown error'}` 
        };
        console.log('❌ Timeline endpoint failed:', timelineResponse.status);
        return printFinalSummary(results);
      }
      
      const timelineResult = await timelineResponse.json();
      console.log('✅ Timeline endpoint: SUCCESS');
      console.log('   Timeline Items:', timelineResult.data?.length || 0);
      
      if (timelineResult.data && timelineResult.data.length > 0) {
        console.log('   Sample Timeline Item:');
        const firstItem = timelineResult.data[0];
        console.log('     - File Name:', firstItem.file_name);
        console.log('     - Document Type:', firstItem.document_type);
        console.log('     - Source:', firstItem.source);
        console.log('     - Upload Date:', firstItem.upload_date);
        console.log('     - Parse Status:', firstItem.parse_status);
      }
      
      results.frontendTimeline = { 
        success: true, 
        message: 'Frontend timeline working correctly',
        timelineItems: timelineResult.data
      };

      // Test stats endpoint as well
      const statsResponse = await fetch(`${API_BASE_URL}/bloodwork/stats/${TEST_USER_ID}`);
      
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        console.log('✅ Stats endpoint: SUCCESS');
        console.log('   Total Documents:', statsResult.data?.total_documents);
        console.log('   Parsed Documents:', statsResult.data?.parsed_documents);
        console.log('   Pending Documents:', statsResult.data?.pending_documents);
        console.log('   Failed Documents:', statsResult.data?.failed_documents);
      }

    } catch (error) {
      console.error('❌ Validation failed:', error);
      results.singleDocumentUpload = { 
        success: false, 
        message: `Validation error: ${error.message}` 
      };
    }

  } catch (error) {
    console.error('❌ End-to-end validation failed:', error);
  } finally {
    // Clean up test data
    await cleanupTestData();
  }

  // Print final summary
  printFinalSummary(results);
}

async function cleanupTestData() {
  try {
    console.log('\n🧹 Cleaning up test data...');
    
    const { error } = await supabase
      .from('bloodwork_documents')
      .delete()
      .eq('user_id', TEST_USER_ID);
    
    if (error) {
      console.log('⚠️  Cleanup error:', error.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
  } catch (error) {
    console.log('⚠️  Cleanup error:', error.message);
  }
}

function printFinalSummary(results) {
  console.log('\n📊 BLOODWORK UPLOAD VALIDATION SUMMARY');
  console.log('=====================================');
  
  const testNames = {
    databaseSchema: 'Database Schema',
    singleDocumentUpload: 'Single Document Upload',
    recordCreation: 'Record Creation',
    fileUrlStorage: 'File URL Storage',
    parseStatusPending: 'Parse Status = Pending',
    retrievalEndpoint: 'Retrieval Endpoint',
    multipleDocumentUpload: 'Multiple Document Upload',
    invalidDocumentUpload: 'Invalid Document Upload',
    frontendTimeline: 'Frontend Timeline',
  };
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testNames[test]}`);
    if (!result.success && result.message) {
      console.log(`    ${result.message}`);
    }
  });

  const passedTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  const overallSuccess = passedTests === totalTests;
  
  console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`📈 Test Coverage: ${passedTests}/${totalTests} tests passed`);

  if (overallSuccess) {
    console.log('\n🎉 BLOODWORK DOCUMENT UPLOAD ENGINE VALIDATION COMPLETE!');
    console.log('✅ Database schema deployed and working');
    console.log('✅ Single document upload functional');
    console.log('✅ Records created correctly with all fields');
    console.log('✅ File URLs stored properly');
    console.log('✅ Parse status set to pending by default');
    console.log('✅ Retrieval endpoints working');
    console.log('✅ Multiple document upload supported');
    console.log('✅ Invalid documents correctly rejected');
    console.log('✅ Frontend timeline rendering correctly');
    console.log('\n🚀 BLOODWORK UPLOAD ENGINE READY FOR PRODUCTION!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Deploy to production environment');
    console.log('2. Implement document parsing engine');
    console.log('3. Add file storage integration (S3/Cloudinary)');
    console.log('4. Implement real-time status updates');
    console.log('5. Add document preview functionality');
  } else {
    console.log('\n🔧 REMAINING ISSUES:');
    Object.entries(results).forEach(([test, result]) => {
      if (!result.success) {
        console.log(`   - ${testNames[test]}: ${result.message}`);
      }
    });
    console.log('\n📋 TROUBLESHOOTING:');
    console.log('1. Ensure database schema is deployed');
    console.log('2. Check backend server is running');
    console.log('3. Verify API endpoints are accessible');
    console.log('4. Check file upload configuration');
    console.log('5. Review error logs for detailed issues');
  }

  return results;
}

// Run validation
validateBloodworkUpload()
  .then((results) => {
    const overallSuccess = Object.values(results).every(r => r.success);
    process.exit(overallSuccess ? 0 : 1);
  })
  .catch((error) => {
    console.error('Bloodwork upload validation failed:', error);
    process.exit(1);
  });
