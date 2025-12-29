import csv from 'csv-parser';
import ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
import { stringify } from 'csv-stringify';
import processorTypeMap from '../lib/typeMap.lib.js';

export const parseFile = async (buffer, mimetype, processor) => {
  try {
    const type = processorTypeMap[processor]
    if (!processor) {
      return await parseCSV(buffer);
    }
    if (processor === 'Hyfin') {
      if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        return await delayedXlsxParser(buffer, 5);
      } else if (mimetype === 'text/csv' || mimetype === 'application/csv') {
        return await delayedCsvParser(buffer, 5);
      } else {
        throw new Error('Unsupported file type: ' + mimetype);
      };
    };
    
          switch (type) {
        case 'billing':
        case 'type2':
        case 'type3':
        case 'type4':
        case 'type5':
          if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            return await parseXLSX(buffer);
          } else if (mimetype === 'text/csv' || mimetype === 'application/csv') {
            return await parseCSV(buffer);
          } else {
            throw new Error('Unsupported file type: ' + mimetype);
          };
      case 'type1':
        return await type2CsvParser(buffer);
      default:
        return
    }
  } catch (error) {
    throw new Error('Error parsing file: ' + error.message);
  }
};


const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new PassThrough();
    bufferStream.end(buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(new Error(`Error parsing CSV data: ${err.message}`));
      });
  });
};

const parseXLSX = async (fileBuffer) => {
  try {
    const normalBuffer = normalizeXLSX(fileBuffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(normalBuffer); // Load from the buffer directly

    const sheet = workbook.getWorksheet(1); // Assuming you want the first sheet
    const jsonData = [];
    
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => { // Set includeEmpty to false
      if (rowNumber === 1) return; // Skip header row if needed

      const rowData = {};
      let isEmpty = true;

      row.eachCell((cell, colNumber) => {
        const value = cell.value;

        // Only process non-empty cells
        if (value !== null && value !== undefined && value !== '') {

          rowData[sheet.getRow(1).getCell(colNumber).value] = value;
          isEmpty = false;
        }
      });

      // Only push rowData if it's not empty
      if (!isEmpty) {
        jsonData.push(rowData);
      }
    });

    return jsonData; // Return the filtered JSON data
  } catch (error) {
    console.error('Error parsing XLSX file:', error.message);
    throw new Error('Error parsing XLSX file: ' + error.message);
  }
};

const delayedCsvParser = (buffer, startRow) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new PassThrough();
    bufferStream.end(buffer);

    let rowCounter = 0;
    let headers = [];

    bufferStream
      .pipe(csv({ headers: false })) // Disable auto-headers
      .on('data', (data) => {
        rowCounter++;

        // Row 3 contains the headers
        if (rowCounter === startRow) {
          headers = Object.values(data); // Store the row as headers
        }

        // Rows after row 3 will be the actual data
        if (rowCounter > startRow) {
          const remappedRow = {};
          Object.keys(data).forEach((key, index) => {
            remappedRow[headers[index]] = data[key];
          });
          results.push(remappedRow);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(new Error(`Error parsing Type 2 CSV data: ${err.message}`));
      });
  });
};

const delayedXlsxParser = async (fileBuffer, startRow) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer); // Load from the buffer directly

    const sheet = workbook.getWorksheet(1); // Assuming you want the first sheet
    const jsonData = [];

    let headers = [];

    // Iterate through each row in the sheet
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      // If the current row is the header row, capture the headers
      if (rowNumber === startRow) {
        headers = row.values; // Store the row values as headers (row.values includes empty cells)
        return; // Skip to the next iteration
      }

      // For rows after the header row
      if (rowNumber > startRow) {
        const rowData = {};
        let isEmpty = true;

        row.eachCell((cell, colNumber) => {
          const value = cell.value;

          // Only process non-empty cells
          if (value !== null && value !== undefined && value !== '') {
            rowData[headers[colNumber]] = value;
            isEmpty = false;
          }
        });

        // Only push rowData if it's not empty
        if (!isEmpty) {
          jsonData.push(rowData);
        }
      }
    });

    return jsonData; // Return the filtered JSON data
  } catch (error) {
    console.error('Error parsing XLSX file:', error.message);
    throw new Error('Error parsing XLSX file: ' + error.message);
  }
};


const type2CsvParser = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new PassThrough();
    bufferStream.end(buffer);

    let rowCounter = 0;
    let headers = [];

    bufferStream
      .pipe(csv({ headers: false })) // Disable auto-headers
      .on('data', (data) => {
        rowCounter++;

        // Row 3 contains the headers
        if (rowCounter === 3) {
          headers = Object.values(data); // Store the row as headers
        }

        // Rows after row 3 will be the actual data
        if (rowCounter > 3) {
          const remappedRow = {};
          Object.keys(data).forEach((key, index) => {
            remappedRow[headers[index]] = data[key];
          });
          results.push(remappedRow);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(new Error(`Error parsing Type 2 CSV data: ${err.message}`));
      });
  });
};

const normalizeXLSX = async (fileBuffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const newWorkbook = new ExcelJS.Workbook();
  workbook.eachSheet((sheet, sheetId) => {
    const newSheet = newWorkbook.addWorksheet(sheet.name);
    sheet.eachRow((row, rowNumber) => {
      const newRow = newSheet.addRow();
      row.eachCell((cell, colNumber) => {
        newRow.getCell(colNumber).value = cell.value;
      });
    });
  });

  const newBuffer = await newWorkbook.xlsx.writeBuffer();
  return newBuffer;
};
