import User from '../models/User.js';

// Basic symptom/disease to specialization mapping (department style names)
const SYMPTOM_TO_SPECIALTY = {
    // Cardiology
    'chest pain': 'Cardiology',
    'heart': 'Cardiology',
    'blood pressure': 'Cardiology',
    'palpitation': 'Cardiology',
    'shortness of breath': 'Cardiology',
    'breathing': 'Cardiology',

    // Dermatology
    'skin': 'Dermatology',
    'rash': 'Dermatology',
    'acne': 'Dermatology',
    'itch': 'Dermatology',
    'itching': 'Dermatology',

    // Pediatrics
    'child': 'Pediatrics',
    'baby': 'Pediatrics',
    'infant': 'Pediatrics',
    'toddler': 'Pediatrics',
    'child fever': 'Pediatrics',
    'child cough': 'Pediatrics',

    // Neurology
    'seizure': 'Neurology',
    'headache': 'Neurology',
    'migraine': 'Neurology',
    'dizziness': 'Neurology',
    'numbness': 'Neurology',

    // Orthopedics
    'bone': 'Orthopedics',
    'fracture': 'Orthopedics',
    'joint': 'Orthopedics',
    'back pain': 'Orthopedics',

    // Gynecology
    'pregnancy': 'Gynecology',
    'menstrual': 'Gynecology',
    'period': 'Gynecology',

    // Psychiatry
    'depression': 'Psychiatry',
    'anxiety': 'Psychiatry',
    'stress': 'Psychiatry',

    // General Medicine
    'fever': 'General Medicine',
    'flu': 'General Medicine',
    'infection': 'General Medicine',

    // Ophthalmology
    'vision': 'Ophthalmology',
    'eye': 'Ophthalmology',
    'blurred vision': 'Ophthalmology',

    // ENT
    'ear': 'ENT',
    'sore throat': 'ENT',
    'throat': 'ENT',
    'sinus': 'ENT',

    // Urology
    'urine infection': 'Urology',
    'kidney pain': 'Urology',
};

function mapSymptomsToSpecialty(symptoms) {
    if (!symptoms) return null;
    const text = String(symptoms).toLowerCase();
    for (const [key, value] of Object.entries(SYMPTOM_TO_SPECIALTY)) {
        if (text.includes(key)) return value;
    }
    return null;
}

// Normalize common practitioner titles to department-style specializations stored in DB
const SPECIALTY_ALIASES = {
    'cardiologist': 'Cardiology',
    'neurologist': 'Neurology',
    'dermatologist': 'Dermatology',
    'pediatrician': 'Pediatrics',
    'gynecologist': 'Gynecology',
    'psychiatrist': 'Psychiatry',
    'endocrinologist': 'Endocrinology',
    'general practitioner': 'General Medicine',
    'ophthalmologist': 'Ophthalmology',
    'ent specialist': 'ENT',
    'ent': 'ENT',
    'orthopedist': 'Orthopedics',
    'pulmonologist': 'Pulmonology',
    'gastroenterologist': 'Gastroenterology',
    'dentist': 'Dentistry',
    'urologist': 'Urology'
};

function normalizeSpecialty(input) {
    if (!input) return '';
    const key = String(input).toLowerCase().trim();
    return SPECIALTY_ALIASES[key] || input;
}

// Get doctor recommendations based on symptoms
export const getDoctorRecommendations = async (req, res) => {
    try {
        const { symptoms, specialty } = req.body;
        
        // Determine target specialization
        let targetSpecialty = specialty && String(specialty).trim() !== ''
            ? normalizeSpecialty(specialty)
            : mapSymptomsToSpecialty(symptoms) || 'General Medicine';

        // Build query based on specialization (department style or practitioner form)
        let query = { role: 'doctor', specialization: { $regex: targetSpecialty, $options: 'i' } };
        
        // Get available doctors
        const doctors = await User.find(query)
            .select('firstName lastName specialization email phone')
            .limit(10);
        
        if (doctors.length === 0) {
            const specializationName = targetSpecialty;
            return res.status(404).json({
                success: false,
                message: `Sorry, we currently do not have a ${specializationName} doctor available at our clinic.`,
                data: { specialization: specializationName }
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Doctor recommendations retrieved successfully',
            data: {
                specialty: targetSpecialty,
                symptoms,
                doctors: doctors.map(doctor => ({
                    id: doctor._id,
                    name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
                    specialization: doctor.specialization,
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
        
        // Symptom-to-specialty mapping (department style to match stored doctor specializations)
        const symptomMapping = {
            // Neurology
            'headache': 'Neurology',
            'migraine': 'Neurology',
            'seizure': 'Neurology',
            'dizziness': 'Neurology',
            'memory': 'Neurology',
            'confusion': 'Neurology',
            'numbness': 'Neurology',
            'tingling': 'Neurology',

            // Cardiology
            'chest pain': 'Cardiology',
            'heart': 'Cardiology',
            'blood pressure': 'Cardiology',
            'palpitation': 'Cardiology',
            'shortness of breath': 'Cardiology',

            // Pulmonology
            'cough': 'Pulmonology',
            'asthma': 'Pulmonology',
            'lung': 'Pulmonology',
            'wheezing': 'Pulmonology',
            'chest tightness': 'Pulmonology',

            // Dermatology
            'skin': 'Dermatology',
            'rash': 'Dermatology',
            'acne': 'Dermatology',
            'mole': 'Dermatology',
            'itching': 'Dermatology',
            'dry skin': 'Dermatology',

            // Pediatrics
            'child': 'Pediatrics',
            'baby': 'Pediatrics',
            'infant': 'Pediatrics',
            'toddler': 'Pediatrics',

            // Gynecology
            'pregnancy': 'Gynecology',
            'menstrual': 'Gynecology',
            'period': 'Gynecology',
            'fertility': 'Gynecology',

            // Gastroenterology
            'stomach': 'Gastroenterology',
            'digestion': 'Gastroenterology',
            'nausea': 'Gastroenterology',
            'vomiting': 'Gastroenterology',
            'diarrhea': 'Gastroenterology',
            'constipation': 'Gastroenterology',
            'abdominal pain': 'Gastroenterology',

            // Dentistry
            'tooth': 'Dentistry',
            'dental': 'Dentistry',
            'gum': 'Dentistry',
            'jaw': 'Dentistry',
            'mouth': 'Dentistry',
            'oral': 'Dentistry',

            // Ophthalmology
            'eye': 'Ophthalmology',
            'vision': 'Ophthalmology',
            'blurred': 'Ophthalmology',
            'glaucoma': 'Ophthalmology',

            // ENT
            'ear': 'ENT',
            'nose': 'ENT',
            'throat': 'ENT',
            'hearing': 'ENT',
            'sinus': 'ENT',

            // Psychiatry
            'anxiety': 'Psychiatry',
            'depression': 'Psychiatry',
            'stress': 'Psychiatry',
            'mental': 'Psychiatry',

            // Orthopedics
            'bone': 'Orthopedics',
            'joint': 'Orthopedics',
            'back': 'Orthopedics',
            'spine': 'Orthopedics',
            'fracture': 'Orthopedics',

            // Urology
            'urine infection': 'Urology',
            'kidney pain': 'Urology',

            // General Medicine
            'fever': 'General Medicine',
            'flu': 'General Medicine',
            'infection': 'General Medicine'
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
                    specialty: 'General Medicine',
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
                reason: `Based on your symptoms, we recommend consulting ${recommendedSpecialty}`
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
