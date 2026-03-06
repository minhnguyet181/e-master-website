exports.handleResponse = (res, data, message = 'Success') => {
  res.status(200).json({ success: true, message, data });
};

exports.handleError = (res, error) => {
  console.error('❌ Controller Error:', error);
  const msg = error.message || 'Internal Server Error';
  res.status(400).json({ success: false, message: msg });
};
