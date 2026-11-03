/**
 * 流媒体与 AI 解锁检测 · Egern 小组件
 *
 * 检测：YouTube Premium、Netflix、Disney+、ChatGPT、Claude、Gemini
 * 尺寸：小 / 中 / 大 / 超大 / 锁屏圆形 / 锁屏矩形 / 锁屏单行
 *
 * 判定方法参考 RegionRestrictionCheck（1-stream 维护版）的现行做法，并对照各家官方支持地区：
 *   YouTube  Premium 页面里的地区和购买入口
 *   Netflix  两部非自制剧的页面是否有 og:video：都没有 = 只能看自制剧
 *   Disney+  官方设备接口返回的 countryCode / inSupportedLocation，再看首页是否跳到 unavailable
 *   ChatGPT  api.openai.com 合规接口 + ios.chat.openai.com 拦截页（地区封锁 / 机房 IP 只能用网页）
 *   Claude   claude.ai 是否跳到 app-unavailable-in-region
 *   Gemini   页面可用标记和国家代码
 *
 * 分流：默认不指定策略，每个请求按 Egern 分流规则走，结果就是「现在用这台手机打开它会怎样」。
 *
 * Env（都可选）：
 *   POLICY            所有检测都走这个策略 / 策略组，用来测指定节点
 *   STREAMING_POLICY  只给流媒体三项指定策略（优先于 POLICY）
 *   AI_POLICY         只给 AI 三项指定策略（优先于 POLICY）
 *   REFRESH_MINUTES   刷新间隔，默认 30（5–120）。每次检测约下载 2–3 MB，间隔别设太短
 */

const COLORS = {
  background: { light: '#FFFFFF', dark: '#050506' },
  text: { light: '#111114', dark: '#F7F7F8' },
  secondary: { light: '#7B7B84', dark: '#A5A5AE' },
  panel: { light: '#F5F5F7', dark: '#111114' },
  separator: { light: '#E4E4E8', dark: '#242429' },
  badge: { light: '#E8E8ED', dark: '#202025' },
  accent: { light: '#7446D8', dark: '#B765FF' },
  success: { light: '#2F9E58', dark: '#C7FF18' },
  warning: { light: '#9A6700', dark: '#FFD60A' },
  failure: { light: '#D64545', dark: '#FF626A' },
};

const UA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const UA_MOBILE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const PAGE_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': UA_DESKTOP,
};

const TIMEOUT = 8000;        // 普通请求
const TIMEOUT_PAGE = 12000;  // YouTube / Netflix / Gemini 页面很大
const TIMEOUT_HOP = 6000;    // 手动跟随跳转的每一跳、Disney+ 接口的每一步

// 官方支持名单里没有的常见出口地区（只列确定不支持的，以官网为准）
//   ChatGPT https://help.openai.com/en/articles/7947663
//   Claude  https://www.anthropic.com/supported-countries
//   Gemini  https://support.google.com/gemini/answer/13575153（中国大陆仅 Workspace；支持香港）
//   Netflix 中国大陆、俄罗斯、朝鲜、叙利亚不提供服务
const UNSUPPORTED = {
  chatgpt: ['CN', 'HK', 'MO', 'RU', 'BY', 'IR', 'KP', 'SY', 'CU'],
  claude: ['CN', 'HK', 'MO', 'RU', 'BY', 'IR', 'KP', 'SY', 'CU', 'VE', 'AF'],
  gemini: ['CN', 'RU', 'BY', 'IR', 'KP', 'SY', 'CU', 'AF'],
  netflix: ['CN', 'RU', 'KP', 'SY'],
};

