const { USER_AGENTS } = require('../models/userAgents');

// GET /  ->  renderiza views/home.handlebars dentro de views/layouts/main.handlebars
function index(req, res) {
  res.render('home', {
    title: 'ScrapeX — Dynamic Scraping API',
    userAgentCount: USER_AGENTS.length,
  });
}

module.exports = { index };
