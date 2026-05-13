import { supabase } from '../config/supabase';

async function checkBloodworkReports() {
  try {
    console.log('Checking for bloodwork documents...\n');

    // Query all bloodwork documents
    const { data: documents, error } = await supabase
      .from('bloodwork_documents')
      .select('*')
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error querying bloodwork_documents:', error);
      return;
    }

    if (!documents || documents.length === 0) {
      console.log('❌ No bloodwork documents found in database');
      return;
    }

    console.log(`✅ Found ${documents.length} bloodwork document(s):\n`);

    documents.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  User ID: ${doc.user_id}`);
      console.log(`  Accession #: ${doc.accession_number || 'N/A'}`);
      console.log(`  Patient Name: ${doc.account_name || 'N/A'}`);
      console.log(`  Test Date: ${doc.test_date || 'N/A'}`);
      console.log(`  Specimen Date: ${doc.specimen_datetime || 'N/A'}`);
      console.log(`  Upload Date: ${doc.upload_date}`);
      console.log(`  Parse Status: ${doc.parse_status}`);
      console.log(`  Processing Status: ${doc.processing_status || 'N/A'}`);
      console.log('');
    });

    // Check for the two specific reports based on accession numbers
    const report1 = documents.find(d => d.accession_number === 'A07026360000598');
    const report2 = documents.find(d => d.accession_number === 'A07026360000695');

    console.log('\nLooking for specific reports:');
    console.log(`  Report 1 (A07026360000598 - June 2023): ${report1 ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`  Report 2 (A07026360000695 - August 2023): ${report2 ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // Count results for each document
    if (documents.length > 0) {
      console.log('\nChecking bloodwork results...\n');
      
      for (const doc of documents) {
        const { data: results, error: resultsError } = await supabase
          .from('bloodwork_results')
          .select('id')
          .eq('document_id', doc.id);

        if (!resultsError && results) {
          console.log(`Document ${doc.accession_number || doc.id}: ${results.length} test results`);
        }
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkBloodworkReports();
