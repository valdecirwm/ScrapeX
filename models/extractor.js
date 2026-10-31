const cheerio = require('cheerio');

/**
 * Aplica as extract_rules sobre um HTML.
 *
 * Cada regra pode ser:
 *   - string:  seletor CSS, devolve o texto dos elementos
 *   - objeto:  { selector, type: 'text' | 'attr' | 'html' | 'count' | 'table', attribute? }
 *
 * Regra de achatamento (preservada do sistema antigo): quando o resultado é
 * um array com exatamente 1 item, devolve o item em si.
 */
function extractData(html, options = {}) {
  const $ = cheerio.load(html);
  const result = {};

  if (options.extract_rules) {
    for (const [key, rule] of Object.entries(options.extract_rules)) {
      if (typeof rule === 'string') {
        result[key] = $(rule)
          .map((i, el) => $(el).text().trim())
          .get();
        if (result[key].length === 1) result[key] = result[key][0];
      } else if (typeof rule === 'object') {
        const elements = $(rule.selector);

        if (rule.type === 'text') {
          result[key] = elements.map((i, el) => $(el).text().trim()).get();
        } else if (rule.type === 'attr') {
          result[key] = elements.map((i, el) => $(el).attr(rule.attribute)).get();
        } else if (rule.type === 'html') {
          result[key] = elements.map((i, el) => $(el).html()).get();
        } else if (rule.type === 'count') {
          result[key] = elements.length;
        } else if (rule.type === 'table') {
          result[key] = [];
          elements.find('tr').each((i, row) => {
            const cells = $(row)
              .find('td, th')
              .map((j, cell) => $(cell).text().trim())
              .get();
            if (cells.length) result[key].push(cells);
          });
        }

        if (Array.isArray(result[key]) && result[key].length === 1) {
          result[key] = result[key][0];
        }
      }
    }
  }

  if (options.screenshot_mode || options.clean_html) {
    $('script, style, noscript, iframe').remove();
    result._clean_html = $.html();
  }

  return result;
}

module.exports = { extractData };
