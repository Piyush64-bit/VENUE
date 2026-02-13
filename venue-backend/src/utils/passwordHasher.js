const argon2 = require('argon2');

/**
 * Argon2id configuration options
 * - memoryCost: 64 MB
 * - timeCost: 3 iterations
 * - parallelism: 4 threads
 */
const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
};

/**
 * Hash a password using Argon2id
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
    try {
        const hashedPassword = await argon2.hash(password, ARGON2_OPTIONS);
        return hashedPassword;
    } catch (error) {
        throw new Error(`Error hashing password: ${error.message}`);
    }
}

/**
 * Verify a password using Argon2id
 * 
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(plainPassword, hashedPassword) {
    try {
        return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
        // Invalid hash or verification failed
        return false;
    }
}

/**
 * Check if a hash is Argon2
 * @param {string} hash - Password hash
 * @returns {boolean} True if hash appears to be Argon2
 */
function isArgon2Hash(hash) {
    return hash && hash.startsWith('$argon2');
}

/**
 * Check if a hash is bcrypt
 * @param {string} hash - Password hash
 * @returns {boolean} True if hash appears to be bcrypt
 */
function isBcryptHash(hash) {
    return hash && hash.startsWith('$2');
}

module.exports = {
    hashPassword,
    verifyPassword,
    isArgon2Hash,
    isBcryptHash,
    ARGON2_OPTIONS,
};
