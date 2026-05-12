exports.handleResponse = (res, data, message = 'Success') => {
  res.status(200).json({ success: true, message, data, request_id: res.req?.id || undefined });
};

exports.handleError = (res, error) => {
  const status = Number(error.statusCode || error.status || 400);
  const msg = error.message || 'Internal Server Error';
  console.error('❌ Controller Error:', { request_id: res.req?.id, status, message: msg, stack: error.stack });
  res.status(status).json({ success: false, message: msg, request_id: res.req?.id || undefined });
};
