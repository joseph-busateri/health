// Debug script to test upload step by step
const testUpload = async () => {
  console.log('🧪 Starting debug upload...');
  
  // Create a test file
  const blob = new Blob(['test content'], { type: 'text/plain' });
  const file = new File([blob], 'test.txt', { type: 'text/plain' });
  
  console.log('📁 Test file created:', file);
  
  // Create FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', 'debug-user');
  formData.append('file_name', 'test.txt');
  formData.append('document_type', 'lab_panel');
  formData.append('source', 'manual_upload');
  formData.append('notes', 'debug test');
  
  console.log('📋 FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
  }
  
  try {
    console.log('🚀 Sending request...');
    
    const response = await fetch('http://localhost:3000/bloodwork/upload', {
      method: 'POST',
      body: formData,
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📋 Response data:', data);
    
    if (response.ok) {
      console.log('✅ Upload successful!');
    } else {
      console.log('❌ Upload failed:', data.error);
    }
    
  } catch (error) {
    console.error('💥 Upload error:', error);
  }
};

// Run the test
testUpload();
