// 404 para qualquer rota /api/* que não existe (JSON, no mesmo formato dos demais erros)
function apiNotFound(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Handler global de erros do Express (assinatura de 4 argumentos).
// Pega o que escapa dos controllers, p.ex. JSON malformado no body (erro do
// express.json), que antes devolvia uma página HTML com stack trace.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error(err);
    return res.status(status).json({ success: false, error: 'Internal server error' });
  }

  res.status(status).json({ success: false, error: err.message });
}

module.exports = { apiNotFound, errorHandler };
