const BASE = window.location.origin;
document.getElementById('base-url-footer').textContent = BASE;

let reqCount = 0;
let lastResult = null;
let currentCodeTab = 'curl';

// ===== TABS =====
function switchTab(id, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  el.closest('.panel').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  el.classList.add('active');
}

function switchCodeTab(id, el) {
  currentCodeTab = id;
  document.querySelectorAll('.code-tab-content').forEach(t => t.style.display = 'none');
  el.closest('.panel').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('code-' + id).style.display = 'block';
  el.classList.add('active');
  updateCode();
}

function switchResultTab(id, el) {
  document.querySelectorAll('[id^="rt-"]').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('rt-' + id).style.display = 'block';
  el.classList.add('active');
}

// ===== CODE GENERATION =====
function getParams() {
  return {
    url: document.getElementById('target-url').value || 'https://example.com',
    timeout: document.getElementById('timeout').value || '15000',
    wait: document.getElementById('wait').value || '0',
    custom_ua: document.getElementById('custom-ua').value,
    cookies: document.getElementById('cookies').value,
    page_source: document.getElementById('page-source').checked,
    json_resp: document.getElementById('json-resp').checked,
    render_js: document.getElementById('render-js').checked,
    premium_proxy: document.getElementById('premium-proxy').checked,
    block_ads: document.getElementById('block-ads').checked,
  };
}

function buildApiUrl(p) {
  const params = new URLSearchParams();
  params.set('url', p.url);
  if (p.render_js) params.set('render_js', 'true');
  if (p.premium_proxy) params.set('premium_proxy', 'true');
  if (p.block_ads) params.set('block_ads', 'true');
  if (p.page_source) params.set('return_page_source', 'true');
  if (p.json_resp) params.set('json_response', 'true');
  if (p.timeout !== '15000') params.set('timeout', p.timeout);
  if (p.wait !== '0') params.set('wait', p.wait);
  if (p.custom_ua) params.set('custom_user_agent', p.custom_ua);
  if (p.cookies) params.set('cookies', p.cookies);
  return `${BASE}/api/scrape?${params.toString()}`;
}

function updateCode() {
  const p = getParams();
  const apiUrl = buildApiUrl(p);
  document.getElementById('api-url-display').textContent = apiUrl;

  document.getElementById('curl-text').textContent =
    `curl -X GET \\\n  "${apiUrl}" \\\n  -H "Accept: application/json"`;

  document.getElementById('js-text').textContent =
    `const response = await fetch(\n  "${apiUrl}"\n);\nconst data = await response.json();\nconsole.log(data.title);\nconsole.log(data.links);`;

  document.getElementById('python-text').textContent =
    `import requests\n\nresponse = requests.get(\n  "${apiUrl}"\n)\ndata = response.json()\nprint(data['title'])\nprint(data['links'])`;
}

// Update code on input changes
document.querySelectorAll('input, textarea, select').forEach(el => {
  el.addEventListener('input', updateCode);
  el.addEventListener('change', updateCode);
});
updateCode();