const ALPHA3 = {
  HKG: 'HK', MAC: 'MO', TWN: 'TW', CHN: 'CN', JPN: 'JP', KOR: 'KR', SGP: 'SG', MYS: 'MY', THA: 'TH',
  VNM: 'VN', PHL: 'PH', IDN: 'ID', IND: 'IN', AUS: 'AU', NZL: 'NZ', USA: 'US', CAN: 'CA', MEX: 'MX',
  BRA: 'BR', ARG: 'AR', CHL: 'CL', GBR: 'GB', IRL: 'IE', DEU: 'DE', FRA: 'FR', NLD: 'NL', BEL: 'BE',
  LUX: 'LU', CHE: 'CH', AUT: 'AT', ITA: 'IT', ESP: 'ES', PRT: 'PT', SWE: 'SE', NOR: 'NO', DNK: 'DK',
  FIN: 'FI', POL: 'PL', CZE: 'CZ', ROU: 'RO', BGR: 'BG', HUN: 'HU', GRC: 'GR', UKR: 'UA', TUR: 'TR',
  ISR: 'IL', ARE: 'AE', SAU: 'SA', QAT: 'QA', ZAF: 'ZA', EGY: 'EG', NGA: 'NG', KAZ: 'KZ', RUS: 'RU',
  BLR: 'BY', IRN: 'IR', PRK: 'KP', SYR: 'SY', CUB: 'CU', VEN: 'VE', AFG: 'AF', PAK: 'PK', BGD: 'BD',
};

// Disney+ 网页版公开使用的客户端密钥（各类检测脚本通用）
const DISNEY_KEY = 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84';

// ───────────────────────────── 配置 ─────────────────────────────

function readEnv(ctx) {
  const env = ctx.env || {};
  const pick = key => String(env[key] ?? '').trim();
  const minutes = Number(env.REFRESH_MINUTES);
  return {
    streamingPolicy: pick('STREAMING_POLICY') || pick('POLICY'),
    aiPolicy: pick('AI_POLICY') || pick('POLICY'),
    refreshMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.min(120, Math.max(5, minutes)) : 30,
  };
}

// ───────────────────────────── 网络 ─────────────────────────────

async function http(ctx, url, opts = {}) {
  const startedAt = Date.now();
  const method = opts.method || 'GET';
  const options = {
    headers: opts.headers || PAGE_HEADERS,
    timeout: opts.timeout || TIMEOUT,
    redirect: opts.redirect || 'follow',
    credentials: 'omit',
  };
  if (opts.body !== undefined) options.body = opts.body;
  if (opts.policy) options.policy = opts.policy;

  try {
    const response = method === 'POST' ? await ctx.http.post(url, options) : await ctx.http.get(url, options);
    const body = opts.readBody === false ? '' : await response.text();
    return { ok: true, url, status: Number(response.status), headers: response.headers, body: String(body || ''), ms: Date.now() - startedAt };
  } catch (error) {
    const message = String(error?.message || error || '').replace(/^\w*Error:\s*/, '');
    return {
      ok: false, url, status: 0, headers: null, body: '', ms: Date.now() - startedAt,
      error: message, timedOut: /timed?\s*out|timeout/i.test(message),
    };
  }
}

// 手动跟随跳转：拿到每一跳的地址；出错时也知道是在哪个域名上断的
async function follow(ctx, url, opts = {}, maxHops = 4) {
  const chain = [url];
  let current = url;
  let last = null;
  let ms = 0;
  for (let hop = 0; hop <= maxHops; hop++) {
    last = await http(ctx, current, { ...opts, redirect: 'manual', timeout: opts.timeout || TIMEOUT_HOP });
    ms += last.ms;
    if (!last.ok || last.status < 300 || last.status >= 400) break;
    const location = header(last.headers, 'location');
    if (!location) break;
    try {
      current = new URL(location, current).toString();
    } catch {
      break;
    }
    chain.push(current);
  }
  return { last, chain, ms };
}

