const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;

    if (!id) {
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
      TableName: TABLE_NAME,
      Key: { id }
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
      TableName: TABLE_NAME,
      Key: { id }
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