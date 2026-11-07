/**
 * 流媒体与 AI 解锁检测 · Surge 面板
 *
 * 检测：YouTube Premium、Netflix、Disney+、ChatGPT、Claude、Gemini
 * 判定方法跟 Egern 小组件（egern/scripts/Media_AI_Unlock_Widget.js）一样，参考 RegionRestrictionCheck 的现行做法，
 * 并对照各家官方支持地区：
 *   YouTube  Premium 页面里的地区和购买入口
 *   Netflix  两部非自制剧的页面是否有 og:video：都没有 = 只能看自制剧
 *   Disney+  官方设备接口返回的 countryCode / inSupportedLocation，再看首页是否跳到 unavailable
 *   ChatGPT  api.openai.com 合规接口 + ios.chat.openai.com 拦截页（地区封锁 / 机房 IP 只能用网页）
 *   Claude   claude.ai 是否跳到 app-unavailable-in-region
 *   Gemini   页面可用标记和国家代码；页面没结论时，问 Gemini 自己的定位接口（K4WWud）
 *
 * 面板：标题写通过几项，下面每项一行：开头是状态（🟢 可用，🟡 部分可用或待验证，🔴 锁定或请求失败）和地区的国旗，
 * 然后是服务名、说明和这一项检测花的时间。面板文字是比例字体，空格对不齐表格，所以把等宽的 emoji 放在最前面，
 * 两列 emoji 和后面的服务名都能对齐。请求失败时最后几行写断在哪个域名和原始报错。点面板可以手动刷新。
 * 面板里不写检测用的策略和时间。
 *
 * 参数（模块里填）：
 *   Proxy           所有检测都走这个策略或策略组；默认「跟随规则」，按 Surge 规则走，结果就是「现在打开它会怎样」
 *   StreamingProxy  只给 YouTube、Netflix、Disney+ 指定策略；默认「同Proxy」，填「跟随规则」按 Surge 规则走
 *   AIProxy         只给 ChatGPT、Claude、Gemini 指定策略；填法同 StreamingProxy
 * 每次检测约下载 2–3 MB，刷新间隔别设太短。
 */

const UA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const UA_MOBILE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const PAGE_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': UA_DESKTOP,
};

// Google 系（YouTube、Gemini）统一用这套头：不带 Cookie 时 Gemini 会直接回 400
const GOOGLE_HEADERS = {
  ...PAGE_HEADERS,
  'Accept-Language': 'en',
  Cookie: 'CONSENT=YES+cb.20220301-11-p0.en+FX+700; PREF=hl=en',
};

const TIMEOUT = 8000; // 普通请求（毫秒，发请求时换成 Surge 要的秒）
const TIMEOUT_PAGE = 12000; // YouTube / Netflix / Gemini 页面很大
const TIMEOUT_HOP = 6000; // 手动跟随跳转的每一跳、Disney+ 接口的每一步
const DEADLINE = 36000; // 整体期限：模块的脚本超时是 40 秒，留几秒把已有结果交出去

const TITLE = '解锁检测';
const ICON = 'antenna.radiowaves.left.and.right';
const COLORS = { ok: '#34C759', some: '#FF9F0A', none: '#FF3B30' };
const DOTS = { ok: '🟢', partial: '🟡', unknown: '🟡', blocked: '🔴', error: '🔴' };

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

// Gemini 定位接口给的是英文地名（香港、澳门、台湾单独判断）
const COUNTRY_NAMES = {
  china: 'CN', 'mainland china': 'CN', japan: 'JP', 'south korea': 'KR', korea: 'KR', 'north korea': 'KP',
  singapore: 'SG', malaysia: 'MY', thailand: 'TH', vietnam: 'VN', 'viet nam': 'VN', philippines: 'PH',
  indonesia: 'ID', india: 'IN', australia: 'AU', 'new zealand': 'NZ', 'united states': 'US', usa: 'US', us: 'US',
  canada: 'CA', mexico: 'MX', brazil: 'BR', argentina: 'AR', chile: 'CL', 'united kingdom': 'GB', uk: 'GB',
  ireland: 'IE', germany: 'DE', france: 'FR', netherlands: 'NL', belgium: 'BE', luxembourg: 'LU',
  switzerland: 'CH', austria: 'AT', italy: 'IT', spain: 'ES', portugal: 'PT', sweden: 'SE', norway: 'NO',
  denmark: 'DK', finland: 'FI', poland: 'PL', czechia: 'CZ', 'czech republic': 'CZ', romania: 'RO',
  bulgaria: 'BG', hungary: 'HU', greece: 'GR', ukraine: 'UA', turkey: 'TR', turkiye: 'TR', israel: 'IL',
  'united arab emirates': 'AE', 'saudi arabia': 'SA', qatar: 'QA', 'south africa': 'ZA', egypt: 'EG',
  nigeria: 'NG', kazakhstan: 'KZ', russia: 'RU', 'russian federation': 'RU', belarus: 'BY', iran: 'IR',
  syria: 'SY', cuba: 'CU', venezuela: 'VE', afghanistan: 'AF', pakistan: 'PK', bangladesh: 'BD',
};

