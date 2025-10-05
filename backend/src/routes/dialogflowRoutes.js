import express from 'express';
import { processMessage } from '../controllers/dialogflowController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Process message with Dialogflow (optional authentication)
router.post('/message', (req, res, next) => {
  // Try to authenticate, but don't fail if no token
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  } else {
    // No token provided, continue without authentication
    req.userId = null;
    next();
  }
}, processMessage);

export default router;
