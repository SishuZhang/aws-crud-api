const AWS = require('aws-sdk');
const { handler } = require('./create');

// Mock AWS DynamoDB
jest.mock('aws-sdk', () => {
  const mockPutPromise = jest.fn().mockResolvedValue({});
  const mockPut = jest.fn().mockReturnValue({ promise: mockPutPromise });
  const mockDocumentClient = jest.fn().mockImplementation(() => ({ put: mockPut }));
  return { DynamoDB: { DocumentClient: mockDocumentClient } };
});

describe('create handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an order with a tracking number', async () => {
    const event = {
      body: JSON.stringify({ name: 'Test Order', status: 'pending' })
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.trackingNumber).toBeDefined();
    expect(body.name).toBe('Test Order');
    expect(body.status).toBe('pending');
    expect(body.createdAt).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const event = {
      body: JSON.stringify({ name: 'Test Order', status: 'pending' })
    };

    // Simulate an error
    AWS.DynamoDB.DocumentClient().put.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Could not create the order.');
  });
}); 