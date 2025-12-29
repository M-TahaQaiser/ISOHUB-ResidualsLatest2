import ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
import ReportsM from '../models/reports.model.js';
import Report from '../classes/report.class.js';
import ARRow from '../classes/arRow.class.js';
import csv from 'csv-parser';

export default class ReportsCoor {
  static getReport = async (reportID) => {
    try {
      const report = await ReportsM.getReport(reportID);
      return report;
    } catch (error) {
      throw new Error('Error getting report: ' + error.message);
    }
  };

  static getReports = async (organizationID, type) => {
    try {
      const reports = await ReportsM.getReports(organizationID, type);
      return reports;
    } catch (error) {
      throw new Error('Error getting reports: ' + error.message);
    }
  };

  static getAllReports = async (organizationID) => {
    try {
      const reports = await ReportsM.getAllReports(organizationID);
      return reports;
    } catch (error) {
      throw new Error('Error getting all reports: ' + error.message);
    }
  };

  static buildBillReport = async (organizationID, processor, type, csvData) => {
    try {
      const arData = [];
      const keyMappings = {
        'Setup Fee ISO': { lineItemName: 'Merchant Setup', lineItemQuantity: 1 },
        'Monthly Gateway Fee ISO': { lineItemName: 'Merchant Monthly', lineItemQuantity: 1 },
      };
      const invoiceCount = await ReportsM.invoiceNum(organizationID);
      let invoiceNum = invoiceCount + 1;
      csvData.forEach(row => {
        Object.keys(row).forEach(key => {
          if (keyMappings[key]) {
            const { lineItemName, lineItemQuantity } = keyMappings[key];
            const lineItemAmount = parseFloat(row[key].replace('$', ''));
            const newARRow = new ARRow(
              row['Name'],
              row['Agent Id'],
              invoiceNum, // Pass necessary parameters
              row['Month'],
              lineItemName,
              lineItemQuantity,
              lineItemAmount.toFixed(2), // Ensure two decimal places
              lineItemAmount.toFixed(2)  // Ensure two decimal places
            );
            arData.push(newARRow);
            invoiceNum++;
          };
        });

        const transactionCount = parseFloat(row['Transaction Count']);
        const transactionFeeAmount = (transactionCount * 0.2).toFixed(2); // Ensure two decimal places
        const transactionFeeRow = new ARRow(
          row['Name'],
          row['Agent Id'],
          invoiceNum, // Pass necessary parameters
          row['Month'],
          'TracerPay Transaction Fee',
          transactionCount,
          0.2,
          transactionFeeAmount
        );
        arData.push(transactionFeeRow);
      });

      const arReport = new Report(
        organizationID,
        processor,
        'ar',
        csvData[0]['Month'], // Assuming all rows have the same month
        arData
      );
      //console.log("Created report object:", arReport);
      delete arReport.processor; // Remove the processor from the AR report
      return await ReportsM.createReport(arReport);
    } catch (error) {
      throw new Error('Error building Bill Report: ' + error.message);
    }
  };

  static updateBillReport = async (arReport, csvData) => {
    try {
      const invoiceCount = await ReportsM.invoiceNum(arReport.organizationID);
      let invoiceNum = invoiceCount + 1;
      csvData.forEach(row => {
        if (!row.MID) {
          return;
        }
          const newARRow = new ARRow(
            row.Merchant,
            row.MID,
            invoiceNum, // Pass necessary parameters
            arReport.month,
            'Paay Transaction Fee',
            row.Transactions,
            0.2, // Ensure two decimal places
            row.Transactions * 2  // Ensure two decimal places
          );
          arReport.reportData.push(newARRow);
        invoiceNum++;
      });
      return await ReportsM.updateReport(arReport.reportID, arReport);

    } catch (error) {
      throw new Error('Error updating Bill Report: ' + error.message);
    }
  };

  static createReport = async (organizationID, processor, fileBuffer, mimetype, arReport) => {
    try {
      let csvData;
      
      if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // console.log("Parsing XLSX file");
        csvData = await this.parseXLSX(fileBuffer); // Parse the XLSX data directly from the buffer
      } else if (mimetype === 'text/csv' || mimetype === 'application/csv') {
        // console.log("Parsing CSV file");
        csvData = await this.parseCSV(fileBuffer); // Parse the CSV data directly from the buffer
      } else {
        throw new Error('Unsupported file type: ' + mimetype);
      }

      let report;
      let type;
      let formattedMonthYear;
      let billReport;
      if (!csvData.length) {
        throw new Error('Parsed data is empty. Please check the input file.');
      }


      // Check if a report already exists for this organization, processor, type, and month/year
      const reportExists = await ReportsM.reportExists(organizationID, processor, type, formattedMonthYear);
      if (reportExists) {
        throw new Error(`A ${organizationID} ${type} for ${formattedMonthYear} already exists.`);
      }

      if (!csvData[0].Month && processor === 'PAAY') {
        // console.log("PAAY Report");
        type = 'billing';
        let rowIndex = 0;
        csvData.forEach(row => {
            const total = row.Total.result;
            csvData[rowIndex].Total = total;
          rowIndex++;
        });
        // console.log(csvData);
        billReport = await this.updateBillReport(arReport, csvData);
        report = new Report(
          organizationID,
          processor,
          type,
          arReport.month,
          csvData
        );
        //console.log("Created report object:", report);
      } else {
        // console.log("Accept.Blue Report");
        type = 'billing';
        formattedMonthYear = csvData[0].Month; // Assuming Month is already formatted in the CSV
        billReport = await this.buildBillReport(organizationID, processor, type, csvData);
        report = new Report(
          organizationID,
          processor,
          type,
          formattedMonthYear,
          csvData
        );
        //console.log("Created report object:", report);
      }
      console.log('sending report to model');
      const originalReport = await ReportsM.createReport(report);
      return [
        {
          processor,
          originalReport
        },
        {
          processor,
          billReport
        }];
    } catch (error) {
      throw new Error('Error creating report: ' + error.message);
    }
  };

  static parseCSV = (buffer) => {
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

  static parseXLSX = async (fileBuffer) => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer); // Load from the buffer directly

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

  static deleteReport = async (reportID) => {
    try {
      return await ReportsM.deleteReport(reportID);
    } catch (error) {
      throw new Error('Error deleting report: ' + error.message);
    }
  };
}