function header(headers, name) {
  if (!headers) return '';
  if (typeof headers.get === 'function') return String(headers.get(name) || '');
  const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
  const value = key ? headers[key] : '';
  return Array.isArray(value) ? value.join(', ') : String(value || '');
}

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function hostOf(url) {
  const match = String(url || '').match(/^https?:\/\/([^/?#]+)/i);
  return match ? match[1] : '';
}

function okStatus(status) {
  return status >= 200 && status < 400;
}

function region2(value) {
  const code = String(value || '').trim().toUpperCase();
  if (code === 'UK') return 'GB';
  return /^[A-Z]{2}$/.test(code) && code !== 'XX' ? code : '';
}

function traceRegion(body) {
  return region2((String(body || '').match(/^loc=([A-Z]{2})$/im) || [])[1]);
}

// ───────────────────────────── 结果 ─────────────────────────────
// state：ok 可用 / partial 部分可用 / blocked 锁定 / unknown 待验证 / error 失败

function result(state, region = '', ms = 0, extra = {}) {
  return { state, region: region2(region), ms: Math.max(0, Math.round(ms || 0)), note: '', detail: '', debug: '', ...extra };
}

function errorLabel(message) {
  const text = String(message || '');
  if (/timed?\s*out|timeout/i.test(text)) return '超时';
  if (/too (?:large|big)|exceed|size limit|max(?:imum)? size/i.test(text)) return '响应过大';
  if (/redirect/i.test(text)) return '跳转过多';
  if (/ssl|tls|certificate|secure connection|handshake/i.test(text)) return 'TLS 错误';
  if (/refused/i.test(text)) return '连接被拒';
  if (/reject|denied|blocked|prohibit/i.test(text)) return '被规则拒绝';
  if (/reset|lost|closed|abort|broken pipe|eof|disconnect/i.test(text)) return '连接中断';
  if (/dns|hostname|resolve|could not find|not found/i.test(text)) return 'DNS 失败';
  return '网络错误';
}

// 请求没拿到可用结果时：徽标写原因，底部写域名 + 原始报错
function failed(state, region, ms, response) {
  if (!response) return result(state, region, ms);
  const host = hostOf(response.url);
  if (!response.ok) {
    return result(state, region, ms, {
      detail: response.timedOut ? '超时' : errorLabel(response.error),
      debug: `${host} ${String(response.error || '').slice(0, 60)}`.trim(),
    });
  }
  return result(state, region, ms, { detail: `HTTP ${response.status}`, debug: `${host} HTTP ${response.status}` });
}

// ───────────────────────────── 流媒体 ─────────────────────────────

async function checkYouTube(ctx, policy) {
  const hops = await follow(ctx, 'https://www.youtube.com/premium', {
    headers: {
      ...PAGE_HEADERS,
      'Accept-Language': 'en',
      Cookie: 'CONSENT=YES+cb.20220301-11-p0.en+FX+700; PREF=hl=en',
    },
    timeout: TIMEOUT_PAGE,
    policy,
  });
  const page = hops.last;
  if (!page.ok) return failed('error', '', hops.ms, page);

  const body = page.body;
  if (/www\.google\.cn/.test(body)) return result('blocked', 'CN', hops.ms);
  const region =
    region2((body.match(/"countryCode"\s*:\s*"([A-Z]{2})"/) || [])[1]) ||
    region2((body.match(/"INNERTUBE_CONTEXT_GL"\s*:\s*"([A-Z]{2})"/) || [])[1]);

  if (/Premium is not available in your country/i.test(body)) return result('blocked', region, hops.ms);
  if (/purchaseButtonOverride|Start trial|startTrial/i.test(body) || region) return result('ok', region, hops.ms);
  if (!okStatus(page.status)) return failed(page.status === 403 || page.status === 429 ? 'unknown' : 'error', region, hops.ms, page);
  return result('unknown', region, hops.ms); // 页面改版，标记都没找到
}

function netflixRegion(body) {
  const text = String(body || '').replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return (
    region2((text.match(/"requestCountry"\s*:\s*\{[^{}]*?"id"\s*:\s*"([A-Z]{2})"/) || [])[1]) ||
    region2((text.match(/"currentCountry"\s*:\s*"([A-Z]{2})"/) || [])[1]) ||
    region2((text.match(/"countryCode"\s*:\s*"([A-Z]{2})"/) || [])[1])
  );
}

async function checkNetflix(ctx, policy) {
  // 两部都不是自制剧：任意一部能播 = 完整解锁；都不能播 = 只能看自制剧
  const [first, second] = await Promise.all([
    http(ctx, 'https://www.netflix.com/title/81280792', { timeout: TIMEOUT_PAGE, policy }),
    http(ctx, 'https://www.netflix.com/title/70143836', { timeout: TIMEOUT_PAGE, policy }),
  ]);
  const ms = Math.max(first.ms, second.ms);
  if (!first.ok && !second.ok) return failed('error', '', ms, second);

  const region = netflixRegion(first.body) || netflixRegion(second.body);
  const playable = r => r.ok && /og:video/i.test(r.body);
  if (playable(first) || playable(second)) return result('ok', region, ms);

  const page = second.ok ? second : first;
  if (
    UNSUPPORTED.netflix.includes(region) ||
    /Netflix (?:is not|isn['’]t) available in your country/i.test(first.body + second.body)
  ) {
    return result('blocked', region, ms);
  }
  if (page.status === 403 || page.status === 429 || page.status >= 500) {
    return failed(page.status >= 500 ? 'error' : 'unknown', region, ms, page);
  }
  return result('partial', region, ms, { note: '自制剧' });
}

async function disneyApi(ctx, policy) {
  const auth = { authorization: `Bearer ${DISNEY_KEY}`, 'User-Agent': UA_DESKTOP };
  const device = await http(ctx, 'https://disney.api.edge.bamgrid.com/devices', {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ deviceFamily: 'browser', applicationRuntime: 'chrome', deviceProfile: 'windows', attributes: {} }),
    timeout: TIMEOUT_HOP,
    policy,
  });
  const assertion = parseJSON(device.body)?.assertion;
  if (!assertion) return { ok: false, response: device, ms: device.ms };

  const token = await http(ctx, 'https://disney.api.edge.bamgrid.com/token', {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/x-www-form-urlencoded' },
    body:
      'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange&latitude=0&longitude=0&platform=browser' +
      `&subject_token=${encodeURIComponent(assertion)}` +
      '&subject_token_type=urn%3Abamtech%3Aparams%3Aoauth%3Atoken-type%3Adevice',
    timeout: TIMEOUT_HOP,
    policy,
  });
  let ms = device.ms + token.ms;
  if (/forbidden-location/i.test(token.body) || /403 ERROR/.test(token.body)) return { ok: true, banned: true, ms };
  const refreshToken = parseJSON(token.body)?.refresh_token;
  if (!refreshToken) return { ok: false, response: token, ms };

  const graph = await http(ctx, 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql', {
    method: 'POST',
    headers: { authorization: DISNEY_KEY, 'content-type': 'application/json', 'User-Agent': UA_DESKTOP },
    body: JSON.stringify({
      query: 'mutation refreshToken($input: RefreshTokenInput!) { refreshToken(refreshToken: $input) { activeSession { sessionId } } }',
      variables: { input: { refreshToken } },
    }),
    timeout: TIMEOUT_HOP,
    policy,
  });
  ms += graph.ms;
  const region = region2((graph.body.match(/"countryCode"\s*:\s*"([A-Z]{2})"/) || [])[1]);
  const supported = (graph.body.match(/"inSupportedLocation"\s*:\s*(true|false)/) || [])[1];
  return { ok: graph.ok && !!region, region, supported: supported === undefined ? null : supported === 'true', response: graph, ms };
}

async function checkDisney(ctx, policy) {
  const [api, home] = await Promise.all([
    disneyApi(ctx, policy),
    follow(ctx, 'https://www.disneyplus.com/', { policy, readBody: false }, 3),
  ]);
  const ms = Math.max(api.ms || 0, home.ms);
  const chain = home.chain.join(' ');
  const locale = chain.match(/disneyplus\.com\/(?:[a-z]{2})-([a-z]{2})(?:[/?#]|$)/i);
  const region = api.region || region2(locale && locale[1]);

  if (api.banned) return result('blocked', region, ms);
  if (/unavailable/i.test(chain)) return result('blocked', region, ms);
  if (api.ok) {
    if (api.supported === true || api.region === 'JP') return result('ok', region, ms);
    if (api.supported === false) return result('unknown', region, ms, { detail: '即将上线' });
  }
  // 接口没拿到结果时，看首页能不能正常打开
  const last = home.last;
  if (last.ok && okStatus(last.status)) return result(region ? 'ok' : 'unknown', region, ms);
  if (!last.ok) return failed('error', region, ms, last);
  return failed(last.status === 403 ? 'unknown' : 'error', region, ms, last);
}

// ───────────────────────────── AI ─────────────────────────────

async function checkChatGPT(ctx, policy) {
  const [compliance, ios, trace] = await Promise.all([
    http(ctx, 'https://api.openai.com/compliance/cookie_requirements', {
      headers: {
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        Authorization: 'Bearer null',
        'Content-Type': 'application/json',
        Origin: 'https://platform.openai.com',
        Referer: 'https://platform.openai.com/',
        'User-Agent': UA_DESKTOP,
      },
      policy,
    }),
    http(ctx, 'https://ios.chat.openai.com/', { headers: { ...PAGE_HEADERS, 'User-Agent': UA_MOBILE }, policy }),
    http(ctx, `https://chatgpt.com/cdn-cgi/trace?_=${Date.now()}`, { headers: { 'User-Agent': UA_DESKTOP }, policy }),
  ]);
  const region = traceRegion(trace.body);
  const ms = Math.max(compliance.ms, ios.ms, trace.ms);
  if (!compliance.ok && !ios.ok && !trace.ok) return failed('error', region, ms, compliance);

  const iosBody = ios.body;
  if (
    /unsupported_country/i.test(compliance.body) ||
    /unsupported_country_region_territory/i.test(iosBody) ||
    UNSUPPORTED.chatgpt.includes(region)
  ) {
    return result('blocked', region, ms);
  }
  if (/blocked_why_headline/i.test(iosBody)) return result('blocked', region, ms);
  // 机房 / VPN IP：网页版能用，App 被拒
  if (/"cf_details"\s*:\s*"[^"]*\((?:1|2)\)/.test(iosBody) || /\bVPN\b/.test(iosBody)) {
    return result('partial', region, ms, { note: '网页' });
  }
  if (!compliance.ok && !trace.ok) return failed('error', region, ms, compliance);
  return result('ok', region, ms);
}

async function checkClaude(ctx, policy) {
  const [entry, trace] = await Promise.all([
    follow(ctx, 'https://claude.ai/', { policy, readBody: false }, 2),
    http(ctx, `https://claude.ai/cdn-cgi/trace?_=${Date.now()}`, { headers: { 'User-Agent': UA_DESKTOP }, policy }),
  ]);
  const region = traceRegion(trace.body);
  const ms = Math.max(entry.ms, trace.ms);
  const last = entry.last;

  if (entry.chain.some(url => /app-unavailable-in-region|unavailable-in-region/i.test(url))) {
    return result('blocked', region, ms);
  }
  if (UNSUPPORTED.claude.includes(region)) return result('blocked', region, ms);
  if (!last.ok) return failed(trace.ok ? 'unknown' : 'error', region, ms, last);
  if (last.status === 451) return result('blocked', region, ms);
  // 403 多半是 Cloudflare 人机验证，浏览器里过一下就行；地区支持就算可用
  if (last.status === 403) return region ? result('ok', region, ms) : failed('unknown', region, ms, last);
  if (last.status >= 500) return failed('error', region, ms, last);
  return result('ok', region, ms);
}

async function checkGemini(ctx, policy) {
  const hops = await follow(ctx, 'https://gemini.google.com/', { timeout: TIMEOUT_PAGE, policy });
  const page = hops.last;
  const body = page.body;
  const region = ALPHA3[(body.match(/,2,1,200,"([A-Z]{3})"/) || [])[1]] || '';

  if (!page.ok) return failed('error', region, hops.ms, page);
  if (
    /Gemini isn['’]t currently supported in your country|Gemini is not (?:currently )?available in your country/i.test(body) ||
    UNSUPPORTED.gemini.includes(region)
  ) {
    return result('blocked', region, hops.ms);
  }
  if (body.includes('45631641,null,true')) return result('ok', region, hops.ms);
  if (okStatus(page.status)) return result(region ? 'ok' : 'unknown', region, hops.ms);
  return failed(page.status === 403 || page.status === 429 ? 'unknown' : 'error', region, hops.ms, page);
}

// ───────────────────────────── 界面 ─────────────────────────────

const MONO = 'Menlo';

function label(info) {
  if (info.state === 'ok') return info.region || '可用';
  if (info.state === 'partial') return info.region ? `${info.region} ${info.note}` : `仅${info.note}`;
  if (info.state === 'blocked') return info.region ? `锁定 ${info.region}` : '锁定';
  if (info.state === 'unknown') return info.detail || '待验证';
  return info.detail || '失败';
}

function stateColor(info) {
  if (info.state === 'ok') return COLORS.success;
  if (info.state === 'partial' || info.state === 'unknown') return COLORS.warning;
  return COLORS.failure;
}

function latencyColor(info) {
  if (info.state === 'blocked' || info.state === 'error') return COLORS.failure;
  if (info.state !== 'ok' || info.ms >= 1500) return COLORS.warning;
  return COLORS.secondary;
}

function text(value, size, color, weight = 'regular', extra = {}) {
  return { type: 'text', text: String(value), font: { size, weight }, textColor: color, maxLines: 1, ...extra };
}

function mono(value, size, color, weight = 'medium', extra = {}) {
  return { type: 'text', text: String(value), font: { size, weight, family: MONO }, textColor: color, maxLines: 1, ...extra };
}

function dot(color, size) {
  return { type: 'stack', width: size, height: size, borderRadius: size / 2, backgroundColor: color, children: [] };
}

function badge(info, compact) {
  return {
    type: 'stack',
    padding: [2, compact ? 4 : 6],
    backgroundColor: COLORS.badge,
    borderRadius: 4,
    children: [mono(label(info), compact ? 8 : 10, COLORS.text, 'semibold', { minScale: 0.6, textAlign: 'center' })],
  };
}

function readout(info, compact) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: compact ? 3 : 6,
    width: compact ? 86 : 118,
    children: [
      badge(info, compact),
      { type: 'spacer' },
      mono(`${info.ms}ms`, compact ? 8 : 10, latencyColor(info), 'medium', { minScale: 0.7 }),
      dot(stateColor(info), compact ? 5 : 6),
    ],
  };
}

function serviceRow(item, compact) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: compact ? 4 : 8,
    children: [
      text(item.name, compact ? 11 : 13, COLORS.text, 'medium', { flex: 1, minScale: 0.75 }),
      readout(item.info, compact),
    ],
  };
}

function separator() {
  return { type: 'stack', height: 1, backgroundColor: COLORS.separator, children: [] };
}

function group(title, items, compact) {
  const passed = items.filter(item => item.info.state === 'ok').length;
  const rows = [];
  items.forEach((item, index) => {
    if (index) rows.push(separator());
    rows.push(serviceRow(item, compact));
  });
  return {
    type: 'stack',
    direction: 'column',
    gap: compact ? 4 : 6,
    padding: compact ? [6, 8, 6, 8] : [9, 12, 9, 12],
    backgroundColor: COLORS.panel,
    borderRadius: compact ? 8 : 10,
    children: [
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        children: [
          text(title, compact ? 8 : 10, COLORS.accent, 'bold'),
          { type: 'spacer' },
          mono(`${passed}/${items.length}`, compact ? 8 : 10, COLORS.secondary, 'semibold'),
        ],
      },
      ...rows,
    ],
  };
}

function clock() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function headerRow(passed, total, size) {
  const small = size === 'small';
  const compact = size !== 'large';
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    children: [
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        gap: compact ? 4 : 6,
        children: [
          {
            type: 'image',
            src: 'sf-symbol:antenna.radiowaves.left.and.right',
            color: passed === total ? COLORS.success : COLORS.accent,
            width: compact ? 11 : 14,
            height: compact ? 11 : 14,
          },
          text(small ? '解锁' : '解锁检测', compact ? 12 : 14, COLORS.text, 'bold'),
          mono(`${passed}/${total}`, compact ? 14 : 18, COLORS.text, 'bold'),
        ],
      },
      { type: 'spacer' },
      mono(clock(), compact ? 9 : 11, COLORS.secondary),
    ],
  };
}

