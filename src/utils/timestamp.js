const getESTTimestamp = () => {
  const now = new Date();
  const estOptions = {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  return {
    formatted: now.toLocaleString('en-US', estOptions),
    timestamp: now.getTime(),
    timezone: 'EST'
  };
};

module.exports = {
  getESTTimestamp
}; 