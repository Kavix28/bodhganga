/**
 * Email validation
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Email validation (alias for Register component)
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
    return isValidEmail(email);
};

/**
 * Phone validation (supports various formats)
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
    // Remove spaces, dashes, and parentheses
    const cleanedPhone = phone.replace(/[\s\-()]/g, '');
    // Check if it's 10-15 digits, optionally starting with +
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(cleanedPhone);
};

/**
 * Phone validation (alias for Register component)
 * @param {string} phone
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
    return isValidPhone(phone);
};

/**
 * Email or Phone validation
 * @param {string} value
 * @returns {boolean}
 */
export const isValidEmailOrPhone = (value) => {
    return isValidEmail(value) || isValidPhone(value);
};

/**
 * Password validation
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * @param {string} password
 * @returns {boolean}
 */
export const isValidPassword = (password) => {
    if (password.length < 8) return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber;
};

/**
 * Password validation with detailed response (for Register component)
 * @param {string} password
 * @returns {object}
 */
export const validatePassword = (password) => {
    if (!password) {
        return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUpperCase) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!hasLowerCase) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!hasNumber) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }

    return { isValid: true, message: '' };
};

/**
 * Get password strength
 * @param {string} password
 * @returns {'weak' | 'medium' | 'strong'}
 */
export const getPasswordStrength = (password) => {
    if (password.length < 8) return 'weak';

    let strength = 0;

    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++; // Special characters
    if (password.length >= 12) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
};

/**
 * OTP validation (6 digits)
 * @param {string} otp
 * @returns {boolean}
 */
export const isValidOTP = (otp) => {
    return /^\d{6}$/.test(otp);
};

/**
 * Validate required field
 * @param {string} value
 * @returns {boolean}
 */
export const isRequired = (value) => {
    return value && value.trim().length > 0;
};
