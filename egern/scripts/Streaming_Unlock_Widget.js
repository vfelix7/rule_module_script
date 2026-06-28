/**
 * Egern 媒体与 AI 解锁检测小组件
 *
 * 检测项目：
 *   流媒体：YouTube、Netflix、Disney+
 *   AI：ChatGPT、Claude、Gemini
 *
 * 路由说明：
 *   所有 ctx.http 请求均不设置 policy / policyDescriptor，
 *   因此每个检测域名会分别按照 Egern 当前配置的分流规则处理。
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

const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const COMMON_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': USER_AGENT,
};

const TRACE_HEADERS = {
  Accept: 'text/plain,*/*;q=0.8',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'User-Agent': USER_AGENT,
};

const REQUEST_TIMEOUT = 7000;

function elapsedSince(startedAt) {
  return Math.max(0, Date.now() - startedAt);
}

function uncachedUrl(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
}

async function request(ctx, url, options = {}) {
  const startedAt = Date.now();

  try {
    const response = await ctx.http.get(url, {
      headers: options.headers || COMMON_HEADERS,
      timeout: options.timeout || REQUEST_TIMEOUT,
      redirect: options.redirect || 'follow',
      credentials: 'omit',
    });

    const body = options.readBody === false ? '' : await response.text();

    return {
      ok: true,
      status: Number(response.status),
      headers: response.headers,
      body,
      ms: elapsedSince(startedAt),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      headers: null,
      body: '',
      ms: elapsedSince(startedAt),
      error: String(error),
    };
  }
}

function getHeader(headers, name) {
  if (!headers) return '';

  if (typeof headers.get === 'function') {
    return String(headers.get(name) || '');
  }

  const wanted = name.toLowerCase();
  const key = Object.keys(headers).find(item => item.toLowerCase() === wanted);
  const value = key ? headers[key] : '';
  return Array.isArray(value) ? value.join(', ') : String(value || '');
}

