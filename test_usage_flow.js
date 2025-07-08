// Test script to trace usage type data flow
import { parseCSVData } from './src/utils/csvParser.js';
import { computeUsageDistribution } from './src/utils/statisticsUtils.js';

async function testUsageDataFlow() {
  console.log('=== TESTING USAGE TYPE DATA FLOW ===\n');
  
  try {
    // Step 1: Load CSV data
    console.log('STEP 1: Loading CSV data...');
    const csvPath = './public/ahrq_reference_good.csv';
    const publications = await parseCSVData(csvPath);
    
    console.log(`Loaded ${publications.length} publications`);
    console.log('Sample publication:', JSON.stringify(publications[0], null, 2));
    console.log('\nUsage types in first 5 publications:');
    publications.slice(0, 5).forEach((pub, i) => {
      console.log(`  ${i + 1}. ${pub.usage_type} - "${pub.title.substring(0, 50)}..."`);
    });
    
    // Step 2: Count usage types manually
    console.log('\nSTEP 2: Manual usage type count:');
    const manualCounts = {};
    publications.forEach(pub => {
      const usage = pub.usage_type || 'UNKNOWN';
      manualCounts[usage] = (manualCounts[usage] || 0) + 1;
    });
    console.log('Manual counts:', manualCounts);
    
    // Step 3: Use computeUsageDistribution
    console.log('\nSTEP 3: Using computeUsageDistribution...');
    const usageData = computeUsageDistribution(publications);
    console.log('Usage distribution result:', JSON.stringify(usageData, null, 2));
    
    // Step 4: Verify the transformation
    console.log('\nSTEP 4: Verifying data transformation:');
    usageData.forEach(item => {
      const originalCount = manualCounts[item.name.replace(/ /g, '_').toUpperCase()] || 0;
      console.log(`  ${item.name}: ${item.value} (Original: ${originalCount}) - Match: ${item.value === originalCount}`);
    });
    
    // Step 5: Check what would be passed to chart
    console.log('\nSTEP 5: Data that would be passed to PremiumBarChart:');
    const chartData = usageData.map((u, i) => ({
      ...u,
      color: ['#3B82F6', '#10B981', '#F59E0B'][i] || '#6B7280'
    }));
    console.log('Chart data:', JSON.stringify(chartData, null, 2));
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testUsageDataFlow();