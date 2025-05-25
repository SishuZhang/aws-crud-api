const PRODUCTS = {
  APPLE: {
    id: 'apple',
    name: 'Apple',
    price: 1
  },
  ORANGE: {
    id: 'orange',
    name: 'Orange',
    price: 2
  },
  PEAR: {
    id: 'pear',
    name: 'Pear',
    price: 3
  }
};

const calculateOrderTotal = (items) => {
  return Object.entries(items).reduce((total, [productId, quantity]) => {
    const product = PRODUCTS[productId.toUpperCase()];
    return total + (product.price * quantity);
  }, 0);
};

module.exports = {
  PRODUCTS,
  calculateOrderTotal
}; 