function debugFooter(items, maxLines) {
  const lines = items
    .filter(item => (item.info.state === 'error' || item.info.state === 'unknown') && item.info.debug)
    .map(item => `${item.name}: ${item.info.debug}`);
  if (!lines.length) return null;
  return mono(lines.join('\n'), maxLines > 2 ? 8 : 7, COLORS.secondary, 'medium', { maxLines, minScale: 0.6 });
}

function root(children, padding, gap, refreshAfter) {
  return { type: 'widget', backgroundColor: COLORS.background, padding, gap, refreshAfter, children: children.filter(Boolean) };
}

function mediumWidget(data) {
  const { streaming, ai, passed, total, refreshAfter } = data;
  const footer = debugFooter([...streaming, ...ai], 2);
  return root([
    headerRow(passed, total, 'medium'),
    {
      type: 'stack',
      direction: 'row',
      gap: 6,
      children: [
        { type: 'stack', direction: 'column', flex: 1, children: [group('流媒体解锁', streaming, true)] },
        { type: 'stack', direction: 'column', flex: 1, children: [group('AI 服务检测', ai, true)] },
      ],
    },
    footer,
  ], footer ? [9, 12, 9, 12] : [10, 12, 10, 12], footer ? 4 : 6, refreshAfter); // 有底部信息时收紧一点，小屏也放得下
}

