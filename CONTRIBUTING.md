# Contributing to HRM System

Thank you for your interest in contributing to the HRM System! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Message Guidelines](#commit-message-guidelines)
7. [Pull Request Process](#pull-request-process)

## Code of Conduct

We expect all contributors to adhere to our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Git

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/hrm-system.git
   cd hrm-system
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Set up the database:
   ```bash
   npm run generate
   npm run migrate
   npm run seed
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Make your changes
3. Write/update tests
4. Run tests and linter:
   ```bash
   npm test
   npm run lint
   ```

5. Commit your changes (see commit message guidelines)
6. Push to your fork
7. Create a pull request

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid using `any` type when possible
- Use interfaces for object shapes
- Use enums for constant values

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

Key style guidelines:

- Use single quotes for strings
- Use semicolons
- 2 spaces for indentation
- Maximum line length: 100 characters
- Use arrow functions when appropriate
- Use async/await over callbacks

### File Organization

- One component/class per file
- Group related files in directories
- Use index.ts for directory exports
- Follow the existing directory structure:
  - `/src/controllers` - Request handlers
  - `/src/services` - Business logic
  - `/src/models` - Data models
  - `/src/middleware` - Express middleware
  - `/src/utils` - Utility functions
  - `/src/types` - TypeScript types and interfaces

### Naming Conventions

- **Files**: kebab-case (e.g., `employee.service.ts`)
- **Classes**: PascalCase (e.g., `EmployeeService`)
- **Functions/Variables**: camelCase (e.g., `getEmployeeById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IEmployee`)
- **Types**: PascalCase (e.g., `ServiceResponse`)

## Testing Guidelines

### Test Coverage

- Aim for at least 70% code coverage
- Write tests for all new features
- Update tests when modifying existing code

### Test Types

1. **Unit Tests**: Test individual functions/methods
   - Location: `/tests/unit`
   - File naming: `*.test.ts`

2. **Integration Tests**: Test API endpoints
   - Location: `/tests/integration`
   - File naming: `*.test.ts`

### Writing Tests

```typescript
describe('Feature/Component Name', () => {
  describe('Method/Function Name', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- employee.test.ts

# Generate coverage report
npm test -- --coverage
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```
feat(employee): add employee search functionality

Implemented full-text search across employee records including
name, email, and employee ID fields.

Closes #123
```

```
fix(auth): resolve token expiration issue

Fixed bug where refresh tokens were not properly validated,
causing premature session expiration.

Fixes #456
```

## Pull Request Process

### Before Submitting

1. Ensure all tests pass
2. Update documentation if needed
3. Add/update tests for new functionality
4. Run linter and fix any issues
5. Rebase on the latest main branch

### PR Title

Follow the commit message format:
```
feat(scope): add new feature
fix(scope): resolve bug
```

### PR Description

Include:

1. **Description**: What changes does this PR introduce?
2. **Motivation**: Why is this change needed?
3. **Testing**: How has this been tested?
4. **Screenshots**: For UI changes (if applicable)
5. **Breaking Changes**: List any breaking changes
6. **Related Issues**: Link to related issues

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged

## Related Issues
Closes #(issue number)
```

### Review Process

1. At least one approval required
2. All CI checks must pass
3. No merge conflicts
4. Code review comments addressed

### After Approval

1. Squash commits if necessary
2. Ensure branch is up to date with main
3. Merge using "Squash and merge" or "Rebase and merge"

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

## Questions?

If you have questions, please:

1. Check existing issues
2. Create a new issue with the "question" label
3. Join our community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
