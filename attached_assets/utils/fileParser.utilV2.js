import csv from 'csv-parser';
import ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
import { stringify } from 'csv-stringify';
import processorTypeMap from '../lib/typeMap.lib.js';

export const parseFile = async (buffer, mimetype, processor) => {
  try {
    const type = processorTypeMap[processor];
    //console.log(`Parsing file for processor: ${processor}, mimetype: ${mimetype}`);

    // Convert XLSX files to CSV buffers first
    if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      //console.log('Detected XLSX file. Converting to CSV...');
      const csvBuffers = await convertXlsxToCsv(buffer);
      const firstSheetCsv = Object.values(csvBuffers)[0];
      buffer = firstSheetCsv; // Replace buffer with the first sheet's CSV buffer
      mimetype = 'text/csv'; // Update mimetype
    }

    // Process CSV files
    if (mimetype === 'text/csv' || mimetype === 'application/csv') {
      //console.log(`Processing CSV file with type: ${type}`);
      if (processor === 'Hyfin') {
        return await delayedCsvParser(buffer, 5); // Use startRow = 5 for Hyfin
      }

      switch (type) {
        case 'billing':
        case 'type2':
        case 'type3':
        case 'type4':
        case 'type5':
          return await parseCSV(buffer);
        case 'type1':
          return await type2CsvParser(buffer);
        default:
          console.warn(`Unknown processor type: ${type}`);
          return [];
      }
    }

    throw new Error('Unsupported file type: ' + mimetype);
  } catch (error) {
    console.error('Error parsing file:', error.message);
    throw new Error('Error parsing file: ' + error.message);
  }
};

// Convert XLSX to CSV buffers for all sheets
const convertXlsxToCsv = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  //console.log('Workbook loaded successfully.');

  const csvBuffers = {};
  for (const sheet of workbook.worksheets) {
    //console.log(`Processing sheet: ${sheet.name}`);
    const rows = [];
    sheet.eachRow({ includeEmpty: true }, (row) => {
      const rowData = row.values.map((val) => {
        if (val === null || val === undefined) {
          return ''; // Handle empty cells
        }
        if (typeof val === 'object') {
          // Attempt to extract meaningful data from objects
          if ('result' in val) return val.result; // Extract the `result` field
          if ('formula' in val) return val.formula; // Extract the formula
          return JSON.stringify(val); // Fallback to JSON string
        }
        return val.toString(); // Default string conversion for primitives
      });
      rows.push(rowData);
    });

    const csvPromise = new Promise((resolve, reject) => {
      stringify(rows, (err, output) => {
        if (err) {
          console.error(`Error converting sheet to CSV: ${sheet.name}`, err);
          return reject(err);
        }
        resolve(Buffer.from(output));
      });
    });

    csvBuffers[sheet.name] = await csvPromise;
    //console.log(`Sheet ${sheet.name} converted to CSV.`);
  }
  return csvBuffers;
};

// Parse CSV buffer into JSON
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new PassThrough();
    bufferStream.end(buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        //console.log('CSV parsing completed.');
        resolve(results);
      })
      .on('error', (err) => {
        console.error('Error parsing CSV data:', err);
        reject(new Error(`Error parsing CSV data: ${err.message}`));
      });
  });
};

// Parse CSV with start row
const delayedCsvParser = (buffer, startRow) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new PassThrough();
    bufferStream.end(buffer);

    let rowCounter = 0;
    let headers = [];

    bufferStream
      .pipe(csv({ headers: false }))
      .on('data', (data) => {
        rowCounter++;
        if (rowCounter === startRow) {
          headers = Object.values(data).map((header) => header.trim());
          //console.log('Parsed headers:', headers);
        } else if (rowCounter > startRow) {
          const remappedRow = {};
          Object.keys(data).forEach((key, index) => {
            remappedRow[headers[index]] = data[key];
          });
          //console.log('Remapped row:', remappedRow);
          results.push(remappedRow);
        }
      })
      .on('end', () => {
        //console.log('Delayed CSV parsing completed.');
        resolve(results);
      })
      .on('error', (err) => {
        console.error('Error parsing delayed CSV data:', err);
        reject(new Error(`Error parsing delayed CSV data: ${err.message}`));
      });
  });
};

// Parse type 1 CSV
const type2CsvParser = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new PassThrough();
    bufferStream.end(buffer);

    let rowCounter = 0;
    let headers = [];

    bufferStream
      .pipe(csv({ headers: false }))
      .on('data', (data) => {
        rowCounter++;
        if (rowCounter === 3) {
          headers = Object.values(data).map((header) => header.trim());
          //console.log('Parsed headers (Type 1):', headers);
        } else if (rowCounter > 3) {
          const remappedRow = {};
          Object.keys(data).forEach((key, index) => {
            remappedRow[headers[index]] = data[key];
          });
          //console.log('Remapped row (Type 1):', remappedRow);
          results.push(remappedRow);
        }
      })
      .on('end', () => {
        //console.log('Type 1 CSV parsing completed.');
        resolve(results);
      })
      .on('error', (err) => {
        console.error('Error parsing Type 1 CSV data:', err);
        reject(new Error(`Error parsing Type 1 CSV data: ${err.message}`));
      });
  });
};
