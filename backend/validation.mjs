// Comprehensive input validation for International Payments Portal
export const validationPatterns = {
    // User authentication
    username: /^[a-zA-Z0-9_]{3,20}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // Payment information
    amount: /^\d+(\.\d{1,2})?$/,
    currency: /^[A-Z]{3}$/,
    accountNumber: /^[A-Z0-9]{8,34}$/,
    swiftCode: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
    routingNumber: /^\d{9}$/,

    // Personal information
    name: /^[a-zA-Z\s]{2,50}$/,
    address: /^[a-zA-Z0-9\s,.-]{5,100}$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    purpose: /^[a-zA-Z0-9\s.,-]{5,200}$/
};

export const validateInput = (pattern, value) => {
    if (typeof value !== 'string') return false;
    return pattern.test(value.trim());
};

export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .replace(/[<>]/g, '')
        .replace(/[&<>"']/g, '')
        .replace(/\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|SELECT|UPDATE|UNION|WHERE)\b/gi, '')
        .trim()
        .substring(0, 1000);
};

// ✅ FIXED: Now properly validates both sourceAccount and targetAccount
export const validatePayment = (paymentData) => {
    const errors = [];

    if (!validateInput(validationPatterns.amount, paymentData.amount)) {
        errors.push('Invalid amount format (e.g., 1000.00)');
    }

    if (!validateInput(validationPatterns.currency, paymentData.currency)) {
        errors.push('Invalid currency code (use 3-letter format like USD, EUR, GBP)');
    }

    // Validate both source and target accounts
    if (!validateInput(validationPatterns.accountNumber, paymentData.sourceAccount)) {
        errors.push('Invalid source account number (8-34 alphanumeric characters)');
    }

    if (!validateInput(validationPatterns.accountNumber, paymentData.targetAccount)) {
        errors.push('Invalid destination account number (8-34 alphanumeric characters)');
    }

    if (!validateInput(validationPatterns.name, paymentData.beneficiaryName)) {
        errors.push('Invalid beneficiary name (2-50 letters and spaces only)');
    }

    if (!validateInput(validationPatterns.swiftCode, paymentData.beneficiaryBank)) {
        errors.push('Invalid bank SWIFT code (8 or 11 characters, e.g., BOFAUS3N)');
    }

    if (!validateInput(validationPatterns.purpose, paymentData.purpose)) {
        errors.push('Invalid payment purpose (5-200 characters)');
    }

    const amount = parseFloat(paymentData.amount);
    if (amount > 100000) {
        errors.push('Amount exceeds maximum limit of 100,000');
    }

    if (amount <= 0) {
        errors.push('Amount must be positive');
    }

    return errors;
};