function copyCode(id) {
  const code = document.getElementById(id).querySelector('code').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector(`#${id} .code-btn`);
    const orig = btn.textContent;
    btn.textContent = 'Copiado!';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

function copyApiUrl() {
  const url = document.getElementById('api-url-display').textContent;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('.code-block:last-child .code-btn');
    const orig = btn.textContent;
    btn.textContent = 'Copiado!';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

// ===== SCRAPE =====
async function runScrape() {
  const btn = document.getElementById('scrape-btn');
  const icon = document.getElementById('scrape-icon');
  const txt = document.getElementById('scrape-text');
  btn.disabled = true;
  icon.innerHTML = '<div class="spinner"></div>';
  txt.textContent = 'Scraping...';

  try {
    const p = getParams();
    let headers = {};
    try { headers = JSON.parse(document.getElementById('custom-headers').value || '{}'); } catch {}

    const body = {
      url: p.url,
      timeout: parseInt(p.timeout),
      wait: parseInt(p.wait),
      return_page_source: p.page_source,
      json_response: p.json_resp,
      render_js: p.render_js,
      premium_proxy: p.premium_proxy,
      block_ads: p.block_ads,
    };
    if (p.custom_ua) body.custom_user_agent = p.custom_ua;
    if (p.cookies) body.cookies = p.cookies;
    if (Object.keys(headers).length) body.custom_headers = headers;

    const res = await fetch(`${BASE}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    lastResult = data;
    reqCount++;
    document.getElementById('req-count').textContent = reqCount;
    displayResult(data);
  } catch(e) {
    displayError(e.message);
  } finally {
    btn.disabled = false;
    icon.textContent = '🕷';
    txt.textContent = 'Executar Scraping';
  }
}

function displayResult(data) {
  const panel = document.getElementById('result-panel');
  panel.classList.add('visible');

  const ok = data.success && !data.error;
  document.getElementById('res-dot').className = 'status-dot ' + (ok ? 'status-ok' : 'status-err');
  document.getElementById('res-status').textContent = ok ? '✓ Sucesso' : '✗ Erro: ' + data.error;

  if (data.meta) {
    document.getElementById('res-time').textContent = data.meta.duration_ms + 'ms';
    document.getElementById('res-size').textContent = formatBytes(data.meta.page_size_bytes);
    document.getElementById('res-code').textContent = 'HTTP ' + data.meta.status_code;
  }

  // Overview
  document.getElementById('rt-overview').innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-bottom:1rem;">
      <div style="background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius); padding:12px;">
        <div style="font-size:11px; color:var(--text3); margin-bottom:4px;">Título</div>
        <div style="font-size:14px; font-weight:500;">${esc(data.title || '—')}</div>
      </div>
      <div style="background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius); padding:12px;">
        <div style="font-size:11px; color:var(--text3); margin-bottom:4px;">Content-Type</div>
        <div style="font-size:13px; font-family:var(--mono);">${esc(data.meta?.content_type?.split(';')[0] || '—')}</div>
      </div>
    </div>
    <div style="background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius); padding:12px;">
      <div style="font-size:11px; color:var(--text3); margin-bottom:8px;">Texto extraído (preview)</div>
      <div style="font-size:13px; color:var(--text2); line-height:1.6;">${esc((data.text || '').slice(0,500))}${data.text?.length > 500 ? '...' : ''}</div>
    </div>
  `;

  // Links
  const links = data.links || [];
  document.getElementById('rt-links').innerHTML = links.length ? `
    <div style="font-size:12px; color:var(--text3); margin-bottom:8px;">${links.length} links encontrados</div>
    <table class="data-table">
      <thead><tr><th>Texto</th><th>URL</th></tr></thead>
      <tbody>${links.slice(0,30).map(l => `<tr><td>${esc(l.text?.slice(0,40) || '—')}</td><td style="font-family:var(--mono); font-size:11px; color:var(--text2);">${esc(l.href?.slice(0,60) || '')}${(l.href?.length||0)>60?'...':''}</td></tr>`).join('')}</tbody>
    </table>
  ` : '<p style="color:var(--text3); font-size:13px;">Nenhum link encontrado</p>';

  // Images
  const imgs = data.images || [];
  document.getElementById('rt-images').innerHTML = imgs.length ? `
    <div style="font-size:12px; color:var(--text3); margin-bottom:8px;">${imgs.length} imagens encontradas</div>
    <table class="data-table">
      <thead><tr><th>Alt</th><th>Src</th></tr></thead>
      <tbody>${imgs.slice(0,20).map(i => `<tr><td>${esc(i.alt?.slice(0,40)||'—')}</td><td style="font-family:var(--mono); font-size:11px; color:var(--text2);">${esc(i.src?.slice(0,70)||'')}${(i.src?.length||0)>70?'...':''}</td></tr>`).join('')}</tbody>
    </table>
  ` : '<p style="color:var(--text3); font-size:13px;">Nenhuma imagem encontrada</p>';

  // Meta
  const mt = data.meta_tags || {};
  const mtKeys = Object.keys(mt);
  document.getElementById('rt-meta').innerHTML = mtKeys.length ? `
    <div style="font-size:12px; color:var(--text3); margin-bottom:8px;">${mtKeys.length} meta tags</div>
    <table class="data-table">
      <thead><tr><th>Nome</th><th>Conteúdo</th></tr></thead>
      <tbody>${mtKeys.map(k => `<tr><td style="font-family:var(--mono); font-size:11px; color:var(--accent2);">${esc(k)}</td><td style="font-size:12px; color:var(--text2);">${esc(mt[k]?.slice(0,100)||'')}${(mt[k]?.length||0)>100?'...':''}</td></tr>`).join('')}</tbody>
    </table>
  ` : '<p style="color:var(--text3); font-size:13px;">Nenhuma meta tag encontrada</p>';

  // Raw
  document.getElementById('raw-json').textContent = JSON.stringify(data, null, 2);
  
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displayError(msg) {
  const panel = document.getElementById('result-panel');
  panel.classList.add('visible');
  document.getElementById('res-dot').className = 'status-dot status-err';
  document.getElementById('res-status').textContent = '✗ Erro: ' + msg;
  document.getElementById('rt-overview').innerHTML = `<p style="color:var(--error); font-size:13px;">${esc(msg)}</p>`;
}

// ===== EXTRACT =====
function addSelector(key='', selector='') {
  const list = document.getElementById('selector-list');
  const div = document.createElement('div');
  div.className = 'selector-row';
  div.innerHTML = `
    <div class="field"><label>Nome da chave</label><input type="text" placeholder="prices" value="${esc(key)}"></div>
    <div class="field"><label>Seletor CSS</label><input type="text" placeholder=".price" value="${esc(selector)}"></div>
    <button class="selector-del" onclick="this.closest('.selector-row').remove()">✕</button>
  `;
  list.appendChild(div);
}

function loadExample() {
  document.getElementById('extract-url').value = 'https://quotes.toscrape.com';
  document.getElementById('selector-list').innerHTML = '';
  addSelector('quotes', '.quote .text');
  addSelector('authors', '.author');
  addSelector('tags', '.tag');
}

async function runExtract() {
  const url = document.getElementById('extract-url').value;
  if (!url) return alert('Informe a URL');

  const rows = document.querySelectorAll('#selector-list .selector-row');
  const selectors = {};
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const key = inputs[0].value.trim();
    const sel = inputs[1].value.trim();
    if (key && sel) selectors[key] = sel;
  });

  if (!Object.keys(selectors).length) return alert('Adicione pelo menos um seletor');

  try {
    const res = await fetch(`${BASE}/api/extract`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, selectors }),
    });
    const data = await res.json();
    document.getElementById('extract-result').style.display = 'block';
    document.getElementById('extract-json').textContent = JSON.stringify(data.extracted || data, null, 2);
    reqCount++;
    document.getElementById('req-count').textContent = reqCount;
  } catch(e) {
    alert('Erro: ' + e.message);
  }
}

