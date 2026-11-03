/**
 * CF-Server-Monitor widget for Egern
 *
 * Data source: GET /api/servers of CF-Server-Monitor (the same API its dashboard uses)
 * Sizes: small / medium / large / extra large / lock screen circular / rectangular / inline
 *
 * Required env:
 *   CFSM_URL: Dashboard root URL, e.g. https://monitor.example.com
 *
 * Optional env:
 *   POLICY: Egern policy or policy group for the requests, e.g. Proxy
 *   CFSM_TOKEN: Admin JWT for a private site (valid for 7 days)
 *   CFSM_USER / CFSM_PASS: Admin login for a private site; the token is cached and renewed
 *   SERVERS: Only show these servers (names or IDs, comma separated)
 *   SHOW_HIDDEN: Show servers hidden on the dashboard (needs login). Default: false
 *   TITLE: Widget title. Default: CF Monitor
 *   REFRESH_MINUTES: Refresh interval. Default: 15
 *   EXPIRE_WARN_DAYS: Warn when a server expires within this many days. Default: 14
 *   MAX_ROWS: Servers shown in the medium widget. Default: 4
 *
 * Module: egern/yaml/CF_Server_Monitor_Widget.yaml
 * 本地脚本用法：可以直接改下面的 CONFIG（Env 优先）。仓库是公开的，令牌和密码只填在 Egern 的 Env 里，别写进这个文件。
 */

const CONFIG = {
  url: '',            // 必填：面板地址，如 https://monitor.example.com（根地址即可）
  policy: '',         // 请求走的 Egern 策略/策略组名，如 Proxy；*.workers.dev 国内直连不通时填
  token: '',          // 私有站点（二选一）：后台登录得到的 JWT，7 天有效
  username: '',       // 私有站点（二选一）：后台账号 + 密码，脚本自动登录并缓存令牌
  password: '',
  servers: '',        // 只显示部分服务器：名称或 ID，英文逗号分隔；留空显示全部
  showHidden: false,  // 显示后台设为「隐藏」的服务器（需要登录）
  title: 'CF Monitor',
  refreshMinutes: 15, // 期望刷新间隔（分钟），iOS 实际刷新可能更慢
  expireWarnDays: 14, // 剩余天数 ≤ 此值时提醒
  maxRows: 4,         // 中尺寸最多显示几台（建议 ≤ 5）
};

const ONLINE_MS = 300000;                  // 与面板一致：5 分钟无上报视为离线
const TOKEN_MAX_AGE_MS = 6 * 86400000;     // JWT 7 天有效，提前一天换
const REQUEST_TIMEOUT_MS = 10000;          // 最坏情况要连发 3 个请求（取数→登录→再取数），模块 timeout 设 30 秒
const CACHE_KEY = 'cfsm_widget_cache_v1';
const TOKEN_KEY = 'cfsm_widget_token_v1';
const UA = 'Egern-CFSM-Widget/1.0';
const GB = 1024 * 1024 * 1024;

const C = {
  bgTop: { light: '#FFFFFF', dark: '#161B22' },
  bgBottom: { light: '#EEF1F5', dark: '#0D1117' },
  card: { light: '#0000000A', dark: '#FFFFFF0F' },
  fg: { light: '#1F2328', dark: '#E6EDF3' },
  dim: { light: '#59636E', dark: '#8B949E' },
  faint: { light: '#818B98', dark: '#6E7681' },
  track: { light: '#0000001A', dark: '#FFFFFF24' },
  green: { light: '#1A7F37', dark: '#3FB950' },
  amber: { light: '#9A6700', dark: '#D29922' },
  red: { light: '#CF222E', dark: '#F85149' },
  blue: { light: '#0969DA', dark: '#58A6FF' },
  cyan: { light: '#1B7C83', dark: '#39D2C0' },
};
// SVG 里不能写 #（data URI 会被截断），只用 rgb()
const SVG_COLOR = { green: 'rgb(46,160,67)', amber: 'rgb(210,153,34)', red: 'rgb(248,81,73)', dim: 'rgb(139,148,158)' };

const CYCLES = {
  month: { months: 1, label: '月' },
  quarter: { months: 3, label: '季' },
  half_year: { months: 6, label: '半年' },
  year: { months: 12, label: '年' },
  two_years: { months: 24, label: '2年' },
  three_years: { months: 36, label: '3年' },
  four_years: { months: 48, label: '4年' },
  five_years: { months: 60, label: '5年' },
};
const CYCLE_ALIASES = {
  '月': 'month', monthly: 'month', mo: 'month', '季': 'quarter', '季度': 'quarter', quarterly: 'quarter',
  '半年': 'half_year', halfyear: 'half_year', 'half-yearly': 'half_year', '年': 'year', '一年': 'year',
  yearly: 'year', annual: 'year', '两年': 'two_years', '二年': 'two_years', '2 years': 'two_years',
  '三年': 'three_years', '3 years': 'three_years', '四年': 'four_years', '4 years': 'four_years',
  '五年': 'five_years', '5 years': 'five_years',
};
const PING_KEYS = [['ct', '电信'], ['cu', '联通'], ['cm', '移动'], ['bd', 'BGP']];

// ───────────────────────────── 入口 ─────────────────────────────

