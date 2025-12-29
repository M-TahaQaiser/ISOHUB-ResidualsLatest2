import express from 'express';
import { handleWebhook } from '../controllers/webhooks.controller.js';

const router = express.Router();

// Generic webhook endpoint that handles all CRM events
router.post('/', handleWebhook);

export default router; 