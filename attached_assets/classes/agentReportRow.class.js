import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';

export default class AgentReportRow {
    constructor(merchantID, merchantName, transactions, salesAmount, income, expenses, net, bps, agentSplit, agentNet, row) {
        this['Merchant Id'] = merchantID;
        this['Merchant Name'] = merchantName;
        this['Transactions'] = new Decimal(transactions || 0).toNumber(); // Store full precision
        this['Sales Amount'] = new Decimal(salesAmount || 0).toNumber(); // Full precision
        this['Income'] = new Decimal(income || 0).toNumber(); // Full precision
        this['Expenses'] = new Decimal(expenses || 0).toNumber(); // Full precision
        this['Net'] = new Decimal(net || 0).toNumber(); // Full precision
        this['Bps'] = bps;
        this['%'] = typeof agentSplit === 'string' ? agentSplit : this.convertToPercentage(agentSplit); // Convert to percentage string
        this['Agent Net'] = this.calculateAgentNet(net, agentSplit); // Full precision calculation
        this['Branch Id'] = row?.['Branch ID'] || 'N/A';
    }

    // Convert a value to a percentage string (without rounding)
    convertToPercentage(value) {
        const percentage = new Decimal(value).mul(100); // Convert to percentage
        return `${percentage.toString()}%`; // Store as a full-precision string
    }

    // Extract numeric value from percentage string
    extractNumericValueFromPercentage(percentageString) {
        const numericValue = parseFloat(percentageString.replace('%', ''));
        return isNaN(numericValue) ? 0 : new Decimal(numericValue).div(100).toNumber(); // Convert back to decimal format
    }

    // Calculate agent net payout with full precision
    calculateAgentNet(net, agentSplit) {
        const netDecimal = new Decimal(net || 0); // Handle null or undefined `net`
        const agentSplitDecimal = typeof agentSplit === 'string'
            ? new Decimal(this.extractNumericValueFromPercentage(agentSplit))
            : new Decimal(agentSplit || 0); // Handle null or undefined `agentSplit`

        return netDecimal.mul(agentSplitDecimal).toNumber(); // Store full precision
    }

    // Update row data dynamically without rounding
    updateAgentReportRow(data) {
        for (let key in data) {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        }

        // Recalculate Agent Net if relevant fields are updated
        const agentSplitValue = typeof this['%'] === 'string'
            ? this.extractNumericValueFromPercentage(this['%'])
            : this['%'];

        this['Agent Net'] = this.calculateAgentNet(this['Net'], agentSplitValue);
        this.updatedAt = new Date();
    }
}