function largeWidget(data) {
  const { streaming, ai, passed, total, refreshAfter } = data;
  const all = [...streaming, ...ai];
  const footer = debugFooter(all, 3);
  const failedCount = total - passed;
  const summary = text(
    failedCount === 0 ? '全部服务已解锁' : `${failedCount} 项未通过检测`,
    11,
    failedCount === 0 ? COLORS.secondary : COLORS.failure,
    'medium',
  );
  return root([
    headerRow(passed, total, 'large'),
    footer ? null : summary, // 有排查信息时省掉这行，给底部腾地方
    group('流媒体解锁', streaming, false),
    group('AI 服务检测', ai, false),
    footer,
  ], [14, 16, 14, 16], footer ? 7 : 8, refreshAfter);
}

function smallWidget(data) {
  const { streaming, ai, passed, total, refreshAfter } = data;
  const rows = [];
  [...streaming, ...ai].forEach((item, index) => {
    if (index === 3) rows.push(separator());
    rows.push({
      type: 'stack',
      direction: 'row',
      alignItems: 'center',
      gap: 4,
      children: [
        dot(stateColor(item.info), 5),
        text(item.name, 10, COLORS.text, 'medium', { flex: 1, minScale: 0.7 }),
        mono(label(item.info), 8, stateColor(item.info), 'semibold', { minScale: 0.6 }),
      ],
    });
  });
  return root([
    headerRow(passed, total, 'small'),
    { type: 'stack', direction: 'column', gap: 2, padding: [6, 8, 6, 8], backgroundColor: COLORS.panel, borderRadius: 8, children: rows },
  ], [10, 11, 10, 11], 6, refreshAfter);
}

