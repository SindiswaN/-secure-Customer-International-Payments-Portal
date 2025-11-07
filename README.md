# -secure-Customer-International-Payments-Portal

Contents
Project Overview:	2
Secure User Access	2
Making International Payments	3
Data Protection	3
Key Security Features	4
Input Validation	4
Attack Prevention	4
SSL Encryption	5
API Testing Guide	5
System Architecture:	6
Security implementation:	7
SCREENSHOTS:	7



Project Overview:
The Customer International Payments Portal Backend API is a secure RESTful service that allows users to initiate and handle international payments. Developed using Node.js and MongoDB, the platform prioritizes security, data integrity, and strong API architecture.
Key Features:
•	Secure user authentication and authorization
•	International payment creation and management
•	HTTPS encryption for all data transmission
•	Comprehensive input validation and attack protection
•	Payment history and tracking
•	Role-based access control (Customer vs Admin)

 Secure User Access
Registration Process:
•	Users create accounts with strong passwords
•	Passwords are immediately encrypted using bcrypt (military-grade hashing)
•	Each user gets a unique ID and role (customer or admin)
Login Process:
•	System verifies credentials against encrypted passwords
•	Successful login generates a JWT token (digital pass)
•	This token must be included in all future requests
Making International Payments
Payment Creation:
•	Users provide payment details (accounts, amounts, recipient info)
•	Every input is checked against strict rules (RegEx patterns)
•	System blocks suspicious inputs like SQL code or HTML scripts
•	Each payment gets a unique reference number for tracking
Security Checks:
•	Account numbers must match international formats
•	SWIFT codes must be valid bank identifiers
•	Amounts must be positive and within limits
•	All data is validated before database storage
 Data Protection
Encryption in Transit:
•	All communication uses HTTPS/SSL
•	Data is encrypted between client and server
•	SSL certificates ensure secure connections
Database Security:
•	Passwords are never stored in plain text
•	Payment data is stored with user associations
•	Each user can only access their own payments
Key Security Features
Password Protection
•	Passwords are hashed with 12 rounds of salting
•	Even identical passwords get different hashes
•	System compares hashes, never plain text
Input Validation
What it blocks:
•	SQL injection attacks (database manipulation)
•	XSS attacks (malicious scripts)
•	Invalid data formats
•	Suspicious characters and patterns
How it works:
•	Every input field has specific format rules
•	Only approved character patterns are accepted
•	Dangerous inputs are rejected immediately
Attack Prevention
Brute Force Protection:
•	express-brute limits login attempts
•	After 5 failed tries, delays increase exponentially
•	Prevents automated password guessing
Authentication Security:
•	JWT tokens expire after 24 hours
•	Tokens are required for all payment operations
•	Without valid token, access is denied
SSL Encryption
•	All data travels through encrypted channels
•	Prevents eavesdropping on network traffic
•	Valid certificates ensure connection authenticity
•	All traffic served over HTTPS
•	Valid SSL certificates using mkcert
•	HSTS headers enforced
•	Secure padlock in browsers

API Testing Guide

What to Test in Postman
1. Verify SSL Security
•	Call GET /health endpoint
•	Confirm HTTPS connection with padlock icon
•	Check response shows "secure": true
2. Test User Registration
•	Try valid and invalid passwords
•	Show how weak passwords get rejected
•	Demonstrate SQL injection attempts being blocked
3. Demonstrate Login Security
•	Show successful login with JWT token
•	Demonstrate failed login responses
•	Test brute force protection with rapid attempts
4. Payment Creation Tests
•	Create valid international payments
•	Show validation errors for invalid data
•	Demonstrate XSS and SQL injection blocking
•	Test access without proper authentication
System Architecture:

Technology Stack:
•	Backend: Node.js with Express.js
•	Database: MongoDB Atlas (Cloud)
•	Authentication: JWT (JSON Web Tokens)
•	Security: bcrypt, express-brute, custom validation
•	SSL: mkcert for local development

Security implementation:

Password Security

// bcrypt with 12 salt rounds
const hashedPassword = await bcrypt.hash(password, 12);
const passwordMatch = await bcrypt.compare(inputPassword, storedHash);
•	Hashing: bcrypt with 12 salt rounds
•	Validation: RegEx pattern requiring:
o	Minimum 8 characters
o	At least 1 uppercase letter
o	At least 1 lowercase letter
o	At least 1 number
o	At least 1 special character
