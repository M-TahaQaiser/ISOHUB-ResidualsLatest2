import React, { useMemo } from 'react';
import './totals.component.css';

const Totals = ({ reportData, tableHeaders }) => {
    // Define the fields that should NOT be totaled
    const nonTotalFields = ['Merchant Id', 'Merchant Name', 'branchID', 'Agent Id', '%', 'MID', 'Merchant', 'customerName', 'customerID', 'invoiceNum', 'invoiceDate', 'dueDate', 'lineItemName', 'Client', 'Merchant DBA', "Bank Split", 'Branch ID']; // Adjust the column names to match exactly

    // Calculate totals for numeric fields only, excluding non-total fields
    const totals = useMemo(() => {
        const totalsObj = {};
        // Loop through each table header
        tableHeaders.forEach(header => {
            if (!nonTotalFields.includes(header)) { // Exclude non-total fields
                const total = reportData.reduce((sum, row) => {
                    const value = parseFloat(row[header]);
                    return sum + (isNaN(value) ? 0 : value); // Ensure the value is numeric
                }, 0);

                if (!isNaN(total)) { // Only include fields that have a valid total
                    totalsObj[header] = total;
                }
            }
        });

        return totalsObj;
    }, [reportData, tableHeaders]);

    return (
        <div className="totals-container">
            {Object.keys(totals).map((field, index) => (
                <div key={index} className="total-field">
                    <span className="total-label">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="total-value">{totals[field].toFixed(2)}</span>
                </div>
            ))}
        </div>
    );
};

export default Totals;
