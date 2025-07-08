export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error response
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation error: ' + err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized access';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = 'Resource not found';
  }
  
  // Send error response
  res.status(status).json({
    error: message,
    status: status,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};