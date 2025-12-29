import { Router } from 'express';
import InvoicesController from '../controllers/invoices.controller.js'

const invoicesRoute = Router();

invoicesRoute.use((req, res, next) => {
    console.log(`Request received for path: ${req.path}`);
    next();
  });

invoicesRoute.get('/organizations/:organizationID', InvoicesController.getInvoiceNum);
invoicesRoute.put('/organizations/:organizationID', InvoicesController.updateInvoiceNum);

export default invoicesRoute;