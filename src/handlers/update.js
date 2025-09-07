const AWS = require('aws-sdk');
const { getESTTimestamp } = require('../utils/timestamp');
const { MockDocumentClient } = require('../utils/mockDynamoDB');

// Use mock DynamoDB for local development
const dynamoDB = process.env.NODE_ENV === 'dev' ? new MockDocumentClient() : new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE;
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

const VALID_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const calculateOrderTotal = async (items) => {
  let total = 0;
  for (const [productId, quantity] of Object.entries(items)) {
    const product = await dynamoDB.get({
      TableName: PRODUCTS_TABLE,
      Key: { productName: productId }
    }).promise();
    if (product.Item && typeof product.Item.price === 'number') { // Ensure price is a number
      total += product.Item.price * quantity;
    } else {
        // Handle cases where product is not found or price is invalid (optional, depending on desired strictness)
        // For now, we'll just log a warning or skip the item.
        console.warn(`Product ${productId} not found or has invalid price.`);
    }
  }
  return total;
};

exports.handler = async (event) => {
  try {
    const { orderId } = event.pathParameters; // Get orderId from path parameters
    const statusUpdate = event.queryStringParameters?.status; // Get status from query string parameters
    let updateData = {};

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Order ID is required' })
      };
    }

    // Parse request body if present
    if (event.body) {
      try {
        updateData = JSON.parse(event.body);
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
         return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Invalid JSON body', error: parseError.message })
        };
      }
    }

    // Validate status update if present
    if (statusUpdate && !VALID_STATUSES.includes(statusUpdate.toUpperCase())) {
       return {
         statusCode: 400,
         headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
         body: JSON.stringify({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
       };
    }

    // Fetch the existing order
    const result = await dynamoDB.get({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }).promise();

    const order = result.Item;

    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Order not found' })
      };
    }

    // Prepare update parameters
    const { formatted: estTime, timestamp, timezone } = getESTTimestamp();
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    const updateExpressions = [];

    // Always include updatedAt
    ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
    ExpressionAttributeValues[':updatedAt'] = { formatted: estTime, timestamp, timezone };
    updateExpressions.push('#updatedAt = :updatedAt');

    // Include status update if provided
    if (statusUpdate) {
      ExpressionAttributeNames['#status'] = 'status';
      ExpressionAttributeValues[':status'] = statusUpdate.toUpperCase();
      updateExpressions.push('#status = :status');
    }

    // Include detail updates from body if provided
    if (updateData.customerName) {
        ExpressionAttributeNames['#customerName'] = 'customerName';
        ExpressionAttributeValues[':customerName'] = updateData.customerName;
        updateExpressions.push('#customerName = :customerName');
    }
    if (updateData.shippingAddress) {
        ExpressionAttributeNames['#shippingAddress'] = 'shippingAddress';
        ExpressionAttributeValues[':shippingAddress'] = updateData.shippingAddress;
        updateExpressions.push('#shippingAddress = :shippingAddress');
    }
    if (updateData.items && typeof updateData.items === 'object' && Object.keys(updateData.items).length > 0) {
        ExpressionAttributeNames['#items'] = 'items';
        ExpressionAttributeNames['#totalCost'] = 'totalCost';
        ExpressionAttributeValues[':items'] = updateData.items;
        ExpressionAttributeValues[':totalCost'] = await calculateOrderTotal(updateData.items); // Recalculate total cost
        updateExpressions.push('#items = :items, #totalCost = :totalCost');
    }

    // Add validation for items structure and content if updating items (similar to create handler)
    if (updateData.items) {
        if (typeof updateData.items !== 'object' || Object.keys(updateData.items).length === 0) {
             return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Error updating order', error: 'Items must be a non-empty object with product quantities' })
            };
        }
         for (const [productId, quantity] of Object.entries(updateData.items)) {
            const product = await dynamoDB.get({
                TableName: PRODUCTS_TABLE,
                Key: { productName: productId }
            }).promise();
             if (!product.Item) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({ message: 'Error updating order', error: `Invalid product: ${productId}` })
                };
            }
            if (typeof quantity !== 'number' || quantity <= 0) {
                 return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({ message: 'Error updating order', error: `Invalid quantity for ${productId}` })
                };
            }
        }
    }

    // Construct the final UpdateExpression
    const UpdateExpression = 'SET ' + updateExpressions.join(', ');

    const params = {
      TableName: ORDERS_TABLE,
      Key: { id: orderId },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const updatedResult = await dynamoDB.update(params).promise();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(updatedResult.Attributes)
    };
  } catch (error) {
    console.error('Error updating order:', error);
     let statusCode = 500; // Default to 500
    if (error.message.includes('Missing required fields') || error.message.includes('Invalid')) {
        statusCode = 400; // Validation errors (from manual validation)
    } else if (error.message.includes('No update parameters provided')) {
         statusCode = 400;
    } else if (error.message.includes('Unexpected token')){
        statusCode = 400; // JSON parsing error
    }

    return {
      statusCode,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Error updating order', error: error.message })
    };
  }
}; 