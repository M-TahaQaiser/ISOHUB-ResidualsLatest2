export default class Shyft4Rows {
    constructor(merchanId, merchantName, payoutAmount, volume, sales, refunds, rejectAmount, branchID) {
        this.merchanId = merchanId;
        this.merchantName = merchantName;
        this.payoutAmount = payoutAmount;
        this.volume = volume;
        this.sales = sales;
        this.refunds = refunds;
        this.rejectAmount = rejectAmount;
        this.bankSplit = 0.0035;
        // Ensure payoutAmount is a number before calculation
        this.bankPayout = this.calculateBankPayout();
        this.branchID = branchID;

    }

    calculateBankPayout() {
        // If payoutAmount is not a number or is undefined, return 0 to avoid NaN
        return typeof this.payoutAmount === 'number' ? this.payoutAmount * this.bankSplit : 0;
    }

    updateShyft4Rows(data) {
        for (let key in data) {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        }
        // Recalculate bankPayout if payoutAmount is updated
        this.bankPayout = this.calculateBankPayout();
    }
}
