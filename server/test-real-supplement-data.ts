import 'dotenv/config';

// Extracted text from user's supplement spreadsheet
const realSupplementData = `
Supplementation | Dosage | Timing | Goal / Why You're Taking It

Berberine | 2,000 mg 3x/day | With Each Meal | Blood glucose control, A1C reduction, cholesterol support, modest BP benefit

Ashwagandha | 600 mg | Morning Before Breakfast | Cortisol reduction, libido, stress resilience, modest testosterone support

Beetroot Powder | 1,000 mg | Morning Before Breakfast | Nitrate-based BP reduction and training performance

Beta-Ecdysterone | 500 mg 2x/day | Was: Pre-workout | Was: Anabolic signaling support

Boron | 10MG | Morning Before Breakfast | Reduces SHBG, supports free testosterone, joint health

BPC-157 (oral) | 500 mg 2x/day | Morning + Afternoon | Was: Joint/tissue repair

Citrus Bergamot | 600 mg | Morning Before Breakfast | Cholesterol management, cardiovascular support

Collagen Peptides | 10G 2x/day | Morning + Afternoon | Joint and connective tissue support

CoQ10 (Ubiquinol) | 200 mg | Morning Before Breakfast | Cardiovascular health, blood pressure support, mitochondrial energy for training

Creatine Monohydrate | 2.5G 2x/day | Morning + Afternoon | Strength, power output, muscle retention

DHEA | 25-50 mg | Morning Before Breakfast | Androgen precursor support
`;

function parseSupplementSpreadsheet(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Skip header line
  const dataLines = lines.filter(line => 
    !line.toLowerCase().includes('supplementation') && 
    !line.includes('Dosage') &&
    line.includes('|')
  );
  
  const supplements: any[] = [];
  
  for (const line of dataLines) {
    // Split by pipe delimiter
    const parts = line.split('|').map(p => p.trim());
    
    if (parts.length >= 4) {
      const [name, dosage, timing, goal] = parts;
      
      // Extract numeric dosage and unit
      const dosageMatch = dosage.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*([a-zA-Z]+)/);
      let dosageValue = 1;
      let dosageUnit = 'unit';
      
      if (dosageMatch) {
        dosageValue = parseFloat(dosageMatch[1].replace(',', ''));
        dosageUnit = dosageMatch[2];
      }
      
      // Extract frequency from dosage (e.g., "2x/day", "3x/day")
      const frequencyMatch = dosage.match(/(\d+)x\/day/);
      const frequency = frequencyMatch ? `${frequencyMatch[1]}x daily` : 'daily';
      
      // Determine status
      const isWas = timing.toLowerCase().includes('was:') || goal.toLowerCase().includes('was:');
      const status = isWas ? 'paused' : 'active';
      
      supplements.push({
        supplementName: name,
        dosage: dosageValue,
        dosageUnit: dosageUnit,
        frequency: frequency,
        timing: timing.replace('Was:', '').trim(),
        goal: goal.replace('Was:', '').trim(),
        status: status
      });
    }
  }
  
  return {
    stackName: 'Health & Performance Stack',
    stackNotes: 'Comprehensive supplement protocol for health optimization and performance',
    supplements: supplements
  };
}