// Disney+ 网页版公开使用的客户端密钥（各类检测脚本通用）
const DISNEY_KEY = 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84';

const STARTED = Date.now();

// ───────────────────────────── 参数 ─────────────────────────────

// 模块传来的是「Proxy=…&StreamingProxy=…&AIProxy=…」。策略名里可能有 & 或 =，所以从后往前按参数名切。
// Surge 的模块参数不能没有默认值：Proxy 默认「跟随规则」（按 Surge 规则走），另外两个默认「同Proxy」。
// 空值和没被替换的 {{{…}}} 也当没填；分开指定的那两项填「跟随规则」时按规则走，不跟 Proxy
const FOLLOW_RULES = '跟随规则';
const SAME_AS_PROXY = '同proxy';

function readArgs(input) {
  const args = splitArgs(input, ['Proxy', 'StreamingProxy', 'AIProxy']);
  const proxy = pick(args.Proxy, '');
  return {
    streamingPolicy: pick(args.StreamingProxy, proxy),
    aiPolicy: pick(args.AIProxy, proxy),
  };
}

function pick(value, fallback) {
  const text = clean(value);
  if (!text || text.replace(/\s+/g, '').toLowerCase() === SAME_AS_PROXY) return fallback;
  return text === FOLLOW_RULES ? '' : text;
}

function splitArgs(input, keys) {
  const out = {};
  let rest = String(input || '');
  for (let i = keys.length - 1; i >= 1; i--) {
    const marker = `&${keys[i]}=`;
    const at = rest.lastIndexOf(marker);
    if (at < 0) continue;
    out[keys[i]] = rest.slice(at + marker.length);
    rest = rest.slice(0, at);
  }
  const first = `${keys[0]}=`;
  out[keys[0]] = rest.startsWith(first) ? rest.slice(first.length) : rest;
  return out;
}

function clean(value) {
  const text = String(value || '').trim();
  return /^\{\{\{.*\}\}\}$/.test(text) ? '' : text;
}

// ───────────────────────────── 网络 ─────────────────────────────

// Surge 的 $httpClient：4xx/5xx 也照常回调，超时单位是秒；redirect: 'manual' 时不自动跟随跳转
function http(url, opts = {}) {
  return new Promise(resolve => {
    const startedAt = Date.now();
    const options = {
      url,
      headers: opts.headers || PAGE_HEADERS,
      timeout: (opts.timeout || TIMEOUT) / 1000,
      'auto-cookie': false,
      'auto-redirect': opts.redirect !== 'manual',
    };
    if (opts.body !== undefined) options.body = opts.body;
    if (opts.policy) options.policy = opts.policy;
    const send = opts.method === 'POST' ? $httpClient.post : $httpClient.get;
    send.call($httpClient, options, (error, response, body) => {
      const ms = Date.now() - startedAt;
      if (error) {
        const message = String(error && error.message || error).replace(/^\w*Error:\s*/, '');
        resolve({ ok: false, url, status: 0, headers: null, body: '', ms, error: message, timedOut: /timed?\s*out|timeout/i.test(message) });
        return;
      }
      const status = Number(response && (response.status || response.statusCode)) || 0;
      resolve({ ok: true, url, status, headers: (response && response.headers) || {}, body: String(body || ''), ms });
    });
  });
}

