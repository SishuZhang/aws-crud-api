// Set test environment variables
process.env.DYNAMODB_TABLE = 'test-table';
process.env.NODE_ENV = 'test';

// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mockDynamoDB = {
    put: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    query: jest.fn().mockReturnThis(),
    scan: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    promise: jest.fn()
  };

  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDynamoDB)
    }
  };
}); 