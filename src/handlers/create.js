const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE;

const generateTrackingNumber = () => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRK-${random}-${random}-${random}`;
};

const validateOrderData = (data) => {
  const requiredFields = ['customerName', 'items', 'shippingAddress'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Items must be a non-empty array');
  }
};

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    validateOrderData(data);
    
    const timestamp = new Date().getTime();

    const order = {
      id: uuidv4(),
      customerName: data.customerName,
      items: data.items,
      shippingAddress: data.shippingAddress,
      status: 'PENDING',
      trackingNumber: generateTrackingNumber(),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await dynamoDB.put({
      TableName: TABLE_NAME,
      Item: order
    }).promise();

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Order created successfully',
        ...order
      })
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      statusCode: error.message.includes('Missing required fields') ? 400 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error creating order',
        error: error.message
      })
    };
  }
}; 