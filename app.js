// app.js monta a aplicação Express (engine de views, middlewares, rotas).
// Não chama listen(): quem sobe o servidor é o server.js. Essa separação deixa
// o app importável em testes sem abrir uma porta.
const express = require('express');
const cors = require('cors');
const path = require('path');
const { engine } = require('express-handlebars');

const config = require('./config');
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');
const { rateLimiter } = require('./middlewares/rateLimiter');
const { apiNotFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

if (config.trustProxy) app.set('trust proxy', config.trustProxy);

// ---- VIEW ENGINE (Handlebars) ----
// Layout padrão: views/layouts/main.handlebars | Páginas: views/*.handlebars
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// ---- MIDDLEWARES GLOBAIS ----
app.use(cors());
app.use(express.json({ limit: config.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos (css/js do dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// ---- ROTAS ----
app.use('/', webRoutes);

// A ORDEM IMPORTA: o rate limiter precisa vir ANTES das rotas da API.
// (No sistema antigo ele estava registrado depois e nunca era executado.)
app.use('/api/scrape', rateLimiter);
app.use('/api', apiRoutes);

// ---- ERROS (sempre por último) ----
app.use('/api', apiNotFound);
app.use(errorHandler);

module.exports = app;
