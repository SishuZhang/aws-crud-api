const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE;

const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

module.exports.handler = async (event) => {
  let status;
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    status = body.status;

    // Validate status
    if (!status) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Missing status in request body.',
                validStatuses: Object.values(ORDER_STATUS)
            })
        };
    }

    if (!Object.values(ORDER_STATUS).includes(status)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Invalid status',
          validStatuses: Object.values(ORDER_STATUS)
        })
      };
    }

    const timestamp = new Date().getTime();
    const params = {
      TableName: ORDERS_TABLE,
      Key: { id },
      UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': timestamp
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDB.update(params).promise();

    if (!result || !result.Attributes) {
        console.error('Update operation did not return attributes:', result);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Error updating order status', 
                error: 'Update operation failed to return attributes'
            })
        };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Item status updated successfully.',
        order: result.Attributes
      })
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    let statusCode = 500;
    let errorMessage = 'Error updating order status';

    if (error.code === 'ConditionalCheckFailedException') {
        statusCode = 404;
        errorMessage = 'Item not found or status already updated.'; // Consistent with test expectation
    } else if (error instanceof SyntaxError) {
        statusCode = 400;
        errorMessage = 'Invalid JSON in request body.';
    }

    return {
      statusCode: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: errorMessage,
        error: error.message
      })
    };
  }
}; 