function normalizeRegion(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';

  if (/^[A-Z]{2}$/.test(raw)) {
    return raw === 'UK' ? 'GB' : raw;
  }

  const tagged = raw.match(
    /(?:COUNTRY|COUNTRYCODE|COUNTRY_CODE|REGION|LOC|LOCATION)\s*[:=_-]\s*["']?([A-Z]{2})\b/
  );
  if (tagged) return tagged[1] === 'UK' ? 'GB' : tagged[1];

  return '';
}

function firstRegion(text, patterns) {
  const source = String(text || '').replace(/\\"/g, '"');

  for (const pattern of patterns) {
    const match = source.match(pattern);
    const region = normalizeRegion(match?.[1]);
    if (region) return region;
  }

  return '';
}

function regionFromHeaders(headers) {
  const names = [
    'physical-location',
    'cf-ipcountry',
    'x-country-code',
    'x-client-country',
    'x-geo-country',
    'x-originating-country',
  ];

  for (const name of names) {
    const value = getHeader(headers, name);
    const direct = normalizeRegion(value);
    if (direct) return direct;

    const embedded = firstRegion(value, [
      /(?:country|countryCode|country_code|region|loc|location)\s*[:=_-]\s*["']?([A-Z]{2})\b/i,
    ]);
    if (embedded) return embedded;
  }

  return '';
}

function regionFromLocation(headers) {
  const location = getHeader(headers, 'location');
  if (!location) return '';

  const queryRegion = firstRegion(location, [
    /[?&](?:country|countryCode|country_code|region|gl)=([A-Z]{2})(?:[&#]|$)/i,
  ]);
  if (queryRegion) return queryRegion;

  const locale = location.match(/\/([a-z]{2})-([a-z]{2})(?:[/?#]|$)/i);
  if (!locale) return '';

  const left = locale[1].toUpperCase();
  const right = locale[2].toUpperCase();
  const languageCodes = new Set([
    'AR',
    'DE',
    'EN',
    'ES',
    'FR',
    'IT',
    'JA',
    'KO',
    'NL',
    'PL',
    'PT',
    'RU',
    'TH',
    'TR',
    'VI',
    'ZH',
  ]);

  if (languageCodes.has(left) && !languageCodes.has(right)) return normalizeRegion(right);
  if (!languageCodes.has(left) && languageCodes.has(right)) return normalizeRegion(left);
  return '';
}

function regionFromTrace(body) {
  return firstRegion(body, [/^loc=([A-Z]{2})$/im]);
}

function regionFromServiceBody(body) {
  return firstRegion(body, [
    /"countryCode"\s*:\s*"([A-Z]{2})"/i,
    /"country_code"\s*:\s*"([A-Z]{2})"/i,
    /"clientCountry"\s*:\s*"([A-Z]{2})"/i,
    /"region"\s*:\s*"([A-Z]{2})"/i,
  ]);
}

function isHttpSuccess(status) {
  return status >= 200 && status < 400;
}

function result(state, region, ms) {
  return {
    state,
    region: normalizeRegion(region),
    ms: Number.isFinite(ms) ? ms : 0,
  };
}

function hasAny(text, patterns) {
  const source = String(text || '');
  return patterns.some(pattern => pattern.test(source));
}

function classifyPage(response, blockedPatterns) {
  if (!response.ok) return 'error';
  if (response.status === 451) return 'blocked';
  if (hasAny(response.body, blockedPatterns)) return 'blocked';

  if (
    response.status === 403 &&
    getHeader(response.headers, 'cf-mitigated').toLowerCase() === 'challenge'
  ) {
    return 'unknown';
  }

  if (isHttpSuccess(response.status)) return 'ok';
  if (response.status === 401) return 'ok';
  if (response.status === 403) return 'unknown';
  return 'error';
}

async function checkYouTube(ctx) {
  const response = await request(ctx, 'https://www.youtube.com/premium', {
    redirect: 'follow',
  });

  const region =
    regionFromHeaders(response.headers) ||
    firstRegion(response.body, [
      /"countryCode"\s*:\s*"([A-Z]{2})"/i,
      /"INNERTUBE_CONTEXT_GL"\s*:\s*"([A-Z]{2})"/i,
      /"GL"\s*:\s*"([A-Z]{2})"/i,
    ]);

  const state = classifyPage(response, [
    /YouTube Premium (?:is )?not available in your country/i,
    /Premium is not available in your country/i,
  ]);

  return result(state, region, response.ms);
}

async function checkNetflix(ctx) {
  const [page, entry] = await Promise.all([
    request(ctx, 'https://www.netflix.com/title/70143836', {
      redirect: 'follow',
    }),
    request(ctx, 'https://www.netflix.com/title/70143836', {
      redirect: 'manual',
      readBody: false,
    }),
  ]);

  const region =
    regionFromLocation(entry.headers) ||
    regionFromHeaders(page.headers) ||
    firstRegion(page.body, [/"countryCode"\s*:\s*"([A-Z]{2})"/i]);

  const state = classifyPage(page, [
    /You seem to be using an unblocker or proxy/i,
    /proxy or unblocker/i,
    /This title is not available in your current region/i,
  ]);

  return result(state, region, Math.max(page.ms, entry.ms));
}

async function checkDisney(ctx) {
  const [page, entry] = await Promise.all([
    request(ctx, 'https://www.disneyplus.com/', {
      redirect: 'follow',
    }),
    request(ctx, 'https://www.disneyplus.com/', {
      redirect: 'manual',
      readBody: false,
    }),
  ]);

  const region =
    regionFromHeaders(entry.headers) ||
    regionFromLocation(entry.headers) ||
    regionFromHeaders(page.headers);

  const state = classifyPage(page, [
    /Disney\+ is not available in your region/i,
    /Disney\+ is unavailable in your region/i,
    /not available in your country/i,
  ]);

  return result(state, region, Math.max(page.ms, entry.ms));
}

async function checkChatGPT(ctx) {
  const [page, trace] = await Promise.all([
    request(ctx, 'https://chatgpt.com/', { redirect: 'follow' }),
    request(ctx, uncachedUrl('https://chatgpt.com/cdn-cgi/trace'), {
      headers: TRACE_HEADERS,
      redirect: 'follow',
    }),
  ]);

  const region =
    regionFromTrace(trace.body) ||
    regionFromHeaders(page.headers) ||
    regionFromServiceBody(page.body);

  const state = classifyPage(page, [
    /OpenAI(?:'s)? services are not available in your country/i,
    /unsupported country/i,
    /not available in your region/i,
  ]);

  return result(state, region, Math.max(page.ms, trace.ms));
}

async function checkClaude(ctx) {
  const [page, trace] = await Promise.all([
    request(ctx, 'https://claude.ai/login', { redirect: 'follow' }),
    request(ctx, uncachedUrl('https://claude.ai/cdn-cgi/trace'), {
      headers: TRACE_HEADERS,
      redirect: 'follow',
    }),
  ]);

  const region =
    regionFromTrace(trace.body) ||
    regionFromHeaders(page.headers) ||
    regionFromServiceBody(page.body);

  let state = classifyPage(page, [
    /Claude is not available in your country/i,
    /unsupported country/i,
    /not available in your region/i,
  ]);

  if (state === 'unknown' && regionFromTrace(trace.body)) {
    state = 'ok';
  }

  return result(state, region, Math.max(page.ms, trace.ms));
}

async function checkGemini(ctx) {
  const [page, entry] = await Promise.all([
    request(ctx, 'https://gemini.google.com/app', {
      redirect: 'follow',
    }),
    request(ctx, 'https://gemini.google.com/app', {
      redirect: 'manual',
      readBody: false,
    }),
  ]);

  const region =
    regionFromLocation(entry.headers) ||
    regionFromHeaders(page.headers) ||
    firstRegion(page.body, [
      /"countryCode"\s*:\s*"([A-Z]{2})"/i,
      /"country"\s*:\s*"([A-Z]{2})"/i,
    ]);

  const state = classifyPage(page, [
    /Gemini isn't currently supported in your country/i,
    /Gemini is not available in your country/i,
    /not available in your region/i,
  ]);

  return result(state, region, Math.max(page.ms, entry.ms));
}

function stateLabel(info) {
  if (info.state === 'blocked') return '锁定';
  if (info.state === 'unknown') return '待验证';
  if (info.state === 'error') return '失败';
  return info.region || '可用';
}

function stateColor(info) {
  if (info.state === 'ok') return COLORS.success;
  if (info.state === 'unknown') return COLORS.warning;
  return COLORS.failure;
}

function latencyColor(info) {
  if (info.state === 'blocked' || info.state === 'error') return COLORS.failure;
  if (info.ms >= 1200 || info.state === 'unknown') return COLORS.warning;
  return COLORS.secondary;
}

function terminalReadout(info, compact) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: compact ? 3 : 6,
    width: compact ? 84 : 112,
    children: [
      {
        type: 'stack',
        padding: [2, compact ? 4 : 6],
        backgroundColor: COLORS.badge,
        borderRadius: 4,
        children: [
          {
            type: 'text',
            text: stateLabel(info),
            font: {
              size: compact ? 8 : 10,
              weight: 'semibold',
              family: 'Menlo',
            },
            textColor: COLORS.text,
            maxLines: 1,
            minScale: 0.65,
            textAlign: 'center',
          },
        ],
      },
      { type: 'spacer' },
      {
        type: 'text',
        text: `${info.ms}ms`,
        font: {
          size: compact ? 8 : 10,
          weight: 'medium',
          family: 'Menlo',
        },
        textColor: latencyColor(info),
        maxLines: 1,
        minScale: 0.7,
      },
      {
        type: 'stack',
        width: compact ? 5 : 6,
        height: compact ? 5 : 6,
        borderRadius: 3,
        backgroundColor: stateColor(info),
        children: [],
      },
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
      {
        type: 'text',
        text: item.name,
        font: { size: compact ? 11 : 13, weight: 'medium' },
        textColor: COLORS.text,
        flex: 1,
        maxLines: 1,
        minScale: 0.75,
      },
      terminalReadout(item.info, compact),
    ],
  };
}

function separator() {
  return {
    type: 'stack',
    height: 1,
    backgroundColor: COLORS.separator,
    children: [],
  };
}

function group(label, items, compact) {
  const passed = items.filter(item => item.info.state === 'ok').length;
  const rows = [];

  items.forEach((item, index) => {
    if (index > 0) rows.push(separator());
    rows.push(serviceRow(item, compact));
  });

  return {
    type: 'stack',
    direction: 'column',
    gap: compact ? 4 : 8,
    padding: compact ? [6, 8, 6, 8] : [10, 12, 10, 12],
    backgroundColor: COLORS.panel,
    borderRadius: compact ? 8 : 10,
    children: [
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        children: [
          {
            type: 'text',
            text: label,
            font: { size: compact ? 8 : 10, weight: 'bold' },
            textColor: COLORS.accent,
            maxLines: 1,
          },
          { type: 'spacer' },
          {
            type: 'text',
            text: `${passed}/${items.length}`,
            font: {
              size: compact ? 8 : 10,
              weight: 'semibold',
              family: 'Menlo',
            },
            textColor: COLORS.secondary,
            maxLines: 1,
          },
        ],
      },
      ...rows,
    ],
  };
}

function header(passed, total, compact) {
  const now = new Date();
  const time =
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0');

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
          {
            type: 'text',
            text: '解锁检测',
            font: { size: compact ? 12 : 14, weight: 'bold' },
            textColor: COLORS.text,
            maxLines: 1,
          },
          {
            type: 'text',
            text: `${passed}/${total}`,
            font: {
              size: compact ? 14 : 18,
              weight: 'bold',
              family: 'Menlo',
            },
            textColor: COLORS.text,
            maxLines: 1,
          },
        ],
      },
      { type: 'spacer' },
      {
        type: 'text',
        text: time,
        font: {
          size: compact ? 9 : 11,
          weight: 'medium',
          family: 'Menlo',
        },
        textColor: COLORS.secondary,
        maxLines: 1,
      },
    ],
  };
}

function compactWidget(streaming, ai, passed, total, refreshAfter) {
  return {
    type: 'widget',
    backgroundColor: COLORS.background,
    padding: [10, 12, 10, 12],
    gap: 6,
    refreshAfter,
    children: [
      header(passed, total, true),
      {
        type: 'stack',
        direction: 'row',
        gap: 6,
        children: [
          {
            type: 'stack',
            direction: 'column',
            flex: 1,
            children: [group('流媒体解锁', streaming, true)],
          },
          {
            type: 'stack',
            direction: 'column',
            flex: 1,
            children: [group('AI 服务检测', ai, true)],
          },
        ],
      },
    ],
  };
}

function regularWidget(streaming, ai, passed, total, refreshAfter) {
  const failed = total - passed;

  return {
    type: 'widget',
    backgroundColor: COLORS.background,
    padding: [14, 16, 14, 16],
    gap: 10,
    refreshAfter,
    children: [
      header(passed, total, false),
      {
        type: 'stack',
        direction: 'column',
        gap: 2,
        children: [
          {
            type: 'text',
            text: failed === 0 ? '全部服务已解锁' : `${failed} 项未通过检测`,
            font: { size: 11, weight: 'medium' },
            textColor: failed === 0 ? COLORS.secondary : COLORS.failure,
            maxLines: 1,
          },
        ],
      },
      group('流媒体解锁', streaming, false),
      group('AI 服务检测', ai, false),
    ],
  };
}

export default async function(ctx) {
  const checks = await Promise.all([
    checkYouTube(ctx),
    checkNetflix(ctx),
    checkDisney(ctx),
    checkChatGPT(ctx),
    checkClaude(ctx),
    checkGemini(ctx),
  ]);

  const streaming = [
    { name: 'YouTube', info: checks[0] },
    { name: 'Netflix', info: checks[1] },
    { name: 'Disney+', info: checks[2] },
  ];

  const ai = [
    { name: 'ChatGPT', info: checks[3] },
    { name: 'Claude', info: checks[4] },
    { name: 'Gemini', info: checks[5] },
  ];

  const all = [...streaming, ...ai];
  const passed = all.filter(item => item.info.state === 'ok').length;
  const refreshAfter = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  if (ctx.widgetFamily === 'systemMedium') {
    return compactWidget(streaming, ai, passed, all.length, refreshAfter);
  }

  return regularWidget(streaming, ai, passed, all.length, refreshAfter);
}
