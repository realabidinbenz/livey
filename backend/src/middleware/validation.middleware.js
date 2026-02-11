/**
 * Validation Middleware
 * Reusable validation functions for common fields
 */

/**
 * Validate Algerian phone number
 * Format: 05|06|07 + 8 digits (10 total)
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^(05|06|07)\d{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Middleware: Validate required fields exist in request body
 * Usage: validateRequiredFields(['name', 'email', 'password'])
 */
export const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missing = [];

    for (const field of fields) {
      if (!req.body[field] || String(req.body[field]).trim() === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: {
          message: `Missing required fields: ${missing.join(', ')}`,
          status: 400,
          missingFields: missing
        }
      });
    }

    next();
  };
};

/**
 * Middleware: Validate phone number in request body
 */
export const validatePhoneMiddleware = (req, res, next) => {
  const { customer_phone } = req.body;

  if (!customer_phone) {
    return res.status(400).json({
      error: { message: 'Phone number is required', status: 400 }
    });
  }

  if (!validatePhone(customer_phone)) {
    return res.status(400).json({
      error: {
        message: 'Invalid phone number. Must be 10 digits starting with 05, 06, or 07',
        status: 400
      }
    });
  }

  next();
};

/**
 * Middleware: Validate email in request body
 */
export const validateEmailMiddleware = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: { message: 'Email is required', status: 400 }
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      error: { message: 'Invalid email format', status: 400 }
    });
  }

  next();
};
