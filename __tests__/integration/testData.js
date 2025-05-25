// Integration test data for CRUD API

const sampleProducts = [
  {
    id: 'apple',
    name: 'Apple',
    price: 1
  },
  {
    id: 'orange',
    name: 'Orange',
    price: 2
  },
  {
    id: 'pear',
    name: 'Pear',
    price: 3
  }
];

const newProduct = {
  id: 'banana',
  name: 'Banana',
  price: 4
};

const updateProduct = {
  id: 'apple',
  name: 'Green Apple',
  price: 1.5
};

const deleteProductId = 'pear';

module.exports = {
  sampleProducts,
  newProduct,
  updateProduct,
  deleteProductId
}; 