// ===== BULK =====
function addBulkJob(url='') {
  const list = document.getElementById('bulk-list');
  const div = document.createElement('div');
  div.className = 'job-item';
  div.innerHTML = `
    <input type="url" placeholder="https://example.com" value="${url}" style="font-size:13px;">
    <button class="job-remove" onclick="this.parentNode.remove()">✕</button>
  `;
  list.appendChild(div);
}

function clearBulkJobs() {
  document.getElementById('bulk-list').innerHTML = '';
}

async function runBulk() {
  const inputs = document.querySelectorAll('#bulk-list input');
  const jobs = Array.from(inputs).map(i => i.value).filter(Boolean).map(url => ({ url }));
  if (!jobs.length) return alert('Adicione pelo menos uma URL');

  try {
    const res = await fetch(`${BASE}/api/bulk`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs }),
    });
    const data = await res.json();
    document.getElementById('bulk-result').style.display = 'block';
    document.getElementById('bulk-summary').textContent =
      `${data.success} ok / ${data.failed} falha de ${data.total} total`;

    const rows = document.getElementById('bulk-rows');
    rows.innerHTML = '';
    (data.results || []).forEach(r => {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius); margin-bottom:6px; font-size:13px;';
      div.innerHTML = `
        <span style="color:${r.status==='fulfilled'?'var(--success)':'var(--error)'};">${r.status==='fulfilled'?'✓':'✗'}</span>
        <span style="font-family:var(--mono); color:var(--text2); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(r.url)}</span>
        ${r.data?.meta ? `<span style="font-size:11px; color:var(--text3); font-family:var(--mono);">${r.data.meta.duration_ms}ms</span>` : ''}
        ${r.error ? `<span style="font-size:11px; color:var(--error);">${esc(r.error)}</span>` : ''}
        ${r.data?.title ? `<span style="font-size:12px; color:var(--text2); max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(r.data.title)}</span>` : ''}
      `;
      rows.appendChild(div);
    });
    reqCount += jobs.length;
    document.getElementById('req-count').textContent = reqCount;
  } catch(e) {
    alert('Erro: ' + e.message);
  }
}

// ===== UTILS =====
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + 'KB';
  return (bytes/(1024*1024)).toFixed(2) + 'MB';
}

// Init bulk with 3 empty rows
addBulkJob('https://httpbin.org/get');
addBulkJob('https://httpbin.org/headers');
addBulkJob('https://httpbin.org/ip');

// Init selector
addSelector('title', 'h1');
addSelector('paragraphs', 'p');

// Initial code update
updateCode();
