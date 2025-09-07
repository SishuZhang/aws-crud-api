# Testing Guide for AWS CRUD API

This project includes comprehensive testing using Jest for unit/integration tests and Playwright for end-to-end UI testing.

## Test Structure

```
├── __tests__/                 # Jest tests
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── tests/                    # Playwright tests
│   ├── api.test.js          # API functionality tests
│   ├── ui.test.js           # UI component tests
│   ├── test-utils.js        # Test utilities
│   ├── global-setup.js      # Global test setup
│   └── global-teardown.js   # Global test teardown
├── public/                   # Frontend UI for testing
│   └── index.html           # Test interface
└── playwright.config.js     # Playwright configuration
```

## Prerequisites

1. **Node.js** (version 20 or higher)
2. **npm** or **yarn**
3. **AWS CLI** (for local DynamoDB setup)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Jest Tests (Unit & Integration)

```bash
# Run all Jest tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

### Playwright Tests (E2E UI Tests)

```bash
# Run all Playwright tests
npm run test:playwright

# Run tests with UI mode (interactive)
npm run test:playwright:ui

# Run tests in headed mode (visible browser)
npm run test:playwright:headed

# Show test report
npm run test:playwright:report
```

### Run All Tests

```bash
# Run both Jest and Playwright tests
npm run test:all
```

## Local Development Setup

### Start the API Server

```bash
# Start serverless offline (API server)
npm run offline
```

The API will be available at `http://localhost:4000`

### Start the UI Server

```bash
# Start the test UI (in another terminal)
npm run start:ui
```

The UI will be available at `http://localhost:3000`

### Start Both Servers

```bash
# Start both API and UI servers concurrently
npm run dev
```

## Test Configuration

### Playwright Configuration

The Playwright tests are configured to:
- Run on multiple browsers (Chrome, Firefox, Safari)
- Test on desktop and mobile viewports
- Automatically start the API server before tests
- Generate HTML, JSON, and JUnit reports
- Take screenshots and videos on failure

### Test Data

The tests use the following test products:
- **Apple**: $1.00
- **Orange**: $2.00
- **Pear**: $3.00

## Test Scenarios

### API Tests (`api.test.js`)

1. **Order Creation**
   - Create order with single item
   - Create order with multiple items
   - Validate required fields
   - Handle invalid product selection

2. **Order Retrieval**
   - List all orders
   - Get specific order by ID
   - Handle non-existent orders
   - Test pagination with limits

3. **Order Updates**
   - Update customer information
   - Update shipping address
   - Update order status
   - Validate update data

4. **Order Deletion**
   - Delete existing orders
   - Handle confirmation dialogs
   - Validate deletion responses

5. **Error Handling**
   - Network errors
   - Invalid data
   - API unavailability

### UI Tests (`ui.test.js`)

1. **Responsive Design**
   - Desktop viewport testing
   - Mobile viewport testing
   - Form layout validation

2. **User Interactions**
   - Form validation
   - Dynamic item addition/removal
   - Loading states
   - Error message display

3. **Component Behavior**
   - Order list display
   - Status indicators
   - Confirmation dialogs
   - Form reset functionality

## Test Reports

### Jest Reports

- **Coverage Report**: `coverage/lcov-report/index.html`
- **Coverage Data**: `coverage/coverage-final.json`

### Playwright Reports

- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results.json`
- **JUnit Results**: `test-results.xml`

## Continuous Integration

The tests are configured to run in CI environments with:
- Retry logic for flaky tests
- Parallel test execution
- Artifact collection for reports
- Screenshot and video capture on failure

## Debugging Tests

### Debug Playwright Tests

```bash
# Run specific test file
npx playwright test tests/api.test.js

# Run specific test
npx playwright test tests/api.test.js -g "should create a new order"

# Debug mode (step through tests)
npx playwright test --debug

# Run with trace
npx playwright test --trace on
```

### Debug Jest Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- __tests__/unit/create.test.js

# Run with watch mode
npm test -- --watch
```

## Test Utilities

The `tests/test-utils.js` file provides helper functions for:
- Creating test orders
- Managing form interactions
- Validating responses
- Generating test data
- API status checking

## Troubleshooting

### Common Issues

1. **API Not Starting**
   - Ensure Node.js version 20+ is installed
   - Check if port 4000 is available
   - Verify serverless configuration

2. **Playwright Tests Failing**
   - Ensure browsers are installed: `npx playwright install`
   - Check if API is running before tests
   - Verify UI is accessible at `http://localhost:3000`

3. **DynamoDB Issues**
   - Ensure AWS credentials are configured
   - Check if DynamoDB Local is running (if using local setup)
   - Verify table permissions

### Logs and Debugging

- **API Logs**: Check serverless offline output
- **Test Logs**: Playwright generates detailed logs
- **Browser Console**: Use `--headed` mode to see browser console
- **Network Tab**: Use `--headed` mode to inspect network requests

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Clean up test data after tests
3. **Realistic Data**: Use realistic test data
4. **Error Scenarios**: Test both success and failure cases
5. **Performance**: Monitor test execution time
6. **Maintenance**: Keep tests updated with code changes

## Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Add appropriate test descriptions
3. Include both positive and negative test cases
4. Update this documentation if needed
5. Ensure tests are deterministic and reliable

