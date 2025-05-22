const AWS = require('aws-sdk');
const { handler } = require('./update');

// Mock AWS DynamoDB
jest.mock('aws-sdk', () => {
  const mockUpdatePromise = jest.fn().mockResolvedValue({});
  const mockUpdate = jest.fn().mockReturnValue({ promise: mockUpdatePromise });
  const mockDocumentClient = jest.fn().mockImplementation(() => ({ update: mockUpdate }));
  return { DynamoDB: { DocumentClient: mockDocumentClient } };
});

describe('update handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the item if it exists', async () => {
    const event = {
      pathParameters: { id: '123' },
      body: JSON.stringify({ status: 'completed' })
    };

    const mockUpdatedItem = { id: '123', name: 'Test Order', status: 'completed' };
    AWS.DynamoDB.DocumentClient().update.mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({ Attributes: mockUpdatedItem })
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockUpdatedItem);
  });

  it('should return 404 if the item does not exist', async () => {
    const event = {
      pathParameters: { id: '123' },
      body: JSON.stringify({ status: 'completed' })
    };

    AWS.DynamoDB.DocumentClient().update.mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue({ Attributes: null })
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Item not found.');
  });

  it('should handle errors gracefully', async () => {
    const event = {
      pathParameters: { id: '123' },
      body: JSON.stringify({ status: 'completed' })
    };

    AWS.DynamoDB.DocumentClient().update.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Could not update the item.');
  });
}); 