// 手动跟随跳转：拿到每一跳的地址；出错时也知道是在哪个域名上断的
async function follow(url, opts = {}, maxHops = 4) {
  const chain = [url];
  let current = url;
  let last = null;
  let ms = 0;
  for (let hop = 0; hop <= maxHops; hop++) {
    last = await http(current, { ...opts, redirect: 'manual', timeout: opts.timeout || TIMEOUT_HOP });
    ms += last.ms;
    if (!last.ok || last.status < 300 || last.status >= 400) break;
    const location = header(last.headers, 'location');
    if (!location) break;
    current = resolveURL(location, current);
    if (!current) break;
    chain.push(current);
  }
  return { last, chain, ms };
}

// Surge 的脚本环境没有 URL：自己把 Location 里的相对地址补全
function resolveURL(location, base) {
  const target = String(location || '').trim();
  if (/^https?:\/\//i.test(target)) return target;
  const origin = (String(base).match(/^(https?:)\/\/[^/?#]+/i) || [])[0];
  if (!origin) return '';
  if (target.startsWith('//')) return `${origin.split('//')[0]}${target}`;
  if (target.startsWith('/')) return origin + target;
  const path = String(base).slice(origin.length).split(/[?#]/)[0];
  return `${origin}${path.slice(0, path.lastIndexOf('/') + 1) || '/'}${target}`;
}

function header(headers, name) {
  if (!headers) return '';
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

// 请求没拿到可用结果时：标签写原因，面板最后写域名 + 原始报错
function failed(state, region, ms, response) {
  if (!response) return result(state, region, ms);
  const host = hostOf(response.url);
  if (!response.ok) {
    return result(state, region, ms, {
      detail: response.timedOut ? '超时' : errorLabel(response.error),
      debug: `${host} ${String(response.error || '').slice(0, 60)}`.trim(),
    });
  }
  return result(state, region, ms, { detail: `HTTP ${response.status}`, debug: `${host} HTTP ${response.status}${bodyHint(response.body)}` });
}

// 错误页的标题或很短的正文，看得出是谁回的
function bodyHint(body) {
  const raw = String(body || '');
  const title = (raw.match(/<title[^>]*>([^<]{1,80})<\/title>/i) || [])[1];
  const hint = (title || (raw.length <= 120 ? raw.replace(/<[^>]+>/g, ' ') : '')).replace(/\s+/g, ' ').trim().slice(0, 40);
  return hint ? ` · ${hint}` : '';
}

// ───────────────────────────── 流媒体 ─────────────────────────────

async function checkYouTube(policy) {
  const hops = await follow('https://www.youtube.com/premium', { headers: GOOGLE_HEADERS, timeout: TIMEOUT_PAGE, policy });
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

async function checkNetflix(policy) {
  // 两部都不是自制剧：任意一部能播 = 完整解锁；都不能播 = 只能看自制剧
  const [first, second] = await Promise.all([
    http('https://www.netflix.com/title/81280792', { timeout: TIMEOUT_PAGE, policy }),
    http('https://www.netflix.com/title/70143836', { timeout: TIMEOUT_PAGE, policy }),
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

async function disneyApi(policy) {
  const auth = { authorization: `Bearer ${DISNEY_KEY}`, 'User-Agent': UA_DESKTOP };
  const device = await http('https://disney.api.edge.bamgrid.com/devices', {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ deviceFamily: 'browser', applicationRuntime: 'chrome', deviceProfile: 'windows', attributes: {} }),
    timeout: TIMEOUT_HOP,
    policy,
  });
  const assertion = (parseJSON(device.body) || {}).assertion;
  if (!assertion) return { ok: false, response: device, ms: device.ms };

  const token = await http('https://disney.api.edge.bamgrid.com/token', {
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
  const refreshToken = (parseJSON(token.body) || {}).refresh_token;
  if (!refreshToken) return { ok: false, response: token, ms };

  const graph = await http('https://disney.api.edge.bamgrid.com/graph/v1/device/graphql', {
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

async function checkDisney(policy) {
  const [api, home] = await Promise.all([
    disneyApi(policy),
    follow('https://www.disneyplus.com/', { policy }, 3),
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

async function checkChatGPT(policy) {
  const [compliance, ios, trace] = await Promise.all([
    http('https://api.openai.com/compliance/cookie_requirements', {
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
    http('https://ios.chat.openai.com/', { headers: { ...PAGE_HEADERS, 'User-Agent': UA_MOBILE }, policy }),
    http(`https://chatgpt.com/cdn-cgi/trace?_=${Date.now()}`, { headers: { 'User-Agent': UA_DESKTOP }, policy }),
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

async function checkClaude(policy) {
  const [entry, trace] = await Promise.all([
    follow('https://claude.ai/', { policy }, 2),
    http(`https://claude.ai/cdn-cgi/trace?_=${Date.now()}`, { headers: { 'User-Agent': UA_DESKTOP }, policy }),
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

// Gemini 网页显示「你的位置」用的接口；RegionRestrictionCheck 现在也靠它取 Gemini 看到的地区
const GEMINI_RPC = 'https://gemini.google.com/_/BardChatUi/data/batchexecute';
const GEMINI_RPC_BODY = `f.req=${encodeURIComponent('[[["K4WWud","[[0],[\\"en-US\\"]]",null,"generic"]]]')}`;

// 返回形如 [["wrb.fr","K4WWud","[[\"Tokyo, Japan\",\"S…\"],…]",…]]，取出里面的地名
function geminiPlace(body) {
  const raw = String(body || '');
  for (const line of raw.split('\n')) {
    if (!line.includes('K4WWud')) continue;
    const rows = parseJSON(line.trim());
    const row = Array.isArray(rows) ? rows.find(item => Array.isArray(item) && item[1] === 'K4WWud') : null;
    const place = row && typeof row[2] === 'string' ? placeIn(parseJSON(row[2])) : '';
    if (place) return place;
  }
  return (raw.match(/\[\[\\*"([^"\\]{2,80})\\*",\\*"S/) || [])[1] || '';
}

function placeIn(node, depth = 0) {
  if (!Array.isArray(node) || depth > 6) return '';
  if (typeof node[0] === 'string' && typeof node[1] === 'string' && node[1].startsWith('S')) return node[0];
  for (const child of node) {
    const found = placeIn(child, depth + 1);
    if (found) return found;
  }
  return '';
}

// 「Tokyo, Japan」→ JP；认不出的地名返回空
function countryOf(place) {
  let name = String(place || '');
  try {
    name = name.normalize('NFD');
  } catch {}
  const parts = name.toLowerCase().replace(/[\u0300-\u036f]/g, '').split(',')
    .map(part => part.replace(/[^a-z]+/g, ' ').trim())
    .filter(Boolean);
  const whole = ` ${parts.join(' ')} `;
  if (whole.includes(' hong kong ')) return 'HK';
  if (/ maca[ou] /.test(whole)) return 'MO';
  if (whole.includes(' taiwan ')) return 'TW';
  for (let i = parts.length - 1; i >= 0; i--) if (COUNTRY_NAMES[parts[i]]) return COUNTRY_NAMES[parts[i]];
  const hit = Object.keys(COUNTRY_NAMES).filter(key => whole.includes(` ${key} `)).sort((a, b) => b.length - a.length)[0];
  return hit ? COUNTRY_NAMES[hit] : '';
}

async function checkGemini(policy) {
  // 页面和定位接口同时问，哪路先给出结论用哪路
  const [hops, rpc] = await Promise.all([
    follow('https://gemini.google.com/app', { headers: GOOGLE_HEADERS, timeout: TIMEOUT_PAGE, policy }),
    http(GEMINI_RPC, {
      method: 'POST',
      headers: { ...GOOGLE_HEADERS, Accept: '*/*', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: GEMINI_RPC_BODY,
      policy,
    }),
  ]);
  const page = hops.last;
  const body = page.body;
  const place = rpc.ok && okStatus(rpc.status) ? geminiPlace(rpc.body) : '';
  const pageRegion = ALPHA3[(body.match(/,2,1,200,"([A-Z]{3})"/) || [])[1]] || '';
  const region = pageRegion || countryOf(place);

  if (/Gemini isn['’]t currently supported in your country|Gemini is not (?:currently )?available in your country/i.test(body)) {
    return result('blocked', region, hops.ms);
  }
  if (UNSUPPORTED.gemini.includes(region)) return result('blocked', region, pageRegion ? hops.ms : rpc.ms);
  if (body.includes('45631641,null,true')) return result('ok', region, hops.ms);
  if (place) return result('ok', region, rpc.ms); // 定位接口给出了地区，且不在不支持名单里
  if (page.ok && okStatus(page.status)) return result(region ? 'ok' : 'unknown', region, hops.ms);

  // 两路都没结论：标签写页面的原因，最后几行写两路各自的结果
  const note = r => (r.ok ? `HTTP ${r.status}${bodyHint(r.body)}` : String(r.error || '无响应').slice(0, 40));
  return result(page.ok && (page.status === 403 || page.status === 429) ? 'unknown' : 'error', region, Math.max(hops.ms, rpc.ms), {
    detail: page.ok ? `HTTP ${page.status}` : page.timedOut ? '超时' : errorLabel(page.error),
    debug: `${hostOf(page.url)} ${note(page)}；接口 ${note(rpc)}`,
  });
}

// ───────────────────────────── 面板 ─────────────────────────────

// 服务名后面的说明：地区已经用国旗写在前面，这里只写可用以外的情况
function note(info) {
  if (info.state === 'ok') return '';
  if (info.state === 'partial') return `仅${info.note}`;
  if (info.state === 'blocked') return '锁定';
  if (info.state === 'unknown') return info.detail || '待验证';
  return info.detail || '失败';
}

// 地区的国旗；没拿到地区时用 🌐 占位，保持宽度一样
function flag(code) {
  return /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map(char => 127397 + char.charCodeAt(0))) : '🌐';
}

function seconds(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function panel(items) {
  const passed = items.filter(item => item.info.state === 'ok').length;
  const lines = items.map(item => {
    const text = note(item.info);
    return `${DOTS[item.info.state] || '⚪️'} ${flag(item.info.region)} ${item.name}${text ? ` ${text}` : ''} · ${seconds(item.info.ms)}`;
  });
  // 请求失败、待验证的写出断在哪个域名和原始报错，最多两行
  items
    .filter(item => (item.info.state === 'error' || item.info.state === 'unknown') && item.info.debug)
    .slice(0, 2)
    .forEach(item => lines.push(`${item.name}：${item.info.debug}`));
  const color = passed === items.length ? COLORS.ok : passed === 0 ? COLORS.none : COLORS.some;
  return { title: `${TITLE} ${passed}/${items.length}`, content: lines.join('\n'), icon: ICON, 'icon-color': color };
}

// ───────────────────────────── 入口 ─────────────────────────────
// 放在文件最后：Surge 按普通脚本从上往下执行，入口要等上面的常量（比如 GEMINI_RPC）都定义好再跑

(async () => {
  const cfg = readArgs(typeof $argument === 'string' ? $argument : '');
  const [youtube, netflix, disney, chatgpt, claude, gemini] = await Promise.all([
    guard(checkYouTube(cfg.streamingPolicy)),
    guard(checkNetflix(cfg.streamingPolicy)),
    guard(checkDisney(cfg.streamingPolicy)),
    guard(checkChatGPT(cfg.aiPolicy)),
    guard(checkClaude(cfg.aiPolicy)),
    guard(checkGemini(cfg.aiPolicy)),
  ]);
  $done(panel([
    { name: 'YouTube', info: youtube },
    { name: 'Netflix', info: netflix },
    { name: 'Disney+', info: disney },
    { name: 'ChatGPT', info: chatgpt },
    { name: 'Claude', info: claude },
    { name: 'Gemini', info: gemini },
  ]));
})();

// 每一项都不会让整个面板失败：脚本出错记成这一项失败；超过整体期限还没结论的记成超时，
// 先把别的结果交出去（Surge 到了模块的超时会直接丢掉整个面板）
function guard(promise) {
  return new Promise(resolve => {
    let settled = false;
    let timer = null;
    const settle = value => {
      if (settled) return;
      settled = true;
      if (timer !== null && typeof clearTimeout === 'function') clearTimeout(timer);
      resolve(value);
    };
    if (typeof setTimeout === 'function') {
      timer = setTimeout(() => settle(result('error', '', Date.now() - STARTED, { detail: '超时', debug: `整体超过 ${DEADLINE / 1000} 秒` })),
        Math.max(0, DEADLINE - (Date.now() - STARTED)));
    }
    promise.then(settle, error => settle(result('error', '', Date.now() - STARTED, {
      detail: '脚本错误',
      debug: String(error && error.message || error).slice(0, 60),
    })));
  });
}
