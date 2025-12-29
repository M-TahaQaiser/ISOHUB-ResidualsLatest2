import Decimal from 'decimal.js';

export default class ARRow {
  constructor(name, agentID, invoiceNum, month, lineItemName, lineItemQuantity, lineItemAmount, lineItemPrice) {
    this.customerName = name;
    this.customerID = agentID;
    this.invoiceNum = `Invoice-${invoiceNum.toString().padStart(4, '0')}`;
    this.invoiceDate = month;
    this.dueDate = month;
    this.lineItemName = lineItemName;
    this.lineItemQuantity = new Decimal(lineItemQuantity || 0).toNumber(); // Store full precision
    this.lineItemAmount = this.adjustSpecificValue(lineItemAmount); // Adjust specific values without rounding
    this.lineItemPrice = this.adjustSpecificValue(new Decimal(lineItemPrice || 0).toNumber()); // Full precision
    this.approved = false;
  }

  // Adjust specific values without rounding
  adjustSpecificValue(value) {
    const decimalValue = new Decimal(value || 0);
    if (decimalValue.equals(15)) {
      return new Decimal(20).toNumber(); // Adjust to 20 if value equals 15
    }
    return decimalValue.toNumber(); // Return full precision for other values
  }

  // Update fields dynamically
  updateReport(data) {
    for (let key in data) {
      if (this.hasOwnProperty(key)) {
        this[key] = data[key];
      }
    }
    this.updatedAt = new Date();
  }
}