function ringSvg(ratio) {
  const p = Math.min(1, Math.max(0, ratio));
  let arc = '';
  if (p >= 0.999) {
    arc = "<circle cx='50' cy='50' r='40' fill='none' stroke='rgb(255,255,255)' stroke-width='10'/>";
  } else if (p > 0.001) {
    const a = 2 * Math.PI * p;
    const x = (50 + 40 * Math.sin(a)).toFixed(2);
    const y = (50 - 40 * Math.cos(a)).toFixed(2);
    arc = `<path d='M 50 10 A 40 40 0 ${p > 0.5 ? 1 : 0} 1 ${x} ${y}' fill='none' stroke='rgb(255,255,255)' stroke-width='10' stroke-linecap='round'/>`;
  }
  return "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
    "<circle cx='50' cy='50' r='40' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='10'/>" + arc + '</svg>';
}

function failedNames(items) {
  return items.filter(item => item.info.state !== 'ok').map(item => item.name);
}

function accessoryWidget(family, data) {
  const { streaming, ai, passed, total, refreshAfter } = data;
  const all = [...streaming, ...ai];
  const bad = failedNames(all);
  const plain = (value, size, weight = 'regular') => ({ type: 'text', text: value, font: { size, weight }, maxLines: 1, minScale: 0.6 });

  if (family === 'accessoryInline') {
    return { type: 'widget', refreshAfter, children: [plain(`解锁 ${passed}/${total}${bad.length ? ' · ✕ ' + bad.join(' ') : ''}`, 12)] };
  }
  if (family === 'accessoryCircular') {
    const center = (child) => ({ type: 'stack', direction: 'row', children: [{ type: 'spacer' }, child, { type: 'spacer' }] });
    return {
      type: 'widget',
      padding: 0,
      refreshAfter,
      children: [{
        type: 'stack',
        direction: 'column',
        alignItems: 'center',
        flex: 1,
        backgroundImage: ringSvg(total ? passed / total : 0),
        children: [{ type: 'spacer' }, center(plain(`${passed}/${total}`, 15, 'bold')), center(plain('解锁', 8, 'medium')), { type: 'spacer' }],
      }],
    };
  }
  const count = items => `${items.filter(item => item.info.state === 'ok').length}/${items.length}`;
  return {
    type: 'widget',
    gap: 1,
    refreshAfter,
    children: [
      plain(`解锁检测 ${passed}/${total}`, 14, 'bold'),
      plain(`流媒体 ${count(streaming)} · AI ${count(ai)}`, 12, 'medium'),
      plain(bad.length ? `✕ ${bad.join(' ')}` : '全部通过', 12),
    ],
  };
}

