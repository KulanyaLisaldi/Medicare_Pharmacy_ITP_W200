import express from 'express';
import { 
    getDoctorRecommendations, 
    getSpecialties, 
    analyzeSymptoms 
} from '../controllers/doctorRecommendationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Analyze symptoms and recommend specialty
router.post('/analyze-symptoms', authenticateToken, analyzeSymptoms);

// Get doctor recommendations based on specialty
router.post('/recommendations', authenticateToken, getDoctorRecommendations);

// Get all available specialties
router.get('/specialties', authenticateToken, getSpecialties);

export default router;
