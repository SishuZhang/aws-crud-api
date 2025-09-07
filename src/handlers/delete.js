const AWS = require('aws-sdk');
const { MockDocumentClient } = require('../utils/mockDynamoDB');

// Use mock DynamoDB for local development
const dynamoDB = process.env.NODE_ENV === 'dev' ? new MockDocumentClient() : new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE;

exports.handler = async (event) => {
  try {
    const { orderId } = event.pathParameters;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Order ID is required'
        })
      };
    }

    // Check if order exists
    const existingOrder = await dynamoDB.get({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }).promise();

    if (!existingOrder.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Order not found'
        })
      };
    }

    await dynamoDB.delete({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Order deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error deleting order:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error deleting order',
        error: error.message
      })
    };
  }
}; 