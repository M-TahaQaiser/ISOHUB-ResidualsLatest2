
export default class TrxRow {
    constructor(merchantId,	merchantDBA, payoutAmount, volume, sales, refunds, rejectAmount, branchID) {
        this,merchantId = merchantId;
        this.merchantDBA = merchantDBA;
        this.payoutAmount = payoutAmount;
        this.volume = volume;
        this.sales = sales;
        this.refunds = refunds;
        this.rejectAmount = rejectAmount;
        this.bankSplit = 0.0035;
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