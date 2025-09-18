export const registerSchema = {
    type: 'object',
    required: ['firstName', 'lastName', 'email', 'password', 'address', 'phone'],
    additionalProperties: false,
    properties: {
        firstName: { type: 'string', minLength: 1, pattern: '^[A-Za-z ]+$' },
        lastName: { type: 'string', minLength: 1, pattern: '^[A-Za-z ]+$' },
        email: { type: 'string', format: 'email' },
        // At least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special @#$%!
        password: { type: 'string', minLength: 8, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%!]).{8,}$' },
        address: { type: 'string', minLength: 1 },
        // Sri Lanka mobile e.g. 07XXXXXXXX (10 digits)
        phone: { type: 'string', pattern: '^07\\d{8}$' }
    }
}

export const loginSchema = {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 }
    }
}

export const requestResetSchema = {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: {
        email: { type: 'string', format: 'email' }
    }
}

export const resetPasswordSchema = {
    type: 'object',
    required: ['token','password'],
    additionalProperties: false,
    properties: {
        token: { type: 'string', minLength: 10 },
        password: { type: 'string', minLength: 6 }
    }
}

export const changePasswordSchema = {
    type: 'object',
    required: ['currentPassword','newPassword'],
    additionalProperties: false,
    properties: {
        currentPassword: { type: 'string', minLength: 6 },
        newPassword: { type: 'string', minLength: 6 }
    }
}

export const createStaffSchema = {
    type: 'object',
    required: ['firstName','lastName','email','password','address','phone','role'],
    additionalProperties: false,
    properties: {
        firstName: { type: 'string', minLength: 1, pattern: '^[A-Za-z ]+$' },
        lastName: { type: 'string', minLength: 1, pattern: '^[A-Za-z ]+$' },
        email: { type: 'string', format: 'email' },
        // At least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special @#$%!
        password: { type: 'string', minLength: 8, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%!]).{8,}$' },
        address: { type: 'string', minLength: 1 },
        // Sri Lanka mobile e.g. 07XXXXXXXX (10 digits)
        phone: { type: 'string', pattern: '^07\\d{8}$' },
        role: { type: 'string', enum: ['doctor','pharmacist','delivery_agent'] },
        specialization: { type: 'string' },
        licenseNumber: { type: 'string' },
        experience: { type: 'number' },
        vehicleNumber: { type: 'string' },
        practicingGovernmentHospital: { type: 'string' },
        achievements: { type: 'string' },
        membership: { type: 'string' },
        registrationNumber: { type: 'string' },
        otherSpecialization: { type: 'string' },
        experienceYears: { type: 'number' },
        specialNote: { type: 'string' }
    }
}

export const updateProfileSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        address: { type: 'string' },
        phone: { type: 'string' },
        specialization: { type: 'string' },
        licenseNumber: { type: 'string' },
        experience: { type: 'number' },
        vehicleNumber: { type: 'string' }
    }
}

export const adminUpdateUserSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        address: { type: 'string' },
        phone: { type: 'string' },
        role: { type: 'string', enum: ['customer','doctor','pharmacist','delivery_agent','admin'] },
        isActive: { type: 'boolean' },
        specialization: { type: 'string' },
        licenseNumber: { type: 'string' },
        experience: { type: 'number' },
        vehicleNumber: { type: 'string' }
    }
}


