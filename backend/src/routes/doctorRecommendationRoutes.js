import express from 'express';
import { 
    getDoctorRecommendations, 
    getSpecialties, 
    analyzeSymptoms 
} from '../controllers/doctorRecommendationController.js';

const router = express.Router();

// Analyze symptoms and recommend specialty (public)
router.post('/analyze-symptoms', analyzeSymptoms);

// Get doctor recommendations based on specialty (public)
router.post('/recommendations', getDoctorRecommendations);

// Get all available specialties (public)
router.get('/specialties', getSpecialties);

export default router;
