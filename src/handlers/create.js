const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { getESTTimestamp } = require('../utils/timestamp');
const { MockDocumentClient } = require('../utils/mockDynamoDB');

// Use mock DynamoDB for local development
const dynamoDB = process.env.NODE_ENV === 'dev' ? new MockDocumentClient() : new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE;
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

const validateOrderData = async (data) => {
  const requiredFields = ['customerName', 'items', 'shippingAddress'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate items structure and product existence/quantity, and attach product details
  if (typeof data.items !== 'object' || Object.keys(data.items).length === 0) {
    throw new Error('Items must be a non-empty object with product quantities');
  }

  const validatedItems = {};
  for (const [productId, quantity] of Object.entries(data.items)) {
    // Fetch product from ProductsTable
    const productData = await dynamoDB.get({
      TableName: PRODUCTS_TABLE,
      Key: { productName: productId }
    }).promise();

    if (!productData.Item) {
      throw new Error(`Invalid product: ${productId}`);
    }
    if (typeof quantity !== 'number' || quantity <= 0) {
      throw new Error(`Invalid quantity for ${productId}`);
    }
    
    // Attach product details and calculated price
    validatedItems[productId] = {
      quantity: quantity,
      price: productData.Item.price,
      subtotal: productData.Item.price * quantity
    };
  }
  
  // Replace original items with validated and enriched items
  data.items = validatedItems;
};

const calculateOrderTotal = (items) => {
  let total = 0;
  for (const productId in items) {
    if (items.hasOwnProperty(productId)) {
      total += items[productId].subtotal;
    }
  }
  return total;
};

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    await validateOrderData(data); // data.items will be modified here
    
    const { formatted: estTime, timestamp, timezone } = getESTTimestamp();
    const orderId = uuidv4();
    const totalCost = calculateOrderTotal(data.items);

    const order = {
      id: orderId,
      customerName: data.customerName,
      items: data.items, // Use the enriched items data
      totalCost,
      shippingAddress: data.shippingAddress,
      status: 'PENDING',
      createdAt: {
        formatted: estTime,
        timestamp,
        timezone
      },
      updatedAt: {
        formatted: estTime,
        timestamp,
        timezone
      }
    };

    await dynamoDB.put({
      TableName: ORDERS_TABLE,
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
        orderId: orderId,
        totalCost: totalCost,
        items: data.items // Include the enriched items with prices and subtotals
      })
    };
  } catch (error) {
    console.error('Error creating order:', error);
    let statusCode = 500;
    let errorMessage = 'Error creating order';
    let validProducts = [];

    if (error.message.includes('Missing required fields') || error.message.includes('Invalid quantity')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('Invalid product')) {
      statusCode = 400;
      errorMessage = error.message;
      // Fetch and include valid product list
      try {
        const productsScan = await dynamoDB.scan({
          TableName: PRODUCTS_TABLE,
          ProjectionExpression: 'productName'
        }).promise();
        validProducts = productsScan.Items.map(item => item.productName);
      } catch (scanError) {
        console.error('Error scanning products table:', scanError);
        // Optionally, add a message about failing to fetch valid products
      }

    } else if (error.message.includes('Unexpected token')) {
       statusCode = 400;
       errorMessage = 'Invalid JSON in request body.';
    }

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: errorMessage,
        error: error.message,
        validProducts: validProducts.length > 0 ? validProducts : undefined // Include only if list is not empty
      })
    };
  }
}; 