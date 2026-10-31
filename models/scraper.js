const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const config = require('../config');
const { getRandomUserAgent } = require('./userAgents');
const { extractData } = require('./extractor');

function buildHeaders(options = {}) {
  const headers = {
    'User-Agent': options.custom_user_agent || getRandomUserAgent(),
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  };

  if (options.custom_headers) {
    Object.assign(headers, options.custom_headers);
  }

  return headers;
}

function buildMeta(url, response, duration, options) {
  return {
    job_id: uuidv4(),
    url,
    status_code: response.status,
    content_type: response.headers['content-type'] || 'unknown',
    duration_ms: duration,
    page_size_bytes: Buffer.byteLength(response.data || '', 'utf8'),
    timestamp: new Date().toISOString(),
    options_used: {
      render_js: options.render_js || false,
      premium_proxy: options.premium_proxy || false,
      block_resources: options.block_resources || false,
    },
  };
}

async function scrape(params) {
  const startTime = Date.now();
  const {
    url,
    method = 'GET',
    timeout = config.scraper.defaultTimeout,
    wait = 0,
    extract_rules,
    return_page_source = false,
    json_response = false,
    custom_headers = {},
    custom_user_agent,
    cookies,
    proxy,
  } = params;

  if (!url) throw new Error('URL is required');

  let targetUrl = url;
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  const axiosConfig = {
    method,
    url: targetUrl,
    headers: buildHeaders({ custom_headers, custom_user_agent }),
    timeout,
    maxRedirects: 5,
    validateStatus: () => true,
  };

  if (cookies) {
    axiosConfig.headers['Cookie'] = cookies;
  }

  if (proxy) {
    const [proxyHost, proxyPort] = proxy.split(':');
    axiosConfig.proxy = { host: proxyHost, port: parseInt(proxyPort) };
  }

  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }

  const response = await axios(axiosConfig);
  const duration = Date.now() - startTime;
  const html = response.data;
  const $ = cheerio.load(html);

  const meta = buildMeta(targetUrl, response, duration, params);

  const result = {
    meta,
    body: return_page_source ? html : undefined,
    text: !return_page_source
      ? $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000)
      : undefined,
    title: $('title').text().trim(),
    links: $('a[href]')
      .map((i, el) => ({
        text: $(el).text().trim(),
        href: $(el).attr('href'),
      }))
      .get()
      .slice(0, 50),
    images: $('img[src]')
      .map((i, el) => ({
        alt: $(el).attr('alt') || '',
        src: $(el).attr('src'),
      }))
      .get()
      .slice(0, 20),
    meta_tags: {},
  };

  $('meta[name], meta[property]').each((i, el) => {
    const name = $(el).attr('name') || $(el).attr('property');
    const content = $(el).attr('content');
    if (name && content) result.meta_tags[name] = content;
  });

  if (extract_rules) {
    result.extracted = extractData(html, { extract_rules });
  }

  if (json_response) {
    try {
      result.json = JSON.parse(html);
    } catch {
      result.json = null;
    }
  }

  return result;
}

async function bulkScrape(jobs) {
  const batchId = uuidv4();
  const results = await Promise.allSettled(jobs.map((job) => scrape(job)));

  return {
    batch_id: batchId,
    total: jobs.length,
    success: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
    results: results.map((r, i) => ({
      index: i,
      url: jobs[i].url,
      status: r.status,
      data: r.status === 'fulfilled' ? r.value : null,
      error: r.status === 'rejected' ? r.reason.message : null,
    })),
  };
}

module.exports = { scrape, bulkScrape };
