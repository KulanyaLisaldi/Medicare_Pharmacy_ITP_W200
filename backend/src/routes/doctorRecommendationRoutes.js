import express from 'express';
import { 
    getDoctorRecommendations, 
    getSpecialties
} from '../controllers/doctorRecommendationController.js';

const router = express.Router();

// analyze-symptoms endpoint removed

// Get doctor recommendations based on specialty (public)
router.post('/recommendations', getDoctorRecommendations);

// Get all available specialties (public)
router.get('/specialties', getSpecialties);

export default router;
