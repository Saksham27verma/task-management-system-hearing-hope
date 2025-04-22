import { createToken, verifyToken, hasRole } from './auth';
import jwt from 'jsonwebtoken';
import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the JWT library
jest.mock('jsonwebtoken');

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createToken', () => {
    it('should create a JWT token with correct payload', () => {
      // Mock implementation of jwt.sign
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');
      
      // Mock user object
      const mockUser = {
        _id: '12345',
        role: 'MANAGER',
        email: 'test@example.com',
        toJSON: () => ({
          _id: '12345',
          role: 'MANAGER',
          email: 'test@example.com',
        }),
      };
      
      // Call the function
      const token = createToken(mockUser as any);
      
      // Check if jwt.sign was called with correct parameters
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: '12345',
          role: 'MANAGER',
          email: 'test@example.com',
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Check if the function returns the token
      expect(token).toBe('mock-token');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return payload', () => {
      // Mock payload
      const mockPayload = {
        userId: '12345',
        role: 'MANAGER',
        email: 'test@example.com',
      };
      
      // Mock implementation of jwt.verify
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      // Call the function
      const result = verifyToken('valid-token');
      
      // Check if jwt.verify was called with correct parameters
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      
      // Check if the function returns the payload
      expect(result).toEqual(mockPayload);
    });

    it('should return null if token verification fails', () => {
      // Mock jwt.verify to throw an error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Call the function
      const result = verifyToken('invalid-token');
      
      // Check if the function returns null
      expect(result).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the required role', () => {
      // Mock user object
      const user = {
        userId: '12345',
        role: 'MANAGER',
        email: 'test@example.com',
      };
      
      // Check if user has MANAGER role
      const result = hasRole(user, 'MANAGER', 'SUPER_ADMIN');
      
      // Expect the result to be true
      expect(result).toBe(true);
    });

    it('should return false if user does not have the required role', () => {
      // Mock user object
      const user = {
        userId: '12345',
        role: 'EMPLOYEE',
        email: 'test@example.com',
      };
      
      // Check if user has MANAGER or SUPER_ADMIN role
      const result = hasRole(user, 'MANAGER', 'SUPER_ADMIN');
      
      // Expect the result to be false
      expect(result).toBe(false);
    });
  });
}); 