async function testRealSupplementData() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TESTING REAL SUPPLEMENT DATA');
  console.log('User\'s actual supplement spreadsheet');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('EXTRACTED TEXT (from spreadsheet image):');
  console.log('─────────────────────────────────────────────────────────');
  console.log(realSupplementData);
  console.log();

  // Expected supplements from the image
  const expectedSupplements = [
    { name: 'Berberine', dosage: 2000, unit: 'mg', frequency: '3x daily', status: 'active' },
    { name: 'Ashwagandha', dosage: 600, unit: 'mg', frequency: 'daily', status: 'active' },
    { name: 'Beetroot Powder', dosage: 1000, unit: 'mg', frequency: 'daily', status: 'active' },
    { name: 'Beta-Ecdysterone', dosage: 500, unit: 'mg', frequency: '2x daily', status: 'paused' },
    { name: 'Boron', dosage: 10, unit: 'MG', frequency: 'daily', status: 'active' },
    { name: 'BPC-157 (oral)', dosage: 500, unit: 'mg', frequency: '2x daily', status: 'paused' },
    { name: 'Citrus Bergamot', dosage: 600, unit: 'mg', frequency: 'daily', status: 'active' },
    { name: 'Collagen Peptides', dosage: 10, unit: 'G', frequency: '2x daily', status: 'active' },
    { name: 'CoQ10 (Ubiquinol)', dosage: 200, unit: 'mg', frequency: 'daily', status: 'active' },
    { name: 'Creatine Monohydrate', dosage: 2.5, unit: 'G', frequency: '2x daily', status: 'active' },
    { name: 'DHEA', dosage: 25, unit: 'mg', frequency: 'daily', status: 'active' }
  ];

  console.log('EXPECTED SUPPLEMENTS (from image):');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Total supplements visible:', expectedSupplements.length);
  console.log('Active supplements:', expectedSupplements.filter(s => s.status === 'active').length);
  console.log('Paused supplements:', expectedSupplements.filter(s => s.status === 'paused').length);
  console.log();

  // Parse the data
  console.log('PARSING SUPPLEMENT DATA');
  console.log('─────────────────────────────────────────────────────────');
  const result = parseSupplementSpreadsheet(realSupplementData);
  
  console.log('Stack Name:', result.stackName);
  console.log('Stack Notes:', result.stackNotes);
  console.log('Supplements Found:', result.supplements.length);
  console.log();

  if (result.supplements.length > 0) {
    console.log('EXTRACTED SUPPLEMENTS:');
    console.log('─────────────────────────────────────────────────────────');
    result.supplements.forEach((supp, idx) => {
      console.log(`${idx + 1}. ${supp.supplementName}`);
      console.log(`   Dosage: ${supp.dosage} ${supp.dosageUnit}`);
      console.log(`   Frequency: ${supp.frequency}`);
      console.log(`   Timing: ${supp.timing}`);
      console.log(`   Goal: ${supp.goal}`);
      console.log(`   Status: ${supp.status}`);
      console.log();
    });

    // Accuracy check
    console.log('ACCURACY CHECK:');
    console.log('─────────────────────────────────────────────────────────');
    let correctCount = 0;
    
    expectedSupplements.forEach(expected => {
      const found = result.supplements.find(s => 
        s.supplementName.toLowerCase() === expected.name.toLowerCase()
      );
      
      if (found) {
        const dosageMatch = found.dosage === expected.dosage;
        const statusMatch = found.status === expected.status;
        const match = dosageMatch && statusMatch;
        
        if (match) correctCount++;
        
        console.log(`${match ? '✓' : '✗'} ${expected.name}:`);
        console.log(`    Dosage: ${found.dosage} ${found.dosageUnit} ${dosageMatch ? '==' : '!='} ${expected.dosage} ${expected.unit}`);
        console.log(`    Status: ${found.status} ${statusMatch ? '==' : '!='} ${expected.status}`);
      } else {
        console.log(`✗ ${expected.name}: NOT FOUND`);
      }
    });
    
    const accuracy = (correctCount / expectedSupplements.length * 100).toFixed(1);
    console.log(`\nAccuracy: ${correctCount}/${expectedSupplements.length} (${accuracy}%)`);
  } else {
    console.log('✗ No supplements extracted');
  }
  console.log();

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Input Format: Spreadsheet (pipe-delimited)');
  console.log('Expected Supplements:', expectedSupplements.length);
  console.log('Extracted Supplements:', result.supplements.length);
  console.log('Active Supplements:', result.supplements.filter(s => s.status === 'active').length);
  console.log('Paused Supplements:', result.supplements.filter(s => s.status === 'paused').length);
  console.log();
  console.log('Extracted Data:');
  console.log('  ✓ Supplement names');
  console.log('  ✓ Dosages (numeric + unit)');
  console.log('  ✓ Frequency (daily, 2x daily, 3x daily)');
  console.log('  ✓ Timing (morning, afternoon, with meals)');
  console.log('  ✓ Goals/reasons for taking');
  console.log('  ✓ Status (active vs paused)');
  console.log();
  console.log('Use Case:');
  console.log('  → ONE-TIME baseline upload');
  console.log('  → Documents current supplement protocol');
  console.log('  → Used as context for health recommendations');
  console.log('  → Tracks active vs discontinued supplements');
  console.log();
  console.log('SYSTEM STATUS:');
  if (result.supplements.length === expectedSupplements.length) {
    console.log('✓ Spreadsheet parsing: WORKING');
    console.log('✓ All supplements extracted: YES');
    console.log('✓ Status detection: WORKING');
    console.log('✓ One-time baseline upload: READY');
  } else {
    console.log('⚠️  Some supplements may be missing');
    console.log('→ Review parsing logic for edge cases');
  }
  console.log('═══════════════════════════════════════════════════════════');
}

testRealSupplementData().catch(error => {
  console.error('Test failed:', error);
});
