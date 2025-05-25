const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
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

    // Get item from OrdersTable using orderId
    const result = await dynamoDB.get({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }).promise();

    const order = result.Item;

    if (!order) {
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

    // Return the full order details as per the updated requirements
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(order)
    };
  } catch (error) {
    console.error('Error retrieving order:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error retrieving order',
        error: error.message
      })
    };
  }
}; 