// Health check endpoint
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'KIK Collectibles Bot API'
  });
};
