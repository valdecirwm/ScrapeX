const { scrape, bulkScrape } = require('../models/scraper');
const config = require('../config');

// Formato padrão de erro da API: { success: false, error: "mensagem" }
function fail(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

// Converte a query string do GET /scrape nos parâmetros que o model entende.
// Cada booleano só é verdadeiro se vier exatamente a string "true".
function paramsFromQuery(query) {
  return {
    url: query.url,
    render_js: query.render_js === 'true',
    premium_proxy: query.premium_proxy === 'true',
    block_ads: query.block_ads === 'true',
    return_page_source: query.return_page_source === 'true',
    json_response: query.json_response === 'true',
    timeout: parseInt(query.timeout) || config.scraper.defaultTimeout,
    wait: parseInt(query.wait) || 0,
    custom_user_agent: query.custom_user_agent,
    cookies: query.cookies,
    extract_rules: query.extract_rules ? JSON.parse(query.extract_rules) : null,
  };
}

// GET /api/scrape  (qualquer falha -> 500, conforme a documentação)
async function scrapeByQuery(req, res) {
  try {
    const result = await scrape(paramsFromQuery(req.query));
    res.json({ success: true, ...result });
  } catch (err) {
    fail(res, 500, err.message);
  }
}

// POST /api/scrape  (qualquer falha -> 400, conforme a documentação)
async function scrapeByBody(req, res) {
  try {
    const result = await scrape(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    fail(res, 400, err.message);
  }
}

// POST /api/bulk
// ATENÇÃO: "result" traz uma chave "success" numérica (qtde de jobs ok). Como o
// spread vem depois de "success: true", o valor final é o NÚMERO. O dashboard
// (public/js/main.js) depende disso, então não "corrija" sem ajustar o front.
async function bulk(req, res) {
  try {
    const { jobs } = req.body;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return fail(res, 400, 'jobs array is required');
    }

    if (jobs.length > config.bulk.maxJobs) {
      return fail(res, 400, `Max ${config.bulk.maxJobs} jobs per batch`);
    }

    const result = await bulkScrape(jobs);
    res.json({ success: true, ...result });
  } catch (err) {
    fail(res, 500, err.message);
  }
}

// POST /api/extract
async function extract(req, res) {
  try {
    const { url, selectors } = req.body;

    if (!url || !selectors) {
      return fail(res, 400, 'url and selectors required');
    }

    const result = await scrape({
      url,
      extract_rules: selectors,
      return_page_source: false,
    });

    res.json({
      success: true,
      url,
      extracted: result.extracted,
      meta: result.meta,
    });
  } catch (err) {
    fail(res, 500, err.message);
  }
}

// POST /api/inspect
async function inspect(req, res) {
  try {
    const { url } = req.body;

    if (!url) return fail(res, 400, 'url required');

    const result = await scrape({ url, return_page_source: false });

    res.json({
      success: true,
      url,
      title: result.title,
      meta_tags: result.meta_tags,
      links_count: result.links?.length || 0,
      images_count: result.images?.length || 0,
      links: result.links,
      images: result.images,
      meta: result.meta,
    });
  } catch (err) {
    fail(res, 500, err.message);
  }
}

module.exports = { scrapeByQuery, scrapeByBody, bulk, extract, inspect };
