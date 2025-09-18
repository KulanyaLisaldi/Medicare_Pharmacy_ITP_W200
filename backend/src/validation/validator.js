import Ajv from "ajv"
import addFormats from "ajv-formats"

const ajv = new Ajv({ allErrors: true, removeAdditional: true })
addFormats(ajv)

export const validateRequest = (schema) => {
    const validate = ajv.compile(schema)
    return (req, res, next) => {
        const data = req.method === 'GET' ? req.query : req.body
        const valid = validate(data)
        if (!valid) {
            const message = validate.errors?.map(e => `${e.instancePath || e.schemaPath} ${e.message}`).join(', ')
            return res.status(400).json({ message: message || 'Invalid request payload' })
        }
        // Ajv may strip additional props; assign back
        if (req.method !== 'GET') req.body = data
        next()
    }
}

export default validateRequest

