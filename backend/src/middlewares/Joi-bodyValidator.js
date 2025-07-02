import Joi from 'joi'; // Import Joi as a default import

// Define the validation schema
const schema = Joi.object({
  name: Joi.string().min(2).max(20).optional(),
  dob: Joi.string().optional(),
  bio: Joi.string().max(50). min(0).optional(),
  email: Joi.string().email().optional(), // Email is optional but must be valid if provided
  otp: Joi.string()
    .length(4) 
    .pattern(/^\d{4}$/) 
    .optional() 
}).unknown(true); 

// Middleware function for validation
const validateBody = (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false }); // Don't stop at the first error

  if (error) {
    console.log("Validation error: ", error.details);
    
    return res.status(400).json({
      status: false,
      message: error.details.map(err => err.message) 
    });
  }

  next(); 
};

export default validateBody;
