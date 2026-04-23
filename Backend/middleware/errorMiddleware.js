/**
 * Standardized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "An unexpected server error occurred.",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

/**
 * 404 Not Found Middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
