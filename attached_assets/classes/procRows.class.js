export default class ProcRow {
    constructor(merchantId, merchantName, transaction, salesAmount, income, expenses, net, bps, branchID) {
        this.merchantId = merchantId;
        this.merchantName = merchantName;
        this.transaction = transaction;
        this.salesAmount = salesAmount;
        this.income = income;
        this.expenses = expenses;
        this.net = net;
        this.bps = bps;
        this.percentage = 0.0035;
        this.agentNet = (this.net * this.percentage).toFixed(2);
        this.branchID = branchID;
    }

    updateProcRows(data) {
        for (let key in data) {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            };
        };
    };
};