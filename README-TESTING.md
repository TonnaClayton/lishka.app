# Testing Documentation

This document outlines the test suite for the Lishka authentication flow and routing system.

## Setup

The test suite uses:

- **Vitest** as the test runner
- **React Testing Library** for component testing
- **Jest DOM** for additional matchers
- **User Event** for user interaction simulation

### Configuration

- `vitest.config.ts` - Vitest configuration with React and jsdom setup
- `src/test/setup.ts` - Global test setup with mocks for window objects
- `src/test/test-utils.tsx` - Custom render function with providers

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Files

### 1. Authentication Flow Tests

#### `src/pages/auth/__tests__/login-with-email.test.tsx`

Comprehensive tests for the email login page:

**Form Validation Tests:**

- ✅ Renders all form elements correctly
- ✅ Validates required fields
- ✅ Validates email format
- ✅ Transforms email to lowercase and trims whitespace

**Authentication Flow Tests:**

- ✅ Handles successful login with navigation
- ✅ Handles invalid credentials error
- ✅ Handles email not confirmed error
- ✅ Handles too many requests error
- ✅ Handles network errors
- ✅ Handles unexpected exceptions

**UI Interaction Tests:**

- ✅ Toggles password visibility
- ✅ Disables form during loading state
- ✅ Shows proper loading messages

**Email Verification Tests:**

- ✅ Resends verification email successfully
- ✅ Handles resend verification errors
- ✅ Requires email before resending
- ✅ Shows loading state during resend

#### `src/pages/auth/__tests__/login-basic.test.tsx`

Basic UI tests for the main login page:

- ✅ Renders authentication options (Google, Apple, Email)
- ✅ Renders brand messaging
- ✅ Contains proper navigation links

#### `src/pages/home/__tests__/onboarding-dialog.test.tsx`

Tests for the onboarding dialog component:

- ✅ Shows dialog when user hasn't seen onboarding
- ✅ Hides dialog when user has seen onboarding
- ✅ Renders all onboarding screens
- ✅ Handles profile updates correctly
- ✅ Shows loading states
- ✅ Handles errors gracefully

### 2. Context Tests

#### `src/contexts/__tests__/auth-context.test.tsx`

Tests for the authentication context provider:

- ✅ Provides initial auth state
- ✅ Handles sign in flow
- ✅ Handles sign up flow
- ✅ Handles sign out with redirect
- ✅ Handles forgot password
- ✅ Handles email confirmation resend
- ✅ Handles account deletion
- ✅ Responds to auth state changes

### 3. Utility Tests

#### `src/lib/__tests__/routing.test.ts`

Comprehensive tests for routing constants:

- ✅ Contains all expected route constants
- ✅ Validates route structure for different sections
- ✅ Ensures consistent naming conventions
- ✅ Validates parameterized routes
- ✅ Ensures no duplicate routes
- ✅ Validates route format consistency

## Test Coverage Areas

### ✅ Covered Areas

1. **Form Validation**
   - Email format validation
   - Required field validation
   - Input transformation (lowercase, trim)

2. **Error Handling**
   - Network errors
   - Authentication errors
   - Validation errors
   - Unexpected exceptions

3. **User Interactions**
   - Form submission
   - Password visibility toggle
   - Loading states
   - Button interactions

4. **Navigation**
   - Successful login redirect
   - Route constants validation
   - Link destinations

5. **Authentication Flow**
   - Login process
   - Email verification
   - Account management

### 🔄 Areas for Future Enhancement

1. **Integration Tests**
   - Full authentication flow end-to-end
   - Route protection testing
   - State persistence testing

2. **Accessibility Tests**
   - Screen reader compatibility
   - Keyboard navigation
   - ARIA attributes

3. **Performance Tests**
   - Component rendering performance
   - Memory leak detection
   - Bundle size impact

4. **Visual Regression Tests**
   - Component appearance
   - Responsive design
   - Dark mode support

## Mock Strategy

The test suite uses strategic mocking:

- **Supabase Client**: Mocked to control authentication responses
- **React Router**: Mocked for navigation testing
- **Window Objects**: Mocked for browser APIs (alert, location)
- **External Hooks**: Mocked for consistent test environment

## Best Practices Implemented

1. **Isolated Tests**: Each test is independent and doesn't rely on others
2. **Realistic Mocks**: Mocks behave like real implementations
3. **User-Centric**: Tests focus on user interactions, not implementation details
4. **Error Scenarios**: Both happy path and error conditions are tested
5. **Async Handling**: Proper handling of asynchronous operations
6. **Cleanup**: Proper cleanup after each test to prevent interference

## Running Specific Test Suites

```bash
# Run only routing tests
npm run test:run -- src/lib/__tests__/routing.test.ts

# Run only authentication tests
npm run test:run -- src/pages/auth/__tests__/

# Run only context tests
npm run test:run -- src/contexts/__tests__/

# Run tests with coverage for specific files
npm run test:coverage -- src/lib/__tests__/routing.test.ts
```

## GitHub Actions CI/CD Pipeline

The project now includes comprehensive CI/CD workflows:

### 🚀 **Main CI Pipeline** (`.github/workflows/ci.yml`)

- **Triggers**: Push/PR to `main` or `develop` branches
- **Quality Checks**: Formatting, linting, type checking, unit tests
- **Build Process**: Application build with artifact upload
- **Coverage Reports**: Test coverage generation for PRs

### 🔍 **PR Quality Checks** (`.github/workflows/pr-checks.yml`)

- **Test Coverage Analysis**: Identifies files needing test coverage
- **Focused Testing**: Runs tests only on changed files
- **Test Summaries**: Generates PR test result summaries

### 🛡️ **Security Monitoring** (`.github/workflows/security.yml`)

- **Dependency Auditing**: Weekly security vulnerability scans
- **Dependency Reviews**: PR-based dependency change reviews
- **Outdated Package Detection**: Automated dependency updates

### 📊 **Workflow Features**

- **Parallel Execution**: Quality checks and builds run in parallel
- **Artifact Management**: Build files and coverage reports stored
- **Smart Caching**: NPM dependencies cached for faster builds
- **Fail-Fast**: Pipeline stops on first critical error

### 🎯 **CI Pipeline Steps**

1. **Code Quality**
   - Format validation (`prettier --check`)
   - Linting (`eslint`)
   - TypeScript type checking (`tsc --noEmit`)

2. **Testing**
   - Unit test execution (`vitest run`)
   - Coverage report generation (`vitest --coverage`)
   - Test result summaries

3. **Build & Deploy**
   - Production build (`vite build`)
   - Artifact generation and storage
   - Build verification

The CI pipeline ensures code quality, prevents regressions, and maintains high standards for all contributions to the project.