export default async function (ctx) {
  const family = ctx.widgetFamily || 'systemMedium';
  const cfg = readConfig(ctx);
  const now = Date.now();
  let model;
  try {
    if (!cfg.base) {
      throw new WidgetError('config', '还没填面板地址', '模块 Env 填 CFSM_URL，或改脚本顶部 CONFIG.url');
    }
    const data = await loadServers(ctx, cfg);
    model = buildModel(data, cfg, now, now, false);
    saveCache(ctx, cfg, data, now);
  } catch (e) {
    const err = toWidgetError(e, cfg);
    const canUseCache = err.kind === 'network' || err.kind === 'http' || err.kind === 'format';
    const cached = canUseCache ? readCache(ctx, cfg) : null;
    if (!cached) return errorWidget(family, cfg, err);
    model = buildModel(cached.data, cfg, cached.at, now, true);
  }
  return render(family, model, cfg);
}

// ───────────────────────────── 配置 ─────────────────────────────

function readConfig(ctx) {
  const env = {};
  const rawEnv = ctx.env || {};
  Object.keys(rawEnv).forEach(function (k) { env[k.toLowerCase()] = rawEnv[k]; });
  function pick(keys, fallback) {
    for (let i = 0; i < keys.length; i++) {
      const v = env[keys[i].toLowerCase()];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return fallback;
  }
  return {
    base: normalizeBase(pick(['CFSM_URL', 'URL'], CONFIG.url)),
    policy: String(pick(['POLICY'], CONFIG.policy) || '').trim(),
    token: String(pick(['CFSM_TOKEN', 'TOKEN'], CONFIG.token) || '').trim(),
    username: String(pick(['CFSM_USER', 'CFSM_USERNAME'], CONFIG.username) || '').trim(),
    password: String(pick(['CFSM_PASS', 'CFSM_PASSWORD'], CONFIG.password) || ''),
    servers: splitList(pick(['SERVERS'], CONFIG.servers)),
    showHidden: toBool(pick(['SHOW_HIDDEN'], CONFIG.showHidden)),
    title: String(pick(['TITLE'], CONFIG.title) || 'CF Monitor'),
    refreshMinutes: clampNum(pick(['REFRESH_MINUTES'], CONFIG.refreshMinutes), 5, 720, 15),
    expireWarnDays: clampNum(pick(['EXPIRE_WARN_DAYS'], CONFIG.expireWarnDays), 0, 365, 14),
    maxRows: Math.round(clampNum(pick(['MAX_ROWS'], CONFIG.maxRows), 1, 6, 4)),
  };
}

function normalizeBase(input) {
  let s = String(input || '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  s = s.replace(/[?#].*$/, '');
  s = s.replace(/\/(admin|api)(\/.*)?$/i, '');
  return s.replace(/\/+$/, '');
}

function splitList(v) {
  return String(v || '').split(/[,，\n|]/).map(function (x) { return x.trim(); }).filter(Boolean);
}

function toBool(v) {
  return v === true || /^(1|true|yes|on)$/i.test(String(v || '').trim());
}

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// ───────────────────────────── 网络 ─────────────────────────────

function WidgetError(kind, title, hint) {
  this.kind = kind;
  this.title = title;
  this.hint = hint || '';
  this.message = title;
}

function toWidgetError(e, cfg) {
  if (e instanceof WidgetError) return e;
  const msg = String((e && e.message) || e || '未知错误').slice(0, 80);
  const hint = cfg.policy
    ? '检查策略「' + cfg.policy + '」是否可用。' + msg
    : '国内直连 *.workers.dev 不通：绑自定义域名，或在 POLICY 填代理策略。' + msg;
  return new WidgetError('network', '连不上面板', hint);
}

function reqOptions(cfg, extra) {
  const o = { timeout: REQUEST_TIMEOUT_MS };
  Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
  if (cfg.policy) o.policy = cfg.policy;
  return o;
}

async function loadServers(ctx, cfg) {
  const hasCreds = !!(cfg.username && cfg.password);
  let token = cfg.token || storedToken(ctx, cfg);
  if (!token && hasCreds && cfg.showHidden) token = await login(ctx, cfg);

  let res = await getServers(ctx, cfg, token);
  if (res.status === 401) {
    clearStoredToken(ctx);
    if (!hasCreds) {
      throw new WidgetError('auth', token ? '登录令牌已失效' : '站点是私有的，需要登录',
        '填 CFSM_TOKEN，或填 CFSM_USER + CFSM_PASS 让脚本自动登录');
    }
    token = await login(ctx, cfg);
    res = await getServers(ctx, cfg, token);
    if (res.status === 401) throw new WidgetError('auth', '登录后仍被拒绝', '检查后台账号密码');
  }
  return parseServers(res);
}

async function getServers(ctx, cfg, token) {
  const headers = { Accept: 'application/json', 'User-Agent': UA };
  if (token) headers.Authorization = 'Bearer ' + token;
  const resp = await ctx.http.get(cfg.base + '/api/servers', reqOptions(cfg, { headers: headers }));
  return { status: resp.status, text: await resp.text() };
}

function parseServers(res) {
  if (res.status === 403) {
    throw new WidgetError('blocked', '请求被拦截 (403)',
      '后台关掉全局 Turnstile，或在 Cloudflare WAF 里放行 /api/servers');
  }
  if (res.status >= 400) throw new WidgetError('http', 'HTTP ' + res.status, briefError(res.text));
  let data;
  try {
    data = JSON.parse(res.text);
  } catch (e) {
    throw new WidgetError('format', '返回的不是 JSON', '地址可能填错，或请求被 Cloudflare 质询页拦截');
  }
  if (!data || !Array.isArray(data.servers)) {
    throw new WidgetError('format', '接口格式不对', '确认填的是 CF-Server-Monitor 的地址');
  }
  return data;
}

async function login(ctx, cfg) {
  const resp = await ctx.http.post(cfg.base + '/admin/api', reqOptions(cfg, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': UA },
    body: { action: 'login', username: cfg.username, password: cfg.password },
  }));
  const text = await resp.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { data = null; }
  if (resp.status === 403) {
    throw new WidgetError('auth', '自动登录被拦截', '后台开了登录 Turnstile，脚本过不了人机验证，改填 CFSM_TOKEN');
  }
  if (resp.status === 401) throw new WidgetError('auth', '账号或密码错误', '检查 CFSM_USER / CFSM_PASS');
  if (!data || !data.token) {
    throw new WidgetError('auth', '登录失败 (HTTP ' + resp.status + ')', briefError(text));
  }
  storeToken(ctx, cfg, data.token);
  return data.token;
}

function briefError(text) {
  try {
    const d = JSON.parse(text);
    if (d && (d.error || d.message)) return String(d.error || d.message).slice(0, 80);
  } catch (e) { /* 不是 JSON */ }
  return String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

// ───────────────────────────── 存储 ─────────────────────────────

function storedToken(ctx, cfg) {
  try {
    const t = ctx.storage.getJSON(TOKEN_KEY);
    if (t && t.token && t.base === cfg.base && Date.now() - t.at < TOKEN_MAX_AGE_MS) return t.token;
  } catch (e) { /* 忽略 */ }
  return '';
}

function storeToken(ctx, cfg, token) {
  try { ctx.storage.setJSON(TOKEN_KEY, { token: token, base: cfg.base, at: Date.now() }); } catch (e) { /* 忽略 */ }
}

function clearStoredToken(ctx) {
  try { ctx.storage.delete(TOKEN_KEY); } catch (e) { /* 忽略 */ }
}

const SLIM_FIELDS = ['id', 'name', 'region', 'is_hidden', 'cpu', 'ram_used', 'ram_total', 'disk_used', 'disk_total',
  'net_in_speed', 'net_out_speed', 'net_rx_monthly', 'net_tx_monthly', 'traffic_limit', 'traffic_calc_type',
  'reset_day', 'expire_date', 'billing_cycle', 'auto_renewal', 'price', 'currency', 'boot_time', 'last_updated',
  'ping_ct', 'ping_cu', 'ping_cm', 'ping_bd'];

function saveCache(ctx, cfg, data, at) {
  try {
    const servers = data.servers.map(function (s) {
      const o = {};
      SLIM_FIELDS.forEach(function (k) { if (s[k] !== undefined) o[k] = s[k]; });
      return o;
    });
    const sys = data.sysConfig || {};
    ctx.storage.setJSON(CACHE_KEY, {
      at: at,
      base: cfg.base,
      data: {
        servers: servers,
        sysConfig: {
          custom_ct_name: sys.custom_ct_name, custom_cu_name: sys.custom_cu_name,
          custom_cm_name: sys.custom_cm_name, custom_bd_name: sys.custom_bd_name,
        },
      },
    });
  } catch (e) { /* 忽略 */ }
}

function readCache(ctx, cfg) {
  try {
    const c = ctx.storage.getJSON(CACHE_KEY);
    if (c && c.base === cfg.base && c.data && Array.isArray(c.data.servers)) return c;
  } catch (e) { /* 忽略 */ }
  return null;
}

// ───────────────────────────── 数据整理 ─────────────────────────────

function buildModel(data, cfg, fetchedAt, now, stale) {
  const sys = data.sysConfig || {};
  const names = {
    ct: sys.custom_ct_name || '电信', cu: sys.custom_cu_name || '联通',
    cm: sys.custom_cm_name || '移动', bd: sys.custom_bd_name || 'BGP',
  };
  let list = data.servers.filter(function (s) { return s && (cfg.showHidden || !isFlag(s.is_hidden)); });
  if (cfg.servers.length) {
    const want = cfg.servers.map(function (x) { return x.toLowerCase(); });
    list = list.filter(function (s) {
      return want.indexOf(String(s.id || '').toLowerCase()) >= 0 || want.indexOf(String(s.name || '').toLowerCase()) >= 0;
    });
  }
  const servers = list.map(function (s) { return normalizeServer(s, names, cfg, fetchedAt, now); });
  const online = servers.filter(function (s) { return s.online; });
  const limited = servers.filter(function (s) { return s.limitBytes > 0; });
  const stats = {
    total: servers.length,
    online: online.length,
    offline: servers.length - online.length,
    speedIn: sum(online, 'speedIn'),
    speedOut: sum(online, 'speedOut'),
    used: sum(servers, 'usedBytes'),
    maxTrafficPct: limited.length ? Math.max.apply(null, limited.map(function (s) { return s.trafficPct; })) : null,
  };
  const expiring = servers
    .filter(function (s) { return s.expiry && s.expiry.days <= cfg.expireWarnDays; })
    .sort(function (a, b) { return a.expiry.days - b.expiry.days; });
  return {
    servers: servers,
    stats: stats,
    expiring: expiring,
    offlineList: servers.filter(function (s) { return !s.online; }),
    fetchedAt: fetchedAt,
    stale: stale,
  };
}

function normalizeServer(s, names, cfg, fetchedAt, now) {
  const last = toMs(s.last_updated);
  const online = last > 0 && fetchedAt - last < ONLINE_MS;
  const usedBytes = trafficUsed(s);
  const limitBytes = parseLimit(s.traffic_limit);
  const pings = pingList(s, names);
  const ms = pings.filter(function (p) { return p.ms !== null; }).map(function (p) { return p.ms; });
  const boot = toMs(s.boot_time);
  return {
    id: String(s.id || ''),
    name: String(s.name || s.id || '未命名'),
    region: regionCode(s.region),
    online: online,
    offlineFor: last > 0 ? Math.max(0, fetchedAt - last) : null,
    cpu: pctValue(s.cpu),
    mem: ratioPct(s.ram_used, s.ram_total),
    disk: ratioPct(s.disk_used, s.disk_total),
    speedIn: num(s.net_in_speed),
    speedOut: num(s.net_out_speed),
    usedBytes: usedBytes,
    limitBytes: limitBytes,
    trafficPct: limitBytes > 0 ? (usedBytes / limitBytes) * 100 : null,
    forecast: trafficForecast(usedBytes, limitBytes, s.reset_day, now),
    pings: pings,
    avgPing: ms.length ? ms.reduce(function (a, b) { return a + b; }, 0) / ms.length : null,
    uptimeMs: online && boot > 0 ? Math.max(0, fetchedAt - boot) : 0,
    expiry: expiryInfo(s, now),
    price: priceText(s),
    url: cfg.base + '/#/server/' + encodeURIComponent(String(s.id || '')),
  };
}

function sum(list, key) {
  return list.reduce(function (a, s) { return a + (Number(s[key]) || 0); }, 0);
}

function num(v) {
  const n = Number(v);
  return isFinite(n) && n > 0 ? n : 0;
}

function isFlag(v) {
  return v === true || v === 1 || v === '1' || v === 'true';
}

function toMs(v) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return 0;
  return n < 10000000000 ? n * 1000 : n;
}

function pctValue(v) {
  const n = Number(v);
  return isFinite(n) ? Math.max(0, n) : null;
}

function ratioPct(used, total) {
  const u = Number(used), t = Number(total);
  return isFinite(u) && isFinite(t) && t > 0 ? Math.max(0, (u / t) * 100) : null;
}

function regionCode(v) {
  const s = String(v || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(s) && s !== 'XX' ? s : '';
}

function trafficUsed(s) {
  const rx = Number(s.net_rx_monthly) || 0;
  const tx = Number(s.net_tx_monthly) || 0;
  switch (s.traffic_calc_type) {
    case 'dl': return rx;
    case 'ul': return tx;
    case 'max': return Math.max(rx, tx);
    default: return rx + tx;
  }
}

// 后台按 GB 填数字；兼容旧数据里的 "1TB" / "500GB" 写法
function parseLimit(v) {
  const raw = String(v === undefined || v === null ? '' : v).trim().toUpperCase();
  const n = parseFloat(raw);
  if (!isFinite(n) || n <= 0) return 0;
  if (/T/.test(raw)) return n * 1024 * GB;
  if (/M/.test(raw)) return (n * GB) / 1024;
  return n * GB;
}

// 按本周期日均用量估算：在下次重置前用完才返回提醒
function trafficForecast(used, limit, resetDay, now) {
  if (!(limit > 0) || !(used > 0)) return null;
  if (used >= limit) return { exhausted: true };
  const rd = Math.round(Number(resetDay) || 0);
  if (rd <= 0) return null;
  const d = new Date(now);
  const dayIn = function (y, m) { return Math.min(rd, new Date(y, m + 1, 0).getDate()); };
  let start = new Date(d.getFullYear(), d.getMonth(), dayIn(d.getFullYear(), d.getMonth()));
  if (start.getTime() > now) start = new Date(d.getFullYear(), d.getMonth() - 1, dayIn(d.getFullYear(), d.getMonth() - 1));
  const next = new Date(start.getFullYear(), start.getMonth() + 1, dayIn(start.getFullYear(), start.getMonth() + 1));
  const elapsedDays = (now - start.getTime()) / 86400000;
  if (elapsedDays < 2) return null; // 周期刚开始，样本太少不预测
  const daysLeft = (limit - used) / (used / elapsedDays);
  const daysToReset = (next.getTime() - now) / 86400000;
  return daysLeft < daysToReset ? { days: Math.max(0, Math.floor(daysLeft)) } : null;
}

function pingList(s, names) {
  const out = [];
  PING_KEYS.forEach(function (pair) {
    const v = s['ping_' + pair[0]];
    if (v === undefined || v === false || v === 'false' || v === '') return;
    const name = names[pair[0]] || pair[1];
    if (v === null) { out.push({ name: name, ms: null }); return; }
    const n = Number(v);
    if (isFinite(n) && n > 0) out.push({ name: name, ms: n });
  });
  return out;
}

function normalizeCycle(v) {
  const raw = String(v || '').trim();
  if (CYCLES[raw]) return raw;
  return CYCLE_ALIASES[raw.toLowerCase()] || 'month';
}

function expiryInfo(s, now) {
  let d = String(s.expire_date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  if (isFlag(s.auto_renewal)) {
    const months = CYCLES[normalizeCycle(s.billing_cycle)].months;
    const today = isoDate(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth() + 1, new Date(now).getUTCDate());
    let guard = 0;
    while (d <= today && guard < 1200) { d = addMonths(d, months); guard++; }
  }
  const p = d.split('-').map(Number);
  const t = Date.UTC(p[0], p[1] - 1, p[2]);
  if (!isFinite(t)) return null;
  return { date: d, days: Math.ceil((t - now) / 86400000) };
}

function addMonths(dateStr, months) {
  const p = dateStr.split('-').map(Number);
  const zm = p[1] - 1 + months;
  const y = p[0] + Math.floor(zm / 12);
  const m = ((zm % 12) + 12) % 12 + 1;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return isoDate(y, m, Math.min(p[2], dim));
}

function isoDate(y, m, d) {
  return String(y).padStart(4, '0') + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

function priceText(s) {
  const raw = String(s.price === undefined || s.price === null ? '' : s.price).trim();
  const m = raw.match(/-?[\d.,]+/);
  if (!m) return '';
  const n = parseFloat(m[0].replace(/,/g, ''));
  if (!isFinite(n) || (n < 0 && n !== -1)) return '';
  if (n === -1 || n === 0) return '免费';
  const cur = String(s.currency || '').trim() || (raw.match(/[¥￥$€£₽₣₹₫฿]/) || [''])[0].replace('￥', '¥');
  return cur + (n % 1 === 0 ? String(n) : n.toFixed(2)) + '/' + CYCLES[normalizeCycle(s.billing_cycle)].label;
}

// ───────────────────────────── 文本格式 ─────────────────────────────

function fmtBytes(n) {
  let v = Math.max(0, Number(n) || 0);
  const units = ['B', 'K', 'M', 'G', 'T', 'P'];
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  const s = v >= 100 || i === 0 ? String(Math.round(v)) : v.toFixed(1).replace(/\.0$/, '');
  return s + units[i];
}

function fmtSpeed(n) { return fmtBytes(n) + '/s'; }

function fmtDuration(ms) {
  const m = Math.max(0, ms) / 60000;
  if (m >= 1440) return Math.floor(m / 1440) + '天';
  if (m >= 60) return Math.floor(m / 60) + '小时';
  return Math.max(1, Math.floor(m)) + '分钟';
}

function fmtPct(p) { return Math.round(p) + '%'; }

function hhmm(ts) {
  const d = new Date(ts);
  const p2 = function (n) { return String(n).padStart(2, '0'); };
  const t = p2(d.getHours()) + ':' + p2(d.getMinutes());
  return Date.now() - ts > 20 * 3600000 ? p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + t : t;
}

function timeLabel(m) { return (m.stale ? '缓存 ' : '') + hhmm(m.fetchedAt); }

function offlineText(s) { return s.offlineFor === null ? '未上报' : '离线 ' + fmtDuration(s.offlineFor); }

function expiryText(days) {
  if (days < 0) return '已过期';
  if (days === 0) return '今天到期';
  return days + '天后到期';
}

function expiryColor(days, cfg) {
  if (days <= 3) return C.red;
  if (days <= cfg.expireWarnDays) return C.amber;
  return C.dim;
}

function usageColor(p) {
  if (p === null || p === undefined) return C.faint;
  return p < 60 ? C.green : p < 85 ? C.amber : C.red;
}

function statusKey(st) {
  if (!st.total) return 'dim';
  if (!st.offline) return 'green';
  return st.online ? 'amber' : 'red';
}

function trafficSummary(st) {
  let t = '本月 ' + fmtBytes(st.used);
  if (st.maxTrafficPct !== null) t += ' · 最高 ' + fmtPct(st.maxTrafficPct);
  return t;
}

function pingText(s) {
  return s.pings.map(function (p) { return p.name + ' ' + (p.ms === null ? '超时' : Math.round(p.ms) + 'ms'); }).join(' · ');
}

// ───────────────────────────── DSL 小工具 ─────────────────────────────

function F(size, weight) { return weight ? { size: size, weight: weight } : { size: size }; }

function T(str, font, color, extra) {
  const el = { type: 'text', text: String(str), font: font, maxLines: 1 };
  if (color) el.textColor = color;
  return Object.assign(el, extra || {});
}

function row(children, extra) {
  return Object.assign({ type: 'stack', direction: 'row', alignItems: 'center', children: children }, extra || {});
}

function col(children, extra) {
  return Object.assign({ type: 'stack', direction: 'column', alignItems: 'start', children: children }, extra || {});
}

function spacer(length) { return length === undefined ? { type: 'spacer' } : { type: 'spacer', length: length }; }

function icon(name, size, color) {
  const el = { type: 'image', src: 'sf-symbol:' + name, width: size, height: size };
  if (color) el.color = color;
  return el;
}

function dot(color, size) { return icon('circle.fill', size || 7, color); }

// 固定宽度的单元格，文字靠右（或靠左）
function cell(el, width, align) {
  return { type: 'stack', direction: 'row', width: width, children: align === 'left' ? [el, spacer()] : [spacer(), el] };
}

// 进度条：外层是轨道，里面两段按 flex 比例分（不依赖屏幕宽度）
function bar(pct, color, opts) {
  const h = (opts && opts.height) || 4;
  const p = Math.min(1, Math.max(0, (Number(pct) || 0) / 100));
  const fill = Math.round(p * 1000);
  const children = [];
  if (fill > 0) children.push({ type: 'stack', flex: fill >= 1000 ? 1 : fill, height: h, backgroundColor: color, borderRadius: h / 2, children: [] });
  if (fill < 1000) children.push({ type: 'stack', flex: fill <= 0 ? 1 : 1000 - fill, height: h, children: [] });
  const el = { type: 'stack', direction: 'row', height: h, backgroundColor: C.track, borderRadius: h / 2, children: children };
  if (opts && opts.width) el.width = opts.width; else el.flex = 1;
  return el;
}

// 圆环（SVG），起点在 12 点方向
function ringSvg(ratio, color, track, stroke) {
  const r = 40;
  const p = Math.min(1, Math.max(0, ratio));
  let arc = '';
  if (p >= 0.999) {
    arc = "<circle cx='50' cy='50' r='40' fill='none' stroke='" + color + "' stroke-width='" + stroke + "'/>";
  } else if (p > 0.001) {
    const a = 2 * Math.PI * p;
    const x = (50 + r * Math.sin(a)).toFixed(2);
    const y = (50 - r * Math.cos(a)).toFixed(2);
    arc = "<path d='M 50 10 A 40 40 0 " + (p > 0.5 ? 1 : 0) + " 1 " + x + ' ' + y + "' fill='none' stroke='" + color +
      "' stroke-width='" + stroke + "' stroke-linecap='round'/>";
  }
  return "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
    "<circle cx='50' cy='50' r='40' fill='none' stroke='" + track + "' stroke-width='" + stroke + "'/>" + arc + '</svg>';
}

function refreshAt(minutes) { return new Date(Date.now() + minutes * 60000).toISOString(); }

function systemRoot(children, cfg, layout, refreshIso) {
  const w = {
    type: 'widget',
    backgroundGradient: { type: 'linear', colors: [C.bgTop, C.bgBottom], startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 1 } },
    padding: layout.padding,
    gap: layout.gap,
    refreshAfter: refreshIso || refreshAt(cfg.refreshMinutes),
    children: children,
  };
  if (cfg.base) w.url = cfg.base;
  return w;
}

function accessoryRoot(children, cfg, extra, refreshIso) {
  const w = Object.assign({ type: 'widget', refreshAfter: refreshIso || refreshAt(cfg.refreshMinutes), children: children }, extra || {});
  if (cfg.base) w.url = cfg.base;
  return w;
}

// ───────────────────────────── 渲染 ─────────────────────────────

function render(family, m, cfg) {
  switch (family) {
    case 'accessoryInline': return inlineWidget(m, cfg);
    case 'accessoryCircular': return circularWidget(m, cfg);
    case 'accessoryRectangular': return rectangularWidget(m, cfg);
    case 'systemSmall': return smallWidget(m, cfg);
    case 'systemLarge':
    case 'systemExtraLarge': return largeWidget(m, cfg);
    default: return mediumWidget(m, cfg);
  }
}

function headerRow(m, cfg, big) {
  const st = m.stats;
  return row([
    icon('server.rack', big ? 13 : 11, C.blue),
    T(cfg.title, F(big ? 15 : 13, 'bold'), C.fg, { minScale: 0.7 }),
    T(st.online + '/' + st.total, F(big ? 13 : 12, 'bold'), C[statusKey(st)]),
    T('在线', F(big ? 11 : 10, 'medium'), C.dim),
    spacer(),
    T(timeLabel(m), F(big ? 10 : 9, 'medium'), m.stale ? C.amber : C.faint),
  ], { gap: 4 });
}

// 小号只放一个标题和时间
function smallHeader(m, cfg) {
  return row([
    icon('server.rack', 11, C.blue),
    T(cfg.title, F(12, 'bold'), C.fg, { minScale: 0.6 }),
    spacer(),
    T(timeLabel(m), F(9, 'medium'), m.stale ? C.amber : C.faint),
  ], { gap: 4 });
}

function alertText(m, cfg) {
  if (!m.stats.total) return { text: '没有匹配的服务器', color: C.dim };
  if (m.offlineList.length) {
    const n = m.offlineList.length;
    return { text: '✕ ' + (n === 1 ? m.offlineList[0].name + ' 离线' : n + ' 台离线'), color: C.red };
  }
  if (m.expiring.length) {
    const e = m.expiring[0];
    const text = m.expiring.length === 1 ? e.name + ' ' + expiryText(e.expiry.days) : m.expiring.length + ' 台 ' + cfg.expireWarnDays + ' 天内到期';
    return { text: '⚠ ' + text, color: e.expiry.days <= 3 ? C.red : C.amber };
  }
  return { text: '✓ 全部在线', color: C.green };
}

function smallWidget(m, cfg) {
  const st = m.stats;
  const key = statusKey(st);
  const ring = {
    type: 'stack', direction: 'column', alignItems: 'center', width: 58, height: 58,
    backgroundImage: ringSvg(st.total ? st.online / st.total : 0, SVG_COLOR[key], 'rgba(139,148,158,0.28)', 9),
    children: [
      spacer(),
      T(st.online + '/' + st.total, F(st.total >= 10 ? 14 : 17, 'bold'), C.fg, { minScale: 0.6 }),
      T('在线', F(9, 'medium'), C.dim),
      spacer(),
    ],
  };
  const speeds = col([
    row([icon('arrow.down', 9, C.cyan), T(fmtSpeed(st.speedIn), F(12, 'semibold'), C.fg, { minScale: 0.6 })], { gap: 3 }),
    row([icon('arrow.up', 9, C.blue), T(fmtSpeed(st.speedOut), F(12, 'semibold'), C.fg, { minScale: 0.6 })], { gap: 3 }),
  ], { gap: 6 });
  const a = alertText(m, cfg);
  return systemRoot([
    smallHeader(m, cfg),
    row([ring, speeds], { gap: 10 }),
    spacer(),
    T(trafficSummary(st), F(10, 'medium'), C.dim, { minScale: 0.7 }),
    T(a.text, F(11, 'semibold'), a.color, { minScale: 0.7 }),
  ], cfg, { padding: [12, 13, 12, 13], gap: 5 });
}

// 中号 / 大号（8 台以上）用的一行一台
const W_REGION = 20, W_CPU = 32, W_MEM = 32, W_TRAFFIC = 64;

function columnLabels() {
  return row([
    spacer(),
    cell(T('CPU', F(9, 'medium'), C.faint), W_CPU),
    cell(T('内存', F(9, 'medium'), C.faint), W_MEM),
    cell(T('本月流量', F(9, 'medium'), C.faint), W_TRAFFIC),
  ], { gap: 5 });
}

function pctCell(p, width) {
  if (p === null || p === undefined) return cell(T('—', F(10), C.faint), width);
  return cell(T(fmtPct(p), F(11, 'medium'), usageColor(p)), width);
}

function trafficCell(s) {
  if (s.limitBytes > 0) {
    const p = s.trafficPct;
    return row([
      bar(p, usageColor(p), { width: 26, height: 4 }),
      spacer(),
      T(fmtPct(p), F(10, 'medium'), usageColor(p)),
    ], { width: W_TRAFFIC, gap: 4 });
  }
  return cell(T(fmtBytes(s.usedBytes), F(10, 'medium'), C.dim), W_TRAFFIC);
}

function compactRow(s) {
  return row([
    dot(s.online ? C.green : C.red, 6),
    T(s.name, F(12, 'semibold'), s.online ? C.fg : C.dim, { minScale: 0.7 }),
    spacer(),
    cell(T(s.region, F(9, 'medium'), C.faint), W_REGION),
    s.online ? pctCell(s.cpu, W_CPU) : cell(T('离线', F(10, 'semibold'), C.red), W_CPU),
    s.online ? pctCell(s.mem, W_MEM) : cell(T('—', F(10), C.faint), W_MEM),
    trafficCell(s),
  ], { gap: 5, url: s.url });
}

function footerText(m, cfg, shown, includeExpiry) {
  const parts = [];
  if (includeExpiry && m.expiring.length) {
    parts.push('⚠ ' + m.expiring.slice(0, 2).map(function (s) { return s.name + ' ' + expiryText(s.expiry.days); }).join('，'));
  }
  if (m.servers.length > shown) parts.push('另有 ' + (m.servers.length - shown) + ' 台');
  if (!parts.length) return null;
  const color = includeExpiry && m.expiring.length ? (m.expiring[0].expiry.days <= 3 ? C.red : C.amber) : C.faint;
  return T(parts.join(' · '), F(9, 'medium'), color, { minScale: 0.7 });
}

function mediumWidget(m, cfg) {
  const children = [headerRow(m, cfg, false)];
  if (!m.servers.length) {
    children.push(T('没有匹配的服务器，检查 SERVERS 设置', F(12), C.dim, { maxLines: 2 }));
  } else {
    const shown = m.servers.slice(0, cfg.maxRows);
    children.push(columnLabels());
    shown.forEach(function (s) { children.push(compactRow(s)); });
    children.push(spacer());
    const f = footerText(m, cfg, shown.length, true);
    if (f) children.push(f);
  }
  return systemRoot(children, cfg, { padding: [12, 14, 12, 14], gap: 4 });
}

function meter(label, pct, live) {
  const has = live && pct !== null && pct !== undefined;
  return row([
    T(label, F(9, 'medium'), C.dim),
    bar(has ? pct : 0, usageColor(pct), { height: 4 }),
    T(has ? fmtPct(pct) : '—', F(9, 'semibold'), has ? usageColor(pct) : C.faint),
  ], { gap: 4, flex: 1 });
}

function trafficMeter(s) {
  if (s.limitBytes > 0) return meter('流量', s.trafficPct, true);
  return row([T('流量', F(9, 'medium'), C.dim), spacer(), T(fmtBytes(s.usedBytes), F(9, 'semibold'), C.dim)], { gap: 4, flex: 1 });
}

function speedOrOffline(s, size) {
  return s.online
    ? T('↓' + fmtSpeed(s.speedIn) + '  ↑' + fmtSpeed(s.speedOut), F(size, 'medium'), C.dim, { minScale: 0.7 })
    : T(offlineText(s), F(size, 'semibold'), C.red);
}

function trafficLine(s) {
  if (s.limitBytes > 0) {
    const p = s.trafficPct;
    const items = [
      T('流量', F(9, 'medium'), C.dim),
      bar(p, usageColor(p), { height: 5 }),
      T(fmtBytes(s.usedBytes) + ' / ' + fmtBytes(s.limitBytes), F(10, 'medium'), C.fg),
    ];
    if (s.forecast) {
      items.push(T(s.forecast.exhausted ? '已超额' : '约' + s.forecast.days + '天用完', F(9, 'semibold'), s.forecast.exhausted ? C.red : C.amber));
    }
    return row(items, { gap: 6 });
  }
  return row([
    T('流量', F(9, 'medium'), C.dim),
    T('本月 ' + fmtBytes(s.usedBytes) + ' · 未设限额', F(10, 'medium'), C.fg),
    spacer(),
  ], { gap: 6 });
}

function detailCard(s, cfg) {
  const uptime = s.uptimeMs ? '运行 ' + fmtDuration(s.uptimeMs) : '';
  let left = pingText(s);
  let right = { text: uptime, color: C.dim };
  if (s.expiry) {
    right = { text: expiryText(s.expiry.days) + (s.price ? ' · ' + s.price : ''), color: expiryColor(s.expiry.days, cfg) };
    if (!left) left = uptime;
  }
  const head = [dot(s.online ? C.green : C.red, 7), T(s.name, F(13, 'semibold'), s.online ? C.fg : C.dim, { minScale: 0.7 })];
  if (s.region) head.push(T(s.region, F(9, 'semibold'), C.faint));
  head.push(spacer(), speedOrOffline(s, 10));
  return col([
    row(head, { gap: 5 }),
    row([meter('CPU', s.cpu, s.online), meter('内存', s.mem, s.online), meter('磁盘', s.disk, true)], { gap: 10 }),
    trafficLine(s),
    row([
      T(left, F(10), C.dim, { minScale: 0.7 }),
      spacer(),
      T(right.text, F(10, 'medium'), right.color, { minScale: 0.7 }),
    ], { gap: 6 }),
  ], { gap: 4, padding: [6, 10, 6, 10], backgroundColor: C.card, borderRadius: 12, url: s.url });
}

function twoLineRow(s, cfg) {
  const top = [dot(s.online ? C.green : C.red, 6), T(s.name, F(12, 'semibold'), s.online ? C.fg : C.dim, { minScale: 0.7 })];
  if (s.region) top.push(T(s.region, F(9, 'semibold'), C.faint));
  top.push(spacer());
  if (s.expiry && s.expiry.days <= cfg.expireWarnDays) {
    top.push(T(expiryText(s.expiry.days), F(9, 'semibold'), expiryColor(s.expiry.days, cfg)));
  }
  top.push(speedOrOffline(s, 9));
  return col([
    row(top, { gap: 5 }),
    row([meter('CPU', s.cpu, s.online), meter('内存', s.mem, s.online), meter('磁盘', s.disk, true), trafficMeter(s)], { gap: 8 }),
  ], { gap: 4, url: s.url });
}

function largeWidget(m, cfg) {
  const st = m.stats;
  const n = m.servers.length;
  const children = [
    headerRow(m, cfg, true),
    row([
      icon('arrow.down', 9, C.cyan), T(fmtSpeed(st.speedIn), F(11, 'semibold'), C.fg),
      icon('arrow.up', 9, C.blue), T(fmtSpeed(st.speedOut), F(11, 'semibold'), C.fg),
      spacer(),
      T(trafficSummary(st), F(11, 'medium'), C.dim, { minScale: 0.7 }),
    ], { gap: 4 }),
  ];
  let gap = 6;
  let shown = n;
  if (!n) {
    children.push(T('没有匹配的服务器，检查 SERVERS 设置', F(12), C.dim, { maxLines: 2 }));
  } else if (n <= 3) {
    m.servers.forEach(function (s) { children.push(detailCard(s, cfg)); });
  } else if (n <= 7) {
    gap = 7;
    m.servers.forEach(function (s) { children.push(twoLineRow(s, cfg)); });
  } else {
    gap = 5;
    shown = Math.min(n, 11);
    children.push(columnLabels());
    m.servers.slice(0, shown).forEach(function (s) { children.push(compactRow(s)); });
  }
  children.push(spacer());
  const f = footerText(m, cfg, shown, n > 3);
  if (f) children.push(f);
  return systemRoot(children, cfg, { padding: 14, gap: gap });
}

function circularWidget(m, cfg) {
  const st = m.stats;
  return accessoryRoot([{
    type: 'stack', direction: 'column', alignItems: 'center', flex: 1,
    backgroundImage: ringSvg(st.total ? st.online / st.total : 0, 'rgb(255,255,255)', 'rgba(255,255,255,0.3)', 10),
    children: [
      spacer(),
      row([spacer(), T(st.online + '/' + st.total, F(st.total >= 10 ? 13 : 16, 'bold'), null, { minScale: 0.6 }), spacer()]),
      row([spacer(), T('在线', F(8, 'medium'), null), spacer()]),
      spacer(),
    ],
  }], cfg, { padding: 0 });
}

function rectangularWidget(m, cfg) {
  const st = m.stats;
  const a = alertText(m, cfg);
  let third = a.text;
  if (a.color === C.green) third = trafficSummary(st);
  return accessoryRoot([
    row([icon('server.rack', 12, null), T(st.online + '/' + st.total + ' 在线', F(14, 'bold'), null)], { gap: 4 }),
    T('↓' + fmtSpeed(st.speedIn) + '  ↑' + fmtSpeed(st.speedOut), F(12, 'medium'), null, { minScale: 0.7 }),
    T(third, F(12), null, { minScale: 0.7 }),
  ], cfg, { gap: 1 });
}

function inlineWidget(m, cfg) {
  const st = m.stats;
  let s = st.online + '/' + st.total + ' 在线';
  if (m.offlineList.length) s += ' · ' + m.offlineList[0].name + ' 离线';
  else s += ' ↓' + fmtSpeed(st.speedIn) + ' ↑' + fmtSpeed(st.speedOut);
  return accessoryRoot([T(s, F(12), null)], cfg);
}

function errorWidget(family, cfg, err) {
  const retry = refreshAt(Math.min(cfg.refreshMinutes, 10));
  if (family === 'accessoryInline') return accessoryRoot([T('CFSM ' + err.title, F(12), null)], cfg, null, retry);
  if (family === 'accessoryCircular') {
    return accessoryRoot([
      spacer(),
      row([spacer(), icon('exclamationmark.triangle', 22, null), spacer()]),
      spacer(),
    ], cfg, { padding: 0 }, retry);
  }
  if (family === 'accessoryRectangular') {
    return accessoryRoot([
      T(cfg.title, F(13, 'bold'), null),
      T(err.title, F(12), null, { maxLines: 2, minScale: 0.7 }),
    ], cfg, { gap: 2 }, retry);
  }
  return systemRoot([
    row([icon('exclamationmark.triangle.fill', 13, C.amber), T(cfg.title, F(13, 'bold'), C.fg)], { gap: 5 }),
    T(err.title, F(13, 'semibold'), C.red, { maxLines: 2, minScale: 0.8 }),
    T(err.hint, F(11), C.dim, { maxLines: family === 'systemSmall' ? 5 : 4, minScale: 0.8 }),
    spacer(),
  ], cfg, { padding: 14, gap: 6 }, retry);
}
