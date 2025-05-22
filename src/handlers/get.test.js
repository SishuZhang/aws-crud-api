const AWS = require('aws-sdk');
const { handler } = require('./get');

// Mock AWS DynamoDB
jest.mock('aws-sdk', () => {
  const mockGetPromise = jest.fn().mockResolvedValue({});
  const mockGet = jest.fn().mockReturnValue({ promise: mockGetPromise });
  const mockDocumentClient = jest.fn().mockImplementation(() => ({ get: mockGet }));
  return { DynamoDB: { DocumentClient: mockDocumentClient } };
});

describe('get handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the item if it exists', async () => {
    const event = {
      pathParameters: { id: '123' }
    };

    const mockItem = { id: '123', name: 'Test Order', status: 'pending' };
    AWS.DynamoDB.DocumentClient().get.mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({ Item: mockItem })
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockItem);
  });

  it('should return 404 if the item does not exist', async () => {
    const event = {
      pathParameters: { id: '123' }
    };

    AWS.DynamoDB.DocumentClient().get.mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({ Item: null })
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Item not found.');
  });

  it('should handle errors gracefully', async () => {
    const event = {
      pathParameters: { id: '123' }
    };

    AWS.DynamoDB.DocumentClient().get.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Could not retrieve the item.');
  });
}); 