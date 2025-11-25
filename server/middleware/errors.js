export class AppError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function errorResponder(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const isApi = req.path.startsWith('/api');
  const payload = {
    message: err.message || 'Internal Server Error'
  };
  if (err.errors) payload.errors = err.errors;

  // Log server-side for visibility
  console.error(err);

  if (isApi) {
    return res.status(status).json(payload);
  }

  res.status(status >= 500 ? 500 : status).send(status >= 500 ? 'Server error' : payload.message);
}
