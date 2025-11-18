# HRM System API Documentation

Complete API documentation for the Human Resource Management System.

## Table of Contents

- [Authentication](#authentication)
- [Employees](#employees)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Filtering & Search](#filtering--search)

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Register

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "EMPLOYEE",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Login

Authenticate and receive access tokens.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "EMPLOYEE"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Refresh Token

Get a new access token using a refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Get Profile

Get current user profile.

**Endpoint:** `GET /auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "EMPLOYEE",
      "isActive": true,
      "employee": {
        "id": "uuid",
        "employeeId": "EMP001",
        "firstName": "John",
        "lastName": "Doe",
        "department": "Engineering"
      }
    }
  }
}
```

### Change Password

Change user password.

**Endpoint:** `PUT /auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Logout

Logout and revoke refresh token.

**Endpoint:** `POST /auth/logout`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`

## Employees

### Get All Employees

Retrieve a paginated list of employees with optional filtering.

**Endpoint:** `GET /employees`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `search` (string): Search by name, email, or employee ID
- `department` (string): Filter by department
- `position` (string): Filter by position
- `status` (string): Filter by status (ACTIVE, INACTIVE, TERMINATED)
- `employmentType` (string): Filter by employment type
- `sortBy` (string): Field to sort by (default: createdAt)
- `sortOrder` (string): asc or desc (default: desc)

**Example Request:**
```
GET /employees?page=1&limit=10&search=john&department=Engineering&status=ACTIVE
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "uuid",
        "employeeId": "EMP001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com",
        "department": "Engineering",
        "position": "Senior Software Engineer",
        "status": "ACTIVE",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

### Get Employee by ID

Retrieve a specific employee by UUID.

**Endpoint:** `GET /employees/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "uuid",
      "employeeId": "EMP001",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-05-15",
      "gender": "MALE",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "department": "Engineering",
      "position": "Senior Software Engineer",
      "employmentType": "FULL_TIME",
      "startDate": "2022-01-15",
      "salary": 130000,
      "status": "ACTIVE",
      "manager": {
        "id": "uuid",
        "employeeId": "MGR001",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  }
}
```

### Create Employee

Create a new employee. Requires HR or Admin role.

**Endpoint:** `POST /employees`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "employeeId": "EMP002",
  "email": "jane.smith@company.com",
  "password": "TempPass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1992-08-22",
  "gender": "FEMALE",
  "phone": "+1234567891",
  "address": {
    "street": "456 Oak Ave",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA"
  },
  "department": "Engineering",
  "position": "Software Engineer",
  "employmentType": "FULL_TIME",
  "startDate": "2024-02-01",
  "salary": 95000,
  "managerId": "uuid-of-manager",
  "emergencyContact": {
    "name": "John Smith",
    "relationship": "Spouse",
    "phone": "+1234567892"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "employee": {
      "id": "uuid",
      "employeeId": "EMP002",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com",
      "department": "Engineering",
      "position": "Software Engineer"
    }
  }
}
```

### Update Employee

Update employee information. Requires HR or Admin role.

**Endpoint:** `PUT /employees/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "position": "Senior Software Engineer",
  "salary": 120000,
  "department": "Engineering",
  "status": "ACTIVE"
}
```

**Response:** `200 OK`

### Delete Employee

Soft delete an employee (marks as TERMINATED). Requires HR or Admin role.

**Endpoint:** `DELETE /employees/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

### Get Employee Statistics

Get statistical overview of employees. Requires HR or Admin role.

**Endpoint:** `GET /employees/stats/overview`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 150,
      "active": 145,
      "inactive": 3,
      "onLeave": 2,
      "terminated": 0,
      "byDepartment": {
        "Engineering": 60,
        "Sales": 40,
        "Marketing": 25,
        "HR": 10,
        "Finance": 15
      },
      "byEmploymentType": {
        "FULL_TIME": 130,
        "PART_TIME": 15,
        "CONTRACT": 5
      },
      "averageSalary": 95000,
      "recentHires": 12
    }
  }
}
```

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

API requests are rate-limited to prevent abuse:

### General Endpoints
- **Window:** 15 minutes
- **Max Requests:** 100

### Authentication Endpoints
- **Window:** 15 minutes
- **Max Requests:** 5

### Write Operations
- **Window:** 1 minute
- **Max Requests:** 20

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Pagination

All list endpoints support pagination:

### Request
```
GET /employees?page=2&limit=20
```

### Response
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 2,
    "limit": 20,
    "totalPages": 5
  }
}
```

## Filtering & Search

### Search
Search across multiple fields:
```
GET /employees?search=john
```
Searches: name, email, employee ID

### Filter by Field
```
GET /employees?department=Engineering&status=ACTIVE
```

### Sorting
```
GET /employees?sortBy=salary&sortOrder=desc
```

### Combined
```
GET /employees?search=engineer&department=Engineering&status=ACTIVE&sortBy=salary&sortOrder=desc&page=1&limit=20
```

## Webhooks (Future Feature)

Coming soon: Real-time notifications for events like:
- Employee created
- Employee updated
- Employee terminated
- Leave approved/rejected

## API Versioning

The API uses URL versioning: `/api/v1/`

Future versions will be available at `/api/v2/`, etc.

## Support

For API support:
- Email: api-support@hrm-system.com
- Documentation: https://docs.hrm-system.com
- Issues: https://github.com/hrm-system/issues
