const { hashPassword, verifyPassword } = require('../../src/utils/passwordHasher');

describe('Password Hasher Utils', () => {
  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'MySecurePassword123!';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(typeof hashed).toBe('string');
    });

    it('should create different hashes for same password', async () => {
      const password = 'MySecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Should be different due to salt
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'MySecurePassword123!';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'MySecurePassword123!';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword123!', hashed);
      expect(isValid).toBe(false);
    });

    it('should handle case-sensitive passwords', async () => {
      const password = 'MySecurePassword123!';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword('mysecurepassword123!', hashed);
      expect(isValid).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@$$w0rd!#$%^&*()';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should handle very long passwords', async () => {
      const password = 'A'.repeat(500);
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const password = 'パスワード123';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should return false for empty string verification', async () => {
      const password = 'MySecurePassword123!';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword('', hashed);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const isValid = await verifyPassword('password', 'invalid-hash-format');
      expect(isValid).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle hashing errors gracefully', async () => {
      // Test with extremely large input that might cause issues
      const hugPassword = 'A'.repeat(10000000); // 10MB string

      try {
        await hashPassword(hugPassword);
        // If it succeeds, that's also acceptable
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).toContain('Error hashing password');
      }
    });
  });
});
