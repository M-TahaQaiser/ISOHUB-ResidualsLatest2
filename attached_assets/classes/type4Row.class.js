import Decimal from 'decimal.js';

export default class Type4Row {
    constructor(merchantId, merchantName, net, bankSplit, BranchID, needsAudit, splits = []) {
        this.needsAudit = needsAudit;
        this['Merchant Id'] = merchantId;
        this['Merchant Name'] = merchantName;
        this['Income'] = ''; // Not being used
        this['Expense'] = ''; // Not being used
        this['Net'] = new Decimal(net).neg().toNumber(); // Store full precision, negated
        this['%'] = typeof bankSplit === 'string' ? bankSplit : this.convertToPercentage(bankSplit); // Convert to percentage string
        this['Bank Payout'] = new Decimal(this.calculateBankPayout(net, bankSplit)).neg().toNumber(); // Store full precision, negated
        this['Branch ID'] = BranchID;
        this.splits = splits; // Add splits property
        this.approved = false;
    }

    // Convert value to percentage string without rounding
    convertToPercentage(value) {
        const percentage = new Decimal(value).mul(100); // Convert to percentage
        return `${percentage.toString()}%`; // Store as full precision string
    }

    // Extract numeric value from percentage string
    extractNumericValueFromPercentage(percentageString) {
        const numericValue = parseFloat(percentageString.replace('%', ''));
        return isNaN(numericValue) ? 0 : new Decimal(numericValue).div(100).toNumber(); // Convert back to decimal
    }

    // Calculate bank payout using full precision
    calculateBankPayout(net, bankSplit) {
        const netDecimal = new Decimal(net || 0); // Handle null or undefined `net`
        const bankSplitDecimal = typeof bankSplit === 'string'
            ? new Decimal(this.extractNumericValueFromPercentage(bankSplit))
            : new Decimal(bankSplit || 0); // Handle null or undefined `bankSplit`

        return netDecimal.mul(bankSplitDecimal).toNumber(); // Store full precision
    }

    // Update fields dynamically without rounding
    updateType4Row(data) {
        for (let key in data) {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        }

        // Recalculate Bank Payout with full precision if `Net` or `%` is updated
        const bankSplit = typeof this['%'] === 'string'
            ? this.extractNumericValueFromPercentage(this['%'])
            : this['%'];

        this['Bank Payout'] = new Decimal(this.calculateBankPayout(this['Net'], bankSplit)).neg().toNumber();
    }
}
