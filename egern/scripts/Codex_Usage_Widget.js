/**
 * Codex usage widget for Egern
 *
 * Required env:
 *   CODEX_ACCESS_TOKEN: ChatGPT/Codex OAuth access token
 *
 * Optional env:
 *   CODEX_ACCOUNT_ID: ChatGPT account ID
 *   CODEX_USAGE_URL: Usage API URL
 *   TIME_ZONE: Reset-time zone. Default: Asia/Shanghai
 *   REFRESH_MINUTES: Refresh interval. Default: 15
 */

const DEFAULT_USAGE_URL = 'https://chatgpt.com/backend-api/wham/usage';
const CACHE_KEY = 'codex-usage-widget-cache-v1';

const COLORS = {
  background: { light: '#FFFFFF', dark: '#111113' },
  panel: { light: '#FFFFFF', dark: '#1C1C1E' },
  primary: { light: '#111318', dark: '#F7F8FA' },
  secondary: { light: '#68707C', dark: '#A8AFBA' },
  border: { light: '#E4E5E7', dark: '#353539' },
  divider: { light: '#E8E9EB', dark: '#303034' },
  track: { light: '#E4E5E7', dark: '#3A3A3E' },
  progress: { light: '#202124', dark: '#F2F2F7' },
  warning: { light: '#D65A00', dark: '#FF9F4A' },
  danger: { light: '#D70015', dark: '#FF453A' }
};

export default async function(ctx) {
  const env = ctx.env || {};
  const token = normalizeToken(env.CODEX_ACCESS_TOKEN);
  const accountId = String(env.CODEX_ACCOUNT_ID || '').trim();
  const usageUrl = String(env.CODEX_USAGE_URL || DEFAULT_USAGE_URL).trim();
  const timeZone = String(env.TIME_ZONE || 'Asia/Shanghai').trim();
  const refreshMinutes = clampNumber(env.REFRESH_MINUTES, 15, 5, 60);
  const family = ctx.widgetFamily || 'systemMedium';

  if (!token) {
    return renderError(
      family,
      '缺少 CODEX_ACCESS_TOKEN',
      '请在模块 Env 中配置 Codex 访问令牌'
    );
  }

  let usage;
  let cached = false;

  try {
    const payload = await fetchUsage(ctx, usageUrl, token, accountId);
    usage = parseUsage(payload);
    ctx.storage?.setJSON?.(CACHE_KEY, usage);
  } catch (error) {
    usage = ctx.storage?.getJSON?.(CACHE_KEY);
    cached = Boolean(usage);
    if (!usage) {
      return renderError(
        family,
        'Codex 用量获取失败',
        humanizeError(error)
      );
    }
  }

  const viewModel = {
    ...usage,
    cached,
    timeZone,
    updatedAt: new Date().toISOString(),
    refreshAfter: new Date(Date.now() + refreshMinutes * 60 * 1000).toISOString()
  };

  if (String(family).startsWith('accessory')) {
    return renderAccessory(viewModel, family);
  }
  if (family === 'systemSmall') return renderSmall(viewModel);
  return renderMedium(viewModel);
}

