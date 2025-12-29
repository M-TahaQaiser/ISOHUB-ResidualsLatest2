import Decimal from 'decimal.js';

export default class Type1Row {
    constructor(merchantId, merchantName, transaction, salesAmount, income, expenses, net, bps, bankSplit, branchID, needsAudit, splits = []) {
        this.needsAudit = needsAudit;
        this['Merchant Id'] = merchantId;
        this['Merchant Name'] = merchantName;
        this['Transaction'] = new Decimal(transaction || 0).toNumber(); // Store full precision
        this['Sales Amount'] = new Decimal(salesAmount || 0).toNumber(); // Store full precision
        this['Income'] = new Decimal(income || 0).toNumber(); // Store full precision
        this['Expenses'] = new Decimal(expenses || 0).toNumber(); // Store full precision
        this['Net'] = new Decimal(net || 0).toNumber(); // Store full precision
        this['BPS'] = bps;
        this['%'] = typeof bankSplit === 'string' ? bankSplit : this.convertToPercentage(bankSplit); // Convert to percentage string
        this['Agent Net'] = this.calculateBankPayout(net, bankSplit); // Full precision calculation
        this['Branch ID'] = branchID;
        this.splits = splits; // Add splits property
        this.approved = false;
    }

    // Convert value to percentage string without rounding
    convertToPercentage(value) {
        const percentage = new Decimal(value).mul(100); // Convert to percentage
        return `${percentage.toString()}%`; // Store percentage as full precision string
    }

    // Extract numeric value from percentage string
    extractNumericValueFromPercentage(percentageString) {
        return new Decimal(percentageString.replace('%', '')).div(100).toNumber(); // Convert back to decimal
    }

    // Calculate bank payout using full precision
    calculateBankPayout(net, bankSplit) {
        const netDecimal = new Decimal(net || 0); // Handle null or undefined `net`
        const bankSplitDecimal = typeof bankSplit === 'string'
            ? new Decimal(this.extractNumericValueFromPercentage(bankSplit))
            : new Decimal(bankSplit || 0); // Handle null or undefined `bankSplit`

        return netDecimal.mul(bankSplitDecimal).toDecimalPlaces(2).toNumber(); // Store full precision
    }

    // Update fields dynamically without rounding
    updateType1Row(data) {
        for (let key in data) {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        }

        // Recalculate dependent fields if necessary
        if (data['Net'] !== undefined || data['%'] !== undefined) {
            const bankSplit = typeof this['%'] === 'string'
                ? this.extractNumericValueFromPercentage(this['%'])
                : this['%'];
            this['Agent Net'] = this.calculateBankPayout(this['Net'], bankSplit);
        }
    }
}
