import Report from '../classes/report.class.js';
import ARRow from '../classes/arRow.class.js';

export default class ArReportUtil {
  static buildBillingReport = async (organizationID, processor, monthYear, csvData) => {
    try {
      const type = 'billing';
      let report;
      if (processor === 'PAAY') {
        // Filter out rows without a MID
        // console.log('Filtering out rows without a MID');
        const filteredData = csvData.filter(row => row['MID']);
        // console.log('Filtered row count:', filteredData.length);
        filteredData.forEach(row => {
          delete row[''];
          row.Total = Number(row.Total);
          // console.log('row:', row);
        });
        report = new Report(
          organizationID,
          processor,
          type,
          monthYear,
          filteredData
        );
      } else {
        report = new Report(
          organizationID,
          processor,
          type,
          monthYear,
          csvData
        );
      }
      return report;
    } catch (error) {
      throw new Error('Error building billing report: ' + error.message);

    }
  };

  static buildARReport = async (organizationID, processor, monthYear, invoiceCount, csvData) => {
    try {
      let arData;
      const type = 'ar';
      if (processor === 'accept.blue') {
        const result = await abBuildARData(invoiceCount, csvData, monthYear);
        arData = result.arData;
        invoiceCount = result.invoiceCount;
      } else {
        const result = await paayBuildARData(invoiceCount, monthYear, csvData);
        arData = result.arData;
        invoiceCount = result.invoiceCount;
      };

      const arReport = new Report(organizationID, '', type, monthYear, arData);
      arReport.processors.push(processor);
      return { arReport, invoiceCount };
    } catch (error) {
      throw new Error('Error building AR Report: ' + error.message);
    }
  };

  static updateARReport = async (processor, invoiceCount, arReport, csvData) => {
    try {

      // Create a map of customerIDs to their invoice numbers
      const customerIDToInvoiceMap = new Map();
      const invoiceToRowsMap = new Map();

      arReport.reportData.forEach((row, index) => {
        if (row.customerID) {
          customerIDToInvoiceMap.set(row.customerID, row.invoiceNum);
          if (!invoiceToRowsMap.has(row.invoiceNum)) {
            invoiceToRowsMap.set(row.invoiceNum, []);
          }
          invoiceToRowsMap.get(row.invoiceNum).push(row); // Group rows by invoice number
        }
      });
      let data = [];
      if (processor === 'accept.blue') {
        const result = await abBuildARData(invoiceCount, csvData, arReport.month);
        data = result.arData;
        invoiceCount = result.invoiceCount;
      } else if (processor === 'PAAY') {
        data = await paayBuildARData(invoiceCount, arReport.month, csvData);
        invoiceCount = data.invoiceCount;
      } else {
        throw new Error(`Unknown processor: ${processor}`);
      }

      data.forEach(row => {
        const customerID = row.customerID; // Use the customerID field from ARRow
        if (!customerID) {
          console.error(`Row is missing customerID:`, row);
          return; // Skip rows without a valid customerID
        }

        if (customerIDToInvoiceMap.has(customerID)) {
          const existingInvoiceNum = customerIDToInvoiceMap.get(customerID);
          row.invoiceNum = existingInvoiceNum; // Use the existing invoiceNum
          invoiceToRowsMap.get(existingInvoiceNum).push(row);
        } else {
          // Assign a new invoiceNum for unmatched customerIDs
          const newInvoiceNum = `Invoice-${invoiceCount.toString().padStart(4, '0')}`;
          row.invoiceNum = newInvoiceNum;
          if (!invoiceToRowsMap.has(newInvoiceNum)) {
            invoiceToRowsMap.set(newInvoiceNum, []);
          }
          invoiceToRowsMap.get(newInvoiceNum).push(row);
          customerIDToInvoiceMap.set(customerID, newInvoiceNum);
          invoiceCount++;
        }
      });

      arReport.reportData = Array.from(invoiceToRowsMap.values()).flat();

      if (!arReport.processors.includes(processor)) {
        arReport.processors.push(processor);
      }

      return {arReport, invoiceCount};
    } catch (error) {
      throw new Error('Error updating AR Report: ' + error.message);
    }
  };



};

const abBuildARData = async (invoiceCount, csvData, monthYear) => {
  try {
    const arData = [];
    const keyMappings = {
      'Setup Fee ISO': { lineItemName: 'Merchant Setup', lineItemQuantity: 1 },
      'Monthly Gateway Fee ISO': { lineItemName: 'Merchant Monthly', lineItemQuantity: 1 },
    };

    const dueDate = addOneMonth(monthYear);
    // console.log('dueDate:', dueDate);

    csvData.forEach(row => {
      if (!row.Month) {
        return;
      }
      Object.keys(row).forEach(key => {
        if (keyMappings[key]) {
          // console.log('key:', row[key]);
          if (row[key] === '$0.00') {
            return; // Skip zero amounts
          }
          const { lineItemName, lineItemQuantity } = keyMappings[key];
          const lineItemAmount = parseFloat(row[key].replace('$', ''));
          const newARRow = new ARRow(
            row['Name'],
            row['Agent Id'],
            invoiceCount, // Pass necessary parameters
            dueDate,
            lineItemName,
            lineItemQuantity,
            lineItemAmount, // Ensure two decimal places
            lineItemAmount  // Ensure two decimal places
          );
          arData.push(newARRow);
        };
      });
      const transactionCount = parseFloat(row['Transaction Count']);
      const transactionFeeAmount = (transactionCount * 0.2); // Ensure two decimal places
      const transactionFeeRow = new ARRow(
        row['Name'],
        row['Agent Id'],
        invoiceCount, // Pass necessary parameters
        dueDate,
        'TracerPay Transaction Fee',
        transactionCount,
        0.2,
        transactionFeeAmount
      );
      invoiceCount++;
      arData.push(transactionFeeRow);
    });
    return {arData, invoiceCount};
  } catch (error) {
    throw new Error('Error handling Accept.Blue data: ' + error.message);
  }
};

const paayBuildARData = async (invoiceCount, monthYear, csvData) => {
  try {
    const arData = [];

    const dueDate = addOneMonth(monthYear);
    console.log('dueDate:', dueDate);
    csvData.forEach(row => {
      if (!row.MID) {
        return;
      }
      const lineItemPrice = parseFloat(row.Transactions * 0.2); // Ensure two decimal places
      const newARRow = new ARRow(
        row.Merchant,
        row.MID,
        invoiceCount, // Pass necessary parameters
        dueDate,
        'Paay Transaction Fee',
        row.Transactions,
        0.2, // Ensure two decimal places
        row.Transactions * 0.2  // Ensure two decimal places
      );
      arData.push(newARRow);
      invoiceCount++;
    });
    return {arData, invoiceCount};
  } catch (error) {
    throw new Error('Error handling PAAY data: ' + error.message);
  }
}

const addOneMonth = (monthYear) => {
  // Parse the string into a Date object
  const date = new Date(`${monthYear} 01`); // Adding "01" to ensure a valid date

  // Add one month
  date.setMonth(date.getMonth() + 1);

  // Format back to "Month Year"
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};
