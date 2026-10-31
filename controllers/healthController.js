// GET /api/ping
// Obs.: a resposta não inclui "success" (comportamento documentado e preservado).
function ping(req, res) {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { ping };
