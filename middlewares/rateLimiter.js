const config = require('../config');

// Rate limiter simples em memória (por IP).
// Cada chamada de createRateLimiter() cria seu próprio Map, então várias
// instâncias não interferem entre si (e fica fácil de testar).
function createRateLimiter({ windowMs, max }) {
  const requestCounts = new Map();

  return function rateLimiter(req, res, next) {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    const recent = (requestCounts.get(ip) || []).filter((t) => now - t < windowMs);
    recent.push(now);
    requestCounts.set(ip, recent);

    if (recent.length > max) {
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Max ${max} requests/minute.`,
        retry_after: Math.ceil(windowMs / 1000),
      });
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - recent.length);
    next();
  };
}

module.exports = {
  createRateLimiter,
  // Instância padrão, configurada em config/index.js
  rateLimiter: createRateLimiter(config.rateLimit),
};
