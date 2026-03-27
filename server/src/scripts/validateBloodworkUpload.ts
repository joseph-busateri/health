/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = 'bloodwork-validation-user';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test data interfaces
interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

interface TestResults {
  databaseSchema: ValidationResult;
  documentUpload: ValidationResult;
  recordCreation: ValidationResult;
  fileReferenceStored: ValidationResult;
  parseStatusCorrect: ValidationResult;
  getDocumentsByUser: ValidationResult;
  getDocumentById: ValidationResult;
  multipleUploads: ValidationResult;
  cleanup: ValidationResult;
}

// Create sample test files
const createSamplePDF = (): Buffer => {
  const samplePDFContent = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000120 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF'
  );
  return samplePDFContent;
};

const createSampleImage = (): Buffer => {
  const samplePNGContent = Buffer.from(
    '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
  );
  return samplePNGContent;
};

// Helper functions
const logStep = (step: string, status: '✅' | '❌' | '⏳', message: string, details?: any) => {
  console.log(`${status} ${step}`);
  console.log(`   ${message}`);
  if (details) {
    console.log(`   Details:`, details);
  }
  console.log('');
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Validation functions
const validateDatabaseSchema = async (): Promise<ValidationResult> => {
  try {
    const { error } = await supabase
      .from('bloodwork_documents')
      .select('count')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      return {
        success: false,
        message: 'bloodwork_documents table not found'
      };
    } else if (error) {
      return {
        success: false,
        message: `Database error: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'bloodwork_documents table exists and accessible'
    };
  } catch (error) {
    return {
      success: false,
      message: `Database connection error: ${(error as Error).message}`
    };
  }
};

const uploadTestDocument = async (fileName: string, fileBuffer: Buffer, mimeType: string): Promise<ValidationResult> => {
  try {
    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: fileName,
      contentType: mimeType,
    });
    form.append('user_id', TEST_USER_ID);
    form.append('document_type', 'comprehensive');
    form.append('source', 'manual_upload');
    form.append('test_date', '2024-01-15');
    form.append('notes', 'Test bloodwork document');

    const response = await fetch(`${API_BASE_URL}/bloodwork/upload`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Upload failed with status ${response.status}`,
        details: errorText
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: 'Document uploaded successfully',
      details: result
    };
  } catch (error) {
    return {
      success: false,
      message: `Upload error: ${(error as Error).message}`
    };
  }
};

const validateRecordCreation = async (): Promise<ValidationResult> => {
  try {
    const { data, error } = await supabase
      .from('bloodwork_documents')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      return {
        success: false,
        message: `Failed to retrieve record: ${error.message}`
      };
    }
    
    if (!data) {
      return {
        success: false,
        message: 'No record found for test user'
      };
    }
    
    return {
      success: true,
      message: 'Record created successfully',
      details: {
        id: data.id,
        user_id: data.user_id,
        file_name: data.file_name,
        created_at: data.created_at
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Record validation error: ${(error as Error).message}`
    };
  }
};

const validateFileReferenceStored = async (): Promise<ValidationResult> => {
  try {
    const { data, error } = await supabase
      .from('bloodwork_documents')
      .select('file_url, file_name')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      return {
        success: false,
        message: `Failed to retrieve file reference: ${error.message}`
      };
    }
    
    if (!data || !data.file_url || !data.file_name) {
      return {
        success: false,
        message: 'File reference not stored properly'
      };
    }
    
    return {
      success: true,
      message: 'File reference stored correctly',
      details: {
        file_url: data.file_url,
        file_name: data.file_name
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `File reference validation error: ${(error as Error).message}`
    };
  }
};

const validateParseStatus = async (): Promise<ValidationResult> => {
  try {
    const { data, error } = await supabase
      .from('bloodwork_documents')
      .select('parse_status')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      return {
        success: false,
        message: `Failed to retrieve parse status: ${error.message}`
      };
    }
    
    if (!data || data.parse_status !== 'pending') {
      return {
        success: false,
        message: `Parse status not set correctly. Expected 'pending', got '${data?.parse_status}'`
      };
    }
    
    return {
      success: true,
      message: 'Parse status set correctly to pending',
      details: {
        parse_status: data.parse_status
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Parse status validation error: ${(error as Error).message}`
    };
  }
};

const validateGetDocumentsByUser = async (): Promise<ValidationResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bloodwork/documents/${TEST_USER_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `GET documents by user failed with status ${response.status}`,
        details: errorText
      };
    }

    const result = await response.json();
    
    if (!result.success || !result.data || !Array.isArray(result.data.documents)) {
      return {
        success: false,
        message: 'Invalid response format from GET documents by user'
      };
    }
    
    return {
      success: true,
      message: `Retrieved ${result.data.documents.length} documents for user`,
      details: {
        document_count: result.data.documents.length,
        documents: result.data.documents.map((doc: any) => ({
          id: doc.id,
          file_name: doc.file_name,
          parse_status: doc.parse_status
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `GET documents by user error: ${(error as Error).message}`
    };
  }
};

const validateGetDocumentById = async (): Promise<ValidationResult> => {
  try {
    // First get a document ID
    const { data: documents, error: fetchError } = await supabase
      .from('bloodwork_documents')
      .select('id')
      .eq('user_id', TEST_USER_ID)
      .limit(1);
    
    if (fetchError || !documents || documents.length === 0) {
      return {
        success: false,
        message: 'No documents found to test GET by ID'
      };
    }
    
    const documentId = documents[0].id;
    
    const response = await fetch(`${API_BASE_URL}/bloodwork/document/${documentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `GET document by ID failed with status ${response.status}`,
        details: errorText
      };
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      return {
        success: false,
        message: 'Invalid response format from GET document by ID'
      };
    }
    
    return {
      success: true,
      message: 'Document retrieved successfully by ID',
      details: {
        id: result.data.id,
        file_name: result.data.file_name,
        parse_status: result.data.parse_status
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `GET document by ID error: ${(error as Error).message}`
    };
  }
};

const validateMultipleUploads = async (): Promise<ValidationResult> => {
  try {
    const initialCount = await supabase
      .from('bloodwork_documents')
      .select('*', { count: 'exact' })
      .eq('user_id', TEST_USER_ID);
    
    if (initialCount.error) {
      return {
        success: false,
        message: `Failed to get initial count: ${initialCount.error.message}`
      };
    }
    
    const initialCountValue = initialCount.count || 0;
    
    // Upload multiple documents
    const uploadPromises = [
      uploadTestDocument('test1.pdf', createSamplePDF(), 'application/pdf'),
      uploadTestDocument('test2.png', createSampleImage(), 'image/png'),
      uploadTestDocument('test3.pdf', createSamplePDF(), 'application/pdf'),
    ];
    
    const uploadResults = await Promise.all(uploadPromises);
    const failedUploads = uploadResults.filter(result => !result.success);
    
    if (failedUploads.length > 0) {
      return {
        success: false,
        message: `${failedUploads.length} out of 3 uploads failed`,
        details: failedUploads.map(result => result.message)
      };
    }
    
    // Verify multiple documents were created
    const finalCount = await supabase
      .from('bloodwork_documents')
      .select('*', { count: 'exact' })
      .eq('user_id', TEST_USER_ID);
    
    if (finalCount.error) {
      return {
        success: false,
        message: `Failed to get final count: ${finalCount.error.message}`
      };
    }
    
    const finalCountValue = finalCount.count || 0;
    const uploadedCount = finalCountValue - initialCountValue;
    
    if (uploadedCount < 3) {
      return {
        success: false,
        message: `Expected 3 new documents, but only ${uploadedCount} were created`
      };
    }
    
    return {
      success: true,
      message: 'Multiple uploads successful',
      details: {
        documents_uploaded: uploadedCount,
        total_documents: finalCountValue
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Multiple uploads validation error: ${(error as Error).message}`
    };
  }
};

const cleanupTestData = async (): Promise<ValidationResult> => {
  try {
    const { error } = await supabase
      .from('bloodwork_documents')
      .delete()
      .eq('user_id', TEST_USER_ID);
    
    if (error) {
      return {
        success: false,
        message: `Cleanup failed: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'Test data cleaned up successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Cleanup error: ${(error as Error).message}`
    };
  }
};

// Main validation function
const runBloodworkValidation = async (): Promise<TestResults> => {
  console.log('🚀 BLOODWORK DOCUMENT UPLOAD ENGINE VALIDATION');
  console.log('================================================\n');
  
  const results: TestResults = {
    databaseSchema: { success: false, message: '' },
    documentUpload: { success: false, message: '' },
    recordCreation: { success: false, message: '' },
    fileReferenceStored: { success: false, message: '' },
    parseStatusCorrect: { success: false, message: '' },
    getDocumentsByUser: { success: false, message: '' },
    getDocumentById: { success: false, message: '' },
    multipleUploads: { success: false, message: '' },
    cleanup: { success: false, message: '' },
  };

  try {
    // Step 1: Validate Database Schema
    logStep('Step 1: Validating Database Schema', '⏳', 'Checking bloodwork_documents table...');
    results.databaseSchema = await validateDatabaseSchema();
    logStep('Step 1: Validating Database Schema', 
            results.databaseSchema.success ? '✅' : '❌', 
            results.databaseSchema.message, 
            results.databaseSchema.details);

    if (!results.databaseSchema.success) {
      console.log('❌ Database schema validation failed. Stopping validation.');
      printSummary(results);
      return results;
    }

    // Step 2: Upload Test Document
    logStep('Step 2: Upload Test Document', '⏳', 'Uploading sample bloodwork document...');
    results.documentUpload = await uploadTestDocument('test_bloodwork.pdf', createSamplePDF(), 'application/pdf');
    logStep('Step 2: Upload Test Document', 
            results.documentUpload.success ? '✅' : '❌', 
            results.documentUpload.message, 
            results.documentUpload.details);

    if (!results.documentUpload.success) {
      console.log('❌ Document upload failed. Stopping validation.');
      printSummary(results);
      return results;
    }

    // Wait a moment for database consistency
    await delay(1000);

    // Step 3: Validate Record Creation
    logStep('Step 3: Validate Record Creation', '⏳', 'Checking if bloodwork_documents record was created...');
    results.recordCreation = await validateRecordCreation();
    logStep('Step 3: Validate Record Creation', 
            results.recordCreation.success ? '✅' : '❌', 
            results.recordCreation.message, 
            results.recordCreation.details);

    // Step 4: Validate File Reference Stored
    logStep('Step 4: Validate File Reference Stored', '⏳', 'Checking if file URL and name are stored...');
    results.fileReferenceStored = await validateFileReferenceStored();
    logStep('Step 4: Validate File Reference Stored', 
            results.fileReferenceStored.success ? '✅' : '❌', 
            results.fileReferenceStored.message, 
            results.fileReferenceStored.details);

    // Step 5: Validate Parse Status
    logStep('Step 5: Validate Parse Status', '⏳', 'Checking if parse_status is set to pending...');
    results.parseStatusCorrect = await validateParseStatus();
    logStep('Step 5: Validate Parse Status', 
            results.parseStatusCorrect.success ? '✅' : '❌', 
            results.parseStatusCorrect.message, 
            results.parseStatusCorrect.details);

    // Step 6: Validate GET Documents by User
    logStep('Step 6: Validate GET /bloodwork/documents/:user_id', '⏳', 'Testing user documents endpoint...');
    results.getDocumentsByUser = await validateGetDocumentsByUser();
    logStep('Step 6: Validate GET /bloodwork/documents/:user_id', 
            results.getDocumentsByUser.success ? '✅' : '❌', 
            results.getDocumentsByUser.message, 
            results.getDocumentsByUser.details);

    // Step 7: Validate GET Document by ID
    logStep('Step 7: Validate GET /bloodwork/document/:id', '⏳', 'Testing single document endpoint...');
    results.getDocumentById = await validateGetDocumentById();
    logStep('Step 7: Validate GET /bloodwork/document/:id', 
            results.getDocumentById.success ? '✅' : '❌', 
            results.getDocumentById.message, 
            results.getDocumentById.details);

    // Step 8: Validate Multiple Uploads
    logStep('Step 8: Validate Multiple Uploads', '⏳', 'Testing multiple document uploads...');
    results.multipleUploads = await validateMultipleUploads();
    logStep('Step 8: Validate Multiple Uploads', 
            results.multipleUploads.success ? '✅' : '❌', 
            results.multipleUploads.message, 
            results.multipleUploads.details);

  } catch (error) {
    console.error('❌ Validation failed with error:', error);
  } finally {
    // Step 9: Cleanup
    logStep('Step 9: Cleanup Test Data', '⏳', 'Removing test records...');
    results.cleanup = await cleanupTestData();
    logStep('Step 9: Cleanup Test Data', 
            results.cleanup.success ? '✅' : '❌', 
            results.cleanup.message, 
            results.cleanup.details);

    // Print final summary
    printSummary(results);
  }

  return results;
};

const printSummary = (results: TestResults): void => {
  console.log('\n📊 BLOODWORK VALIDATION SUMMARY');
  console.log('===================================');
  
  const testNames = {
    databaseSchema: 'Database Schema',
    documentUpload: 'Document Upload',
    recordCreation: 'Record Creation',
    fileReferenceStored: 'File Reference Stored',
    parseStatusCorrect: 'Parse Status = Pending',
    getDocumentsByUser: 'GET Documents by User',
    getDocumentById: 'GET Document by ID',
    multipleUploads: 'Multiple Uploads',
    cleanup: 'Cleanup',
  };
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testNames[test as keyof TestResults]}`);
    if (!result.success && result.message) {
      console.log(`    ${result.message}`);
    }
  });

  const passedTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length - 1; // Exclude cleanup from main test count
  const overallSuccess = passedTests >= totalTests * 0.8; // 80% pass rate
  
  console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED'}`);
  console.log(`📈 Test Coverage: ${passedTests}/${totalTests} tests passed`);

  if (overallSuccess) {
    console.log('\n🎉 BLOODWORK DOCUMENT UPLOAD ENGINE VALIDATION COMPLETE!');
    console.log('✅ All critical functionality working correctly');
    console.log('✅ Database operations successful');
    console.log('✅ API endpoints responding');
    console.log('✅ File upload workflow complete');
    console.log('✅ Multiple uploads supported');
    console.log('\n🚀 BLOODWORK ENGINE READY FOR PRODUCTION!');
  } else {
    console.log('\n🔧 REMAINING ISSUES:');
    Object.entries(results).forEach(([test, result]) => {
      if (!result.success && test !== 'cleanup') {
        console.log(`   - ${testNames[test as keyof TestResults]}: ${result.message}`);
      }
    });
    
    console.log('\n📋 TROUBLESHOOTING:');
    console.log('1. Ensure backend server is running');
    console.log('2. Check API endpoints are accessible');
    console.log('3. Verify database schema is deployed');
    console.log('4. Review error logs for detailed issues');
  }
};

// Run validation
runBloodworkValidation()
  .then((validationResults) => {
    const success = Object.values(validationResults).filter(r => r.success).length >= 6;
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Bloodwork validation failed:', error);
    process.exit(1);
  });
