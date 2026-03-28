/// <reference types="node" />
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const API_BASE_URL = 'http://localhost:3000';

async function testUpload() {
  try {
    console.log('🧪 Testing upload endpoint...');
    
    // Create a simple test file
    const testFilePath = path.join(__dirname, 'test.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload');
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test.txt',
      contentType: 'text/plain'
    });
    formData.append('user_id', 'test-user-123');
    formData.append('file_name', 'test.txt');
    formData.append('document_type', 'lab_panel');
    formData.append('source', 'manual_upload');
    formData.append('notes', 'Test upload');

    console.log('📤 Sending request...');

    const response = await fetch(`${API_BASE_URL}/bloodwork/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('📥 Response status:', response.status);
    console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📋 Response data:', data);

    // Clean up
    fs.unlinkSync(testFilePath);

    if (response.ok) {
      console.log('✅ Upload test successful!');
    } else {
      console.log('❌ Upload test failed:', data.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testUpload();
