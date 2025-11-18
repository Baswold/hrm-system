import request from 'supertest';
import createApp from '../../src/app';
import { Application } from 'express';
import { generateAccessToken } from '../../src/utils/crypto';

describe('Employee Integration Tests', () => {
  let app: Application;
  let adminToken: string;
  let employeeToken: string;

  beforeAll(() => {
    app = createApp();

    // Generate test tokens
    adminToken = generateAccessToken({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'ADMIN' as any,
    });

    employeeToken = generateAccessToken({
      userId: 'employee-123',
      email: 'employee@example.com',
      role: 'EMPLOYEE' as any,
    });
  });

  describe('GET /api/v1/employees', () => {
    it('should get all employees with valid token', async () => {
      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient().employee.count.mockResolvedValue(0);
      mockPrisma.PrismaClient().employee.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/employees');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should support pagination parameters', async () => {
      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient().employee.count.mockResolvedValue(50);
      mockPrisma.PrismaClient().employee.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/employees?page=2&limit=20')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support search parameter', async () => {
      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient().employee.count.mockResolvedValue(1);
      mockPrisma.PrismaClient().employee.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/employees?search=john')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support filtering by department', async () => {
      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient().employee.count.mockResolvedValue(5);
      mockPrisma.PrismaClient().employee.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/employees?department=Engineering')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/employees', () => {
    const validEmployeeData = {
      employeeId: 'EMP001',
      email: 'newemployee@company.com',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1990-05-15',
      gender: 'FEMALE',
      phone: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      department: 'Engineering',
      position: 'Software Engineer',
      employmentType: 'FULL_TIME',
      startDate: '2024-01-15',
      salary: 120000,
    };

    it('should reject creation by non-HR/Admin user', async () => {
      const response = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(validEmployeeData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject creation with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: 'Jane',
      };

      const response = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject creation with negative salary', async () => {
      const data = {
        ...validEmployeeData,
        salary: -1000,
      };

      const response = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/employees/:id', () => {
    it('should get employee by valid UUID', async () => {
      const employeeId = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';

      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient().employee.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should reject request with invalid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/employees/invalid-uuid')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/employees/:id', () => {
    const updateData = {
      position: 'Senior Software Engineer',
      salary: 140000,
    };

    it('should reject update by non-HR/Admin user', async () => {
      const employeeId = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';

      const response = await request(app)
        .put(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject update with invalid UUID', async () => {
      const response = await request(app)
        .put('/api/v1/employees/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/employees/:id', () => {
    it('should reject deletion by non-HR/Admin user', async () => {
      const employeeId = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';

      const response = await request(app)
        .delete(`/api/v1/employees/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject deletion with invalid UUID', async () => {
      const response = await request(app)
        .delete('/api/v1/employees/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/employees/stats/overview', () => {
    it('should get statistics with HR/Admin token', async () => {
      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient().employee.count.mockResolvedValue(10);
      mockPrisma.PrismaClient().employee.groupBy.mockResolvedValue([]);
      mockPrisma.PrismaClient().employee.aggregate.mockResolvedValue({
        _avg: { salary: 100000 },
      });

      const response = await request(app)
        .get('/api/v1/employees/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject statistics request from regular employee', async () => {
      const response = await request(app)
        .get('/api/v1/employees/stats/overview')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
