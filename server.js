// Ponto de entrada: só sobe o servidor. Toda a configuração do Express está em app.js.
const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`🕷  Scraping System running at http://localhost:${config.port}`);
  console.log(`📡 API available at http://localhost:${config.port}/api`);
  console.log(`🖥  Dashboard at http://localhost:${config.port}`);
});
