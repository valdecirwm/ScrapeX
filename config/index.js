// Configuração centralizada: todo "número mágico" do projeto mora aqui.
// Assim, mudar um limite não exige caçar valores dentro de rotas e controllers.

module.exports = {
  port: process.env.PORT || 3000,

  // Atrás de proxy reverso (Render, Easypanel, Nginx...) defina TRUST_PROXY=1,
  // senão req.ip será o IP do proxy e o rate limit passa a valer para todos juntos.
  // Fora de proxy, deixe sem definir: confiar em X-Forwarded-For sem proxy
  // permite que o cliente forje o IP e escape do limite.
  trustProxy: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : false,

  jsonBodyLimit: '10mb',

  rateLimit: {
    windowMs: 60 * 1000, // janela de 1 minuto
    max: 30, // requisições por IP dentro da janela
  },

  bulk: {
    maxJobs: 20,
  },

  scraper: {
    defaultTimeout: 15000, // ms
  },
};