// ───────────────────────────── 入口 ─────────────────────────────

export default async function (ctx) {
  const env = readEnv(ctx);
  const [youtube, netflix, disney, chatgpt, claude, gemini] = await Promise.all([
    checkYouTube(ctx, env.streamingPolicy),
    checkNetflix(ctx, env.streamingPolicy),
    checkDisney(ctx, env.streamingPolicy),
    checkChatGPT(ctx, env.aiPolicy),
    checkClaude(ctx, env.aiPolicy),
    checkGemini(ctx, env.aiPolicy),
  ]);

  const streaming = [
    { name: 'YouTube', info: youtube },
    { name: 'Netflix', info: netflix },
    { name: 'Disney+', info: disney },
  ];
  const ai = [
    { name: 'ChatGPT', info: chatgpt },
    { name: 'Claude', info: claude },
    { name: 'Gemini', info: gemini },
  ];
  const all = [...streaming, ...ai];
  const data = {
    streaming,
    ai,
    passed: all.filter(item => item.info.state === 'ok').length,
    total: all.length,
    refreshAfter: new Date(Date.now() + env.refreshMinutes * 60000).toISOString(),
  };

  const family = ctx.widgetFamily || 'systemMedium';
  if (family.startsWith('accessory')) return accessoryWidget(family, data);
  if (family === 'systemSmall') return smallWidget(data);
  if (family === 'systemLarge' || family === 'systemExtraLarge') return largeWidget(data);
  return mediumWidget(data);
}