async function fetchUsage(ctx, url, token, accountId) {
  if (!ctx.http?.get) throw new Error('当前环境不支持 ctx.http.get');

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`
  };
  if (accountId) headers['ChatGPT-Account-Id'] = accountId;

  const response = await ctx.http.get(url, {
    headers,
    timeout: 10000,
    credentials: 'omit'
  });

  if (response?.status === 401 || response?.status === 403) {
    throw new Error('访问令牌无效或已过期');
  }
  if (response?.status && (response.status < 200 || response.status >= 300)) {
    throw new Error(`接口返回 HTTP ${response.status}`);
  }

  if (typeof response?.json === 'function') return await response.json();
  if (typeof response?.body === 'string') return JSON.parse(response.body);
  if (typeof response === 'string') return JSON.parse(response);
  throw new Error('接口响应格式异常');
}

function parseUsage(payload) {
  const root = payload?.rate_limit || payload?.rate_limits || payload?.codex?.rate_limit;
  if (!root || typeof root !== 'object') throw new Error('响应中没有 Codex 用量数据');

  const windows = collectWindows(root);
  const fiveHour = selectWindow(windows, 5 * 60 * 60, ['primary_window', 'primary']);
  const weekly = selectWindow(windows, 7 * 24 * 60 * 60, ['secondary_window', 'secondary']);

  if (!fiveHour || !weekly) throw new Error('无法识别 5 小时或一周用量窗口');

  return {
    plan: normalizePlan(payload?.plan_type || payload?.plan || payload?.subscription?.plan_type),
    fiveHour: normalizeWindow(fiveHour.value),
    weekly: normalizeWindow(weekly.value)
  };
}

function collectWindows(root) {
  const result = [];

  for (const [key, value] of Object.entries(root)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    if (hasUsageFields(value)) result.push({ key, value });
  }

  if (Array.isArray(root.windows)) {
    root.windows.forEach((value, index) => {
      if (value && typeof value === 'object') {
        result.push({ key: String(value.name || value.type || index), value });
      }
    });
  }

  return result;
}

function hasUsageFields(value) {
  return [
    value.used_percent,
    value.usedPercent,
    value.remaining_percent,
    value.remainingPercent,
    value.reset_at,
    value.resetAt
  ].some(item => item !== undefined && item !== null);
}

function selectWindow(windows, targetSeconds, preferredKeys) {
  for (const preferred of preferredKeys) {
    const exact = windows.find(window => window.key === preferred);
    if (exact) return exact;
  }

  const withDuration = windows
    .map(window => ({
      ...window,
      duration: numberOrNull(
        window.value.limit_window_seconds ??
        window.value.window_seconds ??
        window.value.limitWindowSeconds
      )
    }))
    .filter(window => window.duration !== null);

  if (!withDuration.length) return null;
  return withDuration.sort(
    (a, b) => Math.abs(a.duration - targetSeconds) - Math.abs(b.duration - targetSeconds)
  )[0];
}

function normalizeWindow(window) {
  const used = numberOrNull(window.used_percent ?? window.usedPercent);
  const remaining = numberOrNull(window.remaining_percent ?? window.remainingPercent);
  const remainingPercent = remaining === null
    ? clampNumber(100 - (used ?? 0), 0, 0, 100)
    : clampNumber(remaining, 0, 0, 100);

  return {
    remainingPercent: Math.round(remainingPercent),
    resetAt: normalizeResetTime(
      window.reset_at ??
      window.resetAt ??
      secondsFromNow(window.reset_after_seconds ?? window.resetAfterSeconds)
    )
  };
}

function normalizeResetTime(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))) {
    const numeric = Number(value);
    const milliseconds = numeric < 100000000000 ? numeric * 1000 : numeric;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function secondsFromNow(value) {
  const seconds = numberOrNull(value);
  return seconds === null ? null : Date.now() + seconds * 1000;
}

function renderMedium(model) {
  return {
    type: 'widget',
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.background,
    refreshAfter: model.refreshAfter,
    children: [
      createHeader(model, false),
      createUsageList(model, false)
    ]
  };
}

function renderSmall(model) {
  return {
    type: 'widget',
    padding: 14,
    gap: 9,
    backgroundColor: COLORS.background,
    refreshAfter: model.refreshAfter,
    children: [
      createHeader(model, true),
      createUsageList(model, true)
    ]
  };
}

function renderAccessory(model, family) {
  if (family === 'accessoryInline') {
    return {
      type: 'widget',
      refreshAfter: model.refreshAfter,
      children: [
        {
          type: 'text',
          text: `Codex ${model.plan} · 5小时 ${model.fiveHour.remainingPercent}% · 周 ${model.weekly.remainingPercent}%`
        }
      ]
    };
  }

  return {
    type: 'widget',
    padding: 6,
    gap: 2,
    refreshAfter: model.refreshAfter,
    children: [
      {
        type: 'text',
        text: `Codex ${model.plan}`,
        font: { size: 'caption1', weight: 'semibold' },
        maxLines: 1,
        minScale: 0.7
      },
      {
        type: 'text',
        text: `5小时 ${model.fiveHour.remainingPercent}%  ·  周 ${model.weekly.remainingPercent}%`,
        font: { size: 'caption2', weight: 'medium' },
        maxLines: 1,
        minScale: 0.65
      }
    ]
  };
}

function createHeader(model, compact) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: 7,
    children: [
      {
        type: 'image',
        src: 'sf-symbol:terminal.fill',
        width: compact ? 15 : 17,
        height: compact ? 15 : 17,
        color: COLORS.primary
      },
      {
        type: 'text',
        text: 'Codex 用量',
        font: { size: compact ? 14 : 16, weight: 'semibold' },
        textColor: COLORS.primary,
        maxLines: 1,
        minScale: 0.75
      },
      { type: 'spacer' },
      {
        type: 'text',
        text: model.cached ? `${model.plan} · 缓存` : model.plan,
        font: { size: compact ? 10 : 11, weight: 'medium' },
        textColor: model.cached ? COLORS.warning : COLORS.secondary,
        maxLines: 1
      }
    ]
  };
}

function createUsageList(model, compact) {
  return {
    type: 'stack',
    direction: 'column',
    flex: 1,
    backgroundColor: COLORS.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    children: [
      createLimitRow('5 小时使用限额', model.fiveHour, model.timeZone, 'time', compact),
      {
        type: 'stack',
        height: 1,
        backgroundColor: COLORS.divider,
        children: []
      },
      createLimitRow('每周使用限制', model.weekly, model.timeZone, 'date', compact)
    ]
  };
}

function createLimitRow(title, usage, timeZone, resetStyle, compact) {
  const remaining = usage.remainingPercent;

  if (compact) {
    return {
      type: 'stack',
      direction: 'column',
      flex: 1,
      padding: [7, 9],
      gap: 4,
      children: [
        {
          type: 'stack',
          direction: 'row',
          alignItems: 'center',
          children: [
            {
              type: 'text',
              text: title,
              font: { size: 11, weight: 'semibold' },
              textColor: COLORS.primary,
              maxLines: 1,
              minScale: 0.8
            },
            { type: 'spacer' },
            {
              type: 'text',
              text: `剩余 ${remaining}%`,
              font: { size: 10, weight: 'medium' },
              textColor: quotaColor(remaining),
              maxLines: 1
            }
          ]
        },
        createProgressBar(remaining, 112, 5),
        {
          type: 'text',
          text: `重置时间：${formatReset(usage.resetAt, timeZone, resetStyle)}`,
          font: { size: 9 },
          textColor: COLORS.secondary,
          maxLines: 1,
          minScale: 0.75
        }
      ]
    };
  }

  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    flex: 1,
    padding: [8, 11],
    children: [
      {
        type: 'stack',
        direction: 'column',
        flex: 1,
        gap: 3,
        children: [
          {
            type: 'text',
            text: title,
            font: { size: 12, weight: 'semibold' },
            textColor: COLORS.primary,
            maxLines: 1
          },
          {
            type: 'text',
            text: `重置时间：${formatReset(usage.resetAt, timeZone, resetStyle)}`,
            font: { size: 10 },
            textColor: COLORS.secondary,
            maxLines: 1
          }
        ]
      },
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        gap: 9,
        children: [
          createProgressBar(remaining, 92, 5),
          {
            type: 'stack',
            direction: 'row',
            width: 56,
            children: [
              { type: 'spacer' },
              {
                type: 'text',
                text: `剩余 ${remaining}%`,
                font: { size: 10, weight: 'medium' },
                textColor: quotaColor(remaining),
                maxLines: 1
              }
            ]
          }
        ]
      }
    ]
  };
}

function createProgressBar(percent, width, height) {
  const fillWidth = Math.max(3, Math.round(width * percent / 100));

  return {
    type: 'stack',
    width,
    height,
    backgroundColor: COLORS.track,
    borderRadius: 4,
    children: [
      {
        type: 'stack',
        width: fillWidth,
        height,
        backgroundColor: quotaColor(percent),
        borderRadius: 4,
        children: []
      }
    ]
  };
}

function renderError(family, title, detail) {
  const compact = family === 'systemSmall' || String(family).startsWith('accessory');

  return {
    type: 'widget',
    padding: compact ? 12 : 15,
    gap: 7,
    backgroundColor: COLORS.background,
    children: [
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        gap: 7,
        children: [
          {
            type: 'image',
            src: 'sf-symbol:exclamationmark.triangle.fill',
            width: 17,
            height: 17,
            color: COLORS.danger
          },
          {
            type: 'text',
            text: title,
            font: { size: compact ? 13 : 16, weight: 'bold' },
            textColor: COLORS.primary,
            maxLines: 1,
            minScale: 0.7
          }
        ]
      },
      {
        type: 'text',
        text: detail,
        font: { size: compact ? 10 : 12 },
        textColor: COLORS.secondary,
        maxLines: compact ? 3 : 2,
        minScale: 0.75
      }
    ]
  };
}

function quotaColor(percent) {
  if (percent <= 10) return COLORS.danger;
  if (percent <= 25) return COLORS.warning;
  return COLORS.progress;
}

function formatReset(value, timeZone, style) {
  if (!value) return '未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知';

  try {
    const options = style === 'time'
      ? {
          timeZone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }
      : {
          timeZone,
          month: 'long',
          day: 'numeric'
        };
    return new Intl.DateTimeFormat('zh-CN', options).format(date);
  } catch {
    if (style === 'time') {
      return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
}

function normalizePlan(value) {
  const plan = String(value || '未知').trim();
  const key = plan.toLowerCase().replace(/^chatgpt[\s_-]*/, '');
  const labels = {
    free: 'Free',
    plus: 'Plus',
    pro: 'Pro',
    team: 'Team',
    business: 'Business',
    enterprise: 'Enterprise',
    edu: 'Edu'
  };
  return labels[key] || plan;
}

function normalizeToken(value) {
  return String(value || '').trim().replace(/^Bearer\s+/i, '');
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function humanizeError(error) {
  const message = String(error?.message || error || '未知错误');
  return message.length > 72 ? `${message.slice(0, 72)}...` : message;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}
