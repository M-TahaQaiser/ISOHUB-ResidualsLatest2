import express from 'express';
import { AIAssistantService } from '../services/AIAssistantService';

const router = express.Router();
const aiAssistant = new AIAssistantService();

// Simple auth middleware for development
const isAuthenticated = (req: any, res: any, next: any) => {
  req.user = { email: 'demo@example.com' };
  next();
};

// AI Chat endpoint
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string',
        response: "I need a message to respond to. Please ask me something about ISOHub!",
        confidence: 0,
        sources: [],
        category: 'error',
        type: 'error'
      });
    }

    const response = await aiAssistant.processMessage(message, context || {});
    
    res.json(response);
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      response: "I'm having trouble processing your request right now. Please try again or contact support@isohub.io for assistance.",
      confidence: 0,
      sources: [],
      category: 'error',
      type: 'error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'AI Assistant',
    timestamp: new Date().toISOString()
  });
});

export default router;