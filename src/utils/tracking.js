const { v4: uuidv4 } = require('uuid');

const generateTrackingNumber = () => {
  // Generate a tracking number in format: TRK-XXXX-XXXX-XXXX
  const uuid = uuidv4().replace(/-/g, '').toUpperCase();
  return `TRK-${uuid.slice(0, 4)}-${uuid.slice(4, 8)}-${uuid.slice(8, 12)}`;
};

module.exports = {
  generateTrackingNumber
}; 