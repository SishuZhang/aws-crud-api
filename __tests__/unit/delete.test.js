// Set env before loading the handler
process.env.ORDERS_TABLE = 'OrdersTableTest';

// Create mock functions
const mockGet = jest.fn();
const mockDelete = jest.fn();

// Mock AWS SDK BEFORE importing the handler
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      get: mockGet,
      delete: mockDelete
    }))
  }
}));

// Import handler AFTER setting up mocks
const { handler } = require('../../src/handlers/delete');

describe('delete handler unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should delete an item if found', async () => {
    mockGet.mockReturnValueOnce({
      promise: () => Promise.resolve({ Item: { id: '123' } })
    });

    mockDelete.mockReturnValueOnce({
      promise: () => Promise.resolve({})
    });

    const event = {
      pathParameters: {
        orderId: '123'
      }
    };

    const response = await handler(event);

    expect(mockGet).toHaveBeenCalledWith({
      TableName: 'OrdersTableTest',
      Key: { id: '123' }
    });

    expect(mockDelete).toHaveBeenCalledWith({
      TableName: 'OrdersTableTest',
      Key: { id: '123' }
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe('Order deleted successfully');
  });

  test('should return 404 if item not found', async () => {
    mockGet.mockReturnValueOnce({
      promise: () => Promise.resolve({})
    });

    const event = {
      pathParameters: {
        orderId: 'non-existent-id'
      }
    };

    const response = await handler(event);

    expect(mockGet).toHaveBeenCalledWith({
      TableName: 'OrdersTableTest',
      Key: { id: 'non-existent-id' }
    });

    expect(mockDelete).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).message).toBe('Order not found');
  });
});
