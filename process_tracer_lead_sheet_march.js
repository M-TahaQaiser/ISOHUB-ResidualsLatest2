// Process 2025-04 Tracer Consulting Group Lead Sheet (March data)
import XLSX from 'xlsx';
import fs from 'fs';

console.log('📋 PROCESSING TRACER LEAD SHEET - MARCH 2025');
console.log('='.repeat(80));

try {
  // Read the Excel file
  const workbook = XLSX.readFile('attached_assets/2025-04 Tracer Consulting Group - Raw_1753237180738.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`\n📊 LEAD SHEET PROCESSING RESULTS:`);
  console.log(`Total Records Found: ${data.length}`);
  console.log(`Sheet Name: ${sheetName}`);
  
  // Analyze the structure
  if (data.length > 0) {
    console.log(`\n📋 COLUMN STRUCTURE:`);
    const firstRow = data[0];
    Object.keys(firstRow).forEach((key, index) => {
      console.log(`${index + 1}. ${key}: ${firstRow[key]}`);
    });
  }
  
  console.log(`\n🎯 SAMPLE DATA (First 5 Records):`);
  data.slice(0, 5).forEach((record, index) => {
    console.log(`\nRecord ${index + 1}:`);
    Object.entries(record).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        console.log(`  ${key}: ${value}`);
      }
    });
  });
  
  // Look for key fields
  console.log(`\n🔍 FIELD ANALYSIS:`);
  const sampleRecord = data[0] || {};
  const possibleMIDFields = Object.keys(sampleRecord).filter(key => 
    key.toLowerCase().includes('mid') || 
    key.toLowerCase().includes('merchant') ||
    key.toLowerCase().includes('id')
  );
  
  const possibleStatusFields = Object.keys(sampleRecord).filter(key =>
    key.toLowerCase().includes('status') ||
    key.toLowerCase().includes('stage') ||
    key.toLowerCase().includes('phase')
  );
  
  console.log(`Possible MID fields: ${possibleMIDFields.join(', ')}`);
  console.log(`Possible Status fields: ${possibleStatusFields.join(', ')}`);
  
  // Count records by status/stage if available
  if (possibleStatusFields.length > 0) {
    const statusField = possibleStatusFields[0];
    const statusCounts = {};
    
    data.forEach(record => {
      const status = record[statusField];
      if (status) {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });
    
    console.log(`\n📈 STATUS DISTRIBUTION (${statusField}):`);
    Object.entries(statusCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([status, count]) => {
        console.log(`  ${status}: ${count} records`);
      });
  }
  
  console.log(`\n✅ TRACER LEAD SHEET ANALYSIS COMPLETE`);
  console.log(`${data.length} records analyzed from March 2025 lead sheet`);
  console.log(`Ready for master lead sheet processing and merchant lifecycle tracking`);
  
} catch (error) {
  console.error('Error processing Tracer lead sheet:', error);
  process.exit(1);
}

console.log('='.repeat(80));