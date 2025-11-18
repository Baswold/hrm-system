import request from 'supertest';
import createApp from '../../src/app';
import { Application } from 'express';

describe('Auth Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Mock the prisma user creation
      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient().user.findUnique.mockResolvedValue(null);
      mockPrisma.PrismaClient().user.create.mockResolvedValue({
        id: 'user-123',
        email: userData.email,
        password: 'hashed-password',
        role: 'EMPLOYEE',
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.PrismaClient().user.update.mockResolvedValue({});
      mockPrisma.PrismaClient().refreshToken.create.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        token: '',
        expiresAt: new Date(),
        isRevoked: false,
        createdAt: new Date(),
      });
      mockPrisma.PrismaClient().refreshToken.update.mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with missing fields', async () => {
      const userData = {
        email: 'test@example.com',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with invalid email format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on auth endpoints', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password',
      };

      // Make multiple rapid requests
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send(userData)
      );

      const responses = await Promise.all(requests);

      // At least some should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 15000);
  });
});
