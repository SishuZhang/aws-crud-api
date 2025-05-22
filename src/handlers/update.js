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

    const data = JSON.parse(event.body);
    const timestamp = new Date().getTime();

    // Build update expression and attribute values
    const updateExpression = [];
    const expressionAttributeValues = {};

    if (data.customerName) {
      updateExpression.push('customerName = :customerName');
      expressionAttributeValues[':customerName'] = data.customerName;
    }

    if (data.items) {
      updateExpression.push('items = :items');
      expressionAttributeValues[':items'] = data.items;
    }

    if (data.shippingAddress) {
      updateExpression.push('shippingAddress = :shippingAddress');
      expressionAttributeValues[':shippingAddress'] = data.shippingAddress;
    }

    if (data.status) {
      updateExpression.push('status = :status');
      expressionAttributeValues[':status'] = data.status;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = timestamp;

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    await dynamoDB.update(params).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Order updated successfully'
      })
    };
  } catch (error) {
    console.error('Error updating order:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error updating order',
        error: error.message
      })
    };
  }
}; 