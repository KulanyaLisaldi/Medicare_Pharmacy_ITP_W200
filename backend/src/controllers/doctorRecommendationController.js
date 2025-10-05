import User from '../models/User.js';

// Get doctor recommendations based on symptoms
export const getDoctorRecommendations = async (req, res) => {
    try {
        const { symptoms, specialty } = req.body;
        
        // Build query based on specialty
        let query = { role: 'doctor' };
        if (specialty) {
            query.specialization = { $regex: specialty, $options: 'i' };
        }
        
        // Get available doctors
        const doctors = await User.find(query)
            .select('firstName lastName specialization email phone')
            .limit(10);
        
        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No doctors found for the specified specialty'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Doctor recommendations retrieved successfully',
            data: {
                specialty,
                symptoms,
                doctors: doctors.map(doctor => ({
                    id: doctor._id,
                    name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
                    specialization: doctor.specialization,
                    email: doctor.email,
                    phone: doctor.phone
                }))
            }
        });
        
    } catch (error) {
        console.error('Error getting doctor recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all available specialties
export const getSpecialties = async (req, res) => {
    try {
        const specialties = await User.distinct('specialization', { role: 'doctor' });
        
        res.status(200).json({
            success: true,
            message: 'Specialties retrieved successfully',
            data: specialties.filter(spec => spec && spec.trim() !== '')
        });
        
    } catch (error) {
        console.error('Error getting specialties:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Analyze symptoms and recommend specialty
export const analyzeSymptoms = async (req, res) => {
    try {
        const { symptoms } = req.body;
        
        if (!symptoms || symptoms.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Symptoms are required'
            });
        }
        
        const symptomText = symptoms.toLowerCase();
        
        // Comprehensive symptom-to-specialty mapping
        const symptomMapping = {
            // Neurological symptoms
            'headache': 'Neurologist',
            'migraine': 'Neurologist',
            'seizure': 'Neurologist',
            'dizziness': 'Neurologist',
            'memory': 'Neurologist',
            'confusion': 'Neurologist',
            'numbness': 'Neurologist',
            'tingling': 'Neurologist',
            'neurological': 'Neurologist',
            
            // Cardiovascular symptoms
            'chest pain': 'Cardiologist',
            'heart': 'Cardiologist',
            'blood pressure': 'Cardiologist',
            'breathing': 'Cardiologist',
            'palpitation': 'Cardiologist',
            'shortness of breath': 'Cardiologist',
            'cardiac': 'Cardiologist',
            
            // Respiratory symptoms
            'cough': 'Pulmonologist',
            'asthma': 'Pulmonologist',
            'lung': 'Pulmonologist',
            'wheezing': 'Pulmonologist',
            'chest tightness': 'Pulmonologist',
            'respiratory': 'Pulmonologist',
            
            // Dermatological symptoms
            'skin': 'Dermatologist',
            'rash': 'Dermatologist',
            'acne': 'Dermatologist',
            'mole': 'Dermatologist',
            'itching': 'Dermatologist',
            'dry skin': 'Dermatologist',
            'dermatological': 'Dermatologist',
            
            // Pediatric symptoms
            'child': 'Pediatrician',
            'baby': 'Pediatrician',
            'infant': 'Pediatrician',
            'toddler': 'Pediatrician',
            'pediatric': 'Pediatrician',
            
            // Gynecological symptoms
            'pregnancy': 'Gynecologist',
            'menstrual': 'Gynecologist',
            'period': 'Gynecologist',
            'fertility': 'Gynecologist',
            'gynecological': 'Gynecologist',
            
            // Gastrointestinal symptoms
            'stomach': 'Gastroenterologist',
            'digestion': 'Gastroenterologist',
            'nausea': 'Gastroenterologist',
            'vomiting': 'Gastroenterologist',
            'diarrhea': 'Gastroenterologist',
            'constipation': 'Gastroenterologist',
            'abdominal pain': 'Gastroenterologist',
            'gastrointestinal': 'Gastroenterologist',
            
            // Dental symptoms
            'tooth': 'Dentist',
            'dental': 'Dentist',
            'gum': 'Dentist',
            'jaw': 'Dentist',
            'mouth': 'Dentist',
            'oral': 'Dentist',
            
            // Eye symptoms
            'eye': 'Ophthalmologist',
            'vision': 'Ophthalmologist',
            'blurred': 'Ophthalmologist',
            'glaucoma': 'Ophthalmologist',
            'ophthalmic': 'Ophthalmologist',
            
            // ENT symptoms
            'ear': 'ENT Specialist',
            'nose': 'ENT Specialist',
            'throat': 'ENT Specialist',
            'hearing': 'ENT Specialist',
            'sinus': 'ENT Specialist',
            'otolaryngology': 'ENT Specialist',
            
            // Mental health
            'anxiety': 'Psychiatrist',
            'depression': 'Psychiatrist',
            'stress': 'Psychiatrist',
            'mental': 'Psychiatrist',
            'psychiatric': 'Psychiatrist',
            
            // Orthopedic symptoms
            'bone': 'Orthopedist',
            'joint': 'Orthopedist',
            'back': 'Orthopedist',
            'spine': 'Orthopedist',
            'fracture': 'Orthopedist',
            'orthopedic': 'Orthopedist'
        };
        
        // Find matching specialty
        let recommendedSpecialty = null;
        for (const [symptom, specialty] of Object.entries(symptomMapping)) {
            if (symptomText.includes(symptom)) {
                recommendedSpecialty = specialty;
                break;
            }
        }
        
        if (!recommendedSpecialty) {
            return res.status(200).json({
                success: true,
                message: 'No specific specialty identified',
                data: {
                    specialty: 'General Practitioner',
                    confidence: 'low',
                    reason: 'Symptoms do not clearly indicate a specific specialty'
                }
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Specialty recommendation generated',
            data: {
                specialty: recommendedSpecialty,
                confidence: 'high',
                reason: `Based on your symptoms, you may need to consult a ${recommendedSpecialty}`
            }
        });
        
    } catch (error) {
        console.error('Error analyzing symptoms:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
