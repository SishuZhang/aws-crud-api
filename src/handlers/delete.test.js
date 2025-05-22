const AWS = require('aws-sdk');
const { handler } = require('./delete');

// Mock AWS DynamoDB
jest.mock('aws-sdk', () => {
  const mockDeletePromise = jest.fn().mockResolvedValue({});
  const mockDelete = jest.fn().mockReturnValue({ promise: mockDeletePromise });
  const mockDocumentClient = jest.fn().mockImplementation(() => ({ delete: mockDelete }));
  return { DynamoDB: { DocumentClient: mockDocumentClient } };
});

describe('delete handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete the item if it exists', async () => {
    const event = {
      pathParameters: { id: '123' }
    };

    AWS.DynamoDB.DocumentClient().delete.mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({})
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe('Item deleted successfully.');
  });

  it('should return 404 if the item does not exist', async () => {
    const event = {
      pathParameters: { id: '123' }
    };

    AWS.DynamoDB.DocumentClient().delete.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue({ code: 'ResourceNotFoundException' })
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Item not found.');
  });

  it('should handle errors gracefully', async () => {
    const event = {
      pathParameters: { id: '123' }
    };

    AWS.DynamoDB.DocumentClient().delete.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Could not delete the item.');
  });
}); 