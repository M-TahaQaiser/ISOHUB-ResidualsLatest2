import Decimal from 'decimal.js';

export default class Type3Row {
    constructor(merchantId, merchantDBA, payoutAmount, volume, sales, bankSplit, branchID, needsAudit, splits = []) {
        this.needsAudit = needsAudit;
        this['Merchant Id'] = merchantId;
        this['Merchant DBA'] = merchantDBA;
        this['Payout Amount'] = new Decimal(payoutAmount || 0).toNumber(); // Store full precision
        this['Volume'] = new Decimal(volume || 0).toNumber(); // Store full precision
        this['Sales'] = new Decimal(sales || 0).toNumber(); // Store full precision
        this['Refunds'] = ''; // Not being used, set as empty
        this['Reject Amount'] = ''; // Not being used, set as empty
        this['Bank Split'] = typeof bankSplit === 'string' ? bankSplit : this.convertToPercentage(bankSplit); // Convert to percentage string
        this['Bank Payout'] = this.calculateBankPayout(payoutAmount, bankSplit); // Full precision calculation
        this['Branch ID'] = branchID;
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
        return isNaN(numericValue) ? 0 : new Decimal(numericValue).div(100).toNumber(); // Convert back to decimal format
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
    updateType3Row(data) {
        for (let key in data) {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        }

        // Recalculate Bank Payout if payoutAmount or bankSplit is updated
        const bankSplitValue = typeof this['Bank Split'] === 'string'
            ? this.extractNumericValueFromPercentage(this['Bank Split'])
            : this['Bank Split'];

        this['Bank Payout'] = this.calculateBankPayout(this['Payout Amount'], bankSplitValue);
    }
}
