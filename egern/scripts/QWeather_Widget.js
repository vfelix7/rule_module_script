/**
 * QWeather widget for Egern
 *
 * Required env:
 *   KEY: QWeather API Key
 *   API_HOST: Your personal QWeather API Host, for example abc123.qweatherapi.com
 *
 * Optional env:
 *   LOCATION: City name or "longitude,latitude". Default: 北京
 *   LANG: API language. Default: zh
 *   UNIT: m or i. Default: m
 *
 * Example:
 *   env:
 *     KEY: xxxxxxxxxxxxxxxxx
 *     API_HOST: abc123.qweatherapi.com
 *     LOCATION: 上海
 */

export default async function(ctx) {
  const env = ctx.env || {};
  const key = String(env.KEY || '').trim();
  const apiHost = normalizeHost(String(env.API_HOST || '').trim());
  const locationInput = String(env.LOCATION || '北京').trim();
  const lang = String(env.LANG || 'zh').trim();
  const unit = String(env.UNIT || 'm').trim();
  const family = ctx.widgetFamily || 'systemMedium';

  if (!key) return renderError('缺少 KEY 环境变量');
  if (!apiHost) return renderError('缺少 API_HOST 环境变量');

  try {
    const place = await resolveLocation(ctx, apiHost, key, locationInput, lang);
    const now = await fetchNow(ctx, apiHost, key, place.location, lang, unit);
    const air = await fetchAirSafely(ctx, apiHost, key, place, lang);

    if (isAccessoryFamily(family)) return renderAccessory(now, place.name);
    if (family === 'systemSmall') return renderSmall(now, place.name);
    return renderMedium(now, air, place.name);
  } catch (err) {
    return renderError(`请求失败：${String(err.message || err).slice(0, 64)}`);
  }
}

function normalizeHost(host) {
  if (!host) return '';
  const withProtocol = /^https?:\/\//i.test(host) ? host : `https://${host}`;
  return withProtocol.replace(/\/+$/, '');
}

async function resolveLocation(ctx, host, key, input, lang) {
  if (isCoordinate(input)) {
    const [lon, lat] = input.split(',').map(v => v.trim());
    return { name: input, location: `${lon},${lat}`, lon, lat };
  }

  const url = `${host}/geo/v2/city/lookup?location=${encodeURIComponent(input)}&key=${encodeURIComponent(key)}&number=1&lang=${encodeURIComponent(lang)}`;
  const data = await getJSON(ctx, url, 7000);
  if (data.code !== '200' || !data.location || !data.location[0]) {
    throw new Error(data.msg || `城市查询失败 ${data.code || ''}`);
  }

  const city = data.location[0];
  return {
    name: city.name || input,
    location: city.id || `${city.lon},${city.lat}`,
    lon: city.lon,
    lat: city.lat
  };
}

async function fetchNow(ctx, host, key, location, lang, unit) {
  const url = `${host}/v7/weather/now?location=${encodeURIComponent(location)}&key=${encodeURIComponent(key)}&lang=${encodeURIComponent(lang)}&unit=${encodeURIComponent(unit)}`;
  const data = await getJSON(ctx, url, 8000);
  if (data.code !== '200' || !data.now) {
    throw new Error(data.msg || `天气接口返回 ${data.code || ''}`);
  }
  return data.now;
}

async function fetchAirSafely(ctx, host, key, place, lang) {
  if (!place.lon || !place.lat) return null;
  try {
    const url = `${host}/airquality/v1/current/${encodeURIComponent(place.lat)}/${encodeURIComponent(place.lon)}?key=${encodeURIComponent(key)}&lang=${encodeURIComponent(lang)}`;
    const data = await getJSON(ctx, url, 7000);
    const index = data.indexes && (data.indexes.find(i => i.code === 'cn-mee') || data.indexes[0]);
    if (!index) return null;
    return {
      aqi: Math.round(Number(index.aqi)),
      category: index.category || aqiCategory(index.aqi).text,
      color: aqiCategory(index.aqi).color
    };
  } catch {
    return null;
  }
}

async function getJSON(ctx, url, timeout) {
  if (!ctx.http || !ctx.http.get) throw new Error('当前环境不支持 ctx.http.get');

  const resp = await ctx.http.get(url, { timeout });
  if (resp && typeof resp.json === 'function') return await resp.json();
  if (resp && typeof resp.body === 'string') return JSON.parse(resp.body);
  if (typeof resp === 'string') return JSON.parse(resp);
  throw new Error('接口响应格式异常');
}

function renderMedium(now, air, city) {
  const icon = weatherSymbol(now.icon);
  const iconColor = weatherColor(now.icon);
  const updateTime = formatTime(now.obsTime);

  return {
    type: 'widget',
    padding: 16,
    gap: 12,
    backgroundColor: { light: '#F7F9FC', dark: '#111318' },
    children: [
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        gap: 8,
        children: [
          { type: 'image', src: 'sf-symbol:location.fill', width: 13, height: 13, color: { light: '#FF3B30', dark: '#FF453A' } },
          { type: 'text', text: city, font: { size: 17, weight: 'bold' }, textColor: { light: '#111111', dark: '#FFFFFF' }, lineLimit: 1 },
          { type: 'spacer' },
          { type: 'text', text: updateTime, font: { size: 11 }, textColor: { light: '#7A7F87', dark: '#A0A4AD' } }
        ]
      },
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        gap: 14,
        children: [
          { type: 'image', src: `sf-symbol:${icon}`, width: 64, height: 64, color: iconColor },
          {
            type: 'stack',
            direction: 'column',
            flex: 1,
            gap: 2,
            children: [
              { type: 'text', text: `${now.temp}°`, font: { size: 40, weight: 'bold' }, textColor: { light: '#111111', dark: '#FFFFFF' } },
              { type: 'text', text: `${now.text}  体感 ${now.feelsLike || '--'}°`, font: { size: 14 }, textColor: { light: '#4C535C', dark: '#C7CBD1' }, lineLimit: 1 }
            ]
          },
          air ? {
            type: 'stack',
            direction: 'column',
            alignItems: 'center',
            gap: 2,
            children: [
              { type: 'text', text: 'AQI', font: { size: 11 }, textColor: { light: '#7A7F87', dark: '#A0A4AD' } },
              { type: 'text', text: String(air.aqi), font: { size: 22, weight: 'bold' }, textColor: air.color },
              { type: 'text', text: air.category, font: { size: 11 }, textColor: air.color, lineLimit: 1 }
            ]
          } : createMiniMetric('humidity.fill', '湿度', `${now.humidity || '--'}%`, '#0A84FF')
        ]
      },
      {
        type: 'stack',
        direction: 'row',
        gap: 8,
        children: [
          createMetric('humidity.fill', '湿度', `${now.humidity || '--'}%`, '#0A84FF'),
          createMetric('wind', '风向', `${now.windDir || '--'} ${now.windScale || '--'}级`, '#5856D6'),
          createMetric('gauge.medium', '风速', `${now.windSpeed || '--'}km/h`, '#FF9500')
        ]
      }
    ]
  };
}

function renderSmall(now, city) {
  return {
    type: 'widget',
    padding: 14,
    gap: 8,
    backgroundColor: { light: '#F7F9FC', dark: '#111318' },
    children: [
      { type: 'text', text: city, font: { size: 15, weight: 'bold' }, textColor: { light: '#111111', dark: '#FFFFFF' }, lineLimit: 1 },
      { type: 'image', src: `sf-symbol:${weatherSymbol(now.icon)}`, width: 42, height: 42, color: weatherColor(now.icon) },
      { type: 'text', text: `${now.temp}°`, font: { size: 34, weight: 'bold' }, textColor: { light: '#111111', dark: '#FFFFFF' } },
      { type: 'text', text: now.text || '--', font: { size: 13 }, textColor: { light: '#4C535C', dark: '#C7CBD1' }, lineLimit: 1 }
    ]
  };
}

function renderAccessory(now, city) {
  return {
    type: 'widget',
    children: [
      { type: 'text', text: `${city} ${now.temp}° ${now.text || ''}`.trim() }
    ]
  };
}

function renderError(message) {
  return {
    type: 'widget',
    padding: 14,
    backgroundColor: { light: '#FFF5F5', dark: '#1F1111' },
    children: [
      { type: 'text', text: message, font: { size: 13, weight: 'semibold' }, textColor: { light: '#D70015', dark: '#FF453A' }, lineLimit: 3 }
    ]
  };
}

function createMetric(icon, label, value, color) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 5,
    children: [
      { type: 'image', src: `sf-symbol:${icon}`, width: 17, height: 17, color: { light: color, dark: color } },
      {
        type: 'stack',
        direction: 'column',
        gap: 1,
        children: [
          { type: 'text', text: label, font: { size: 10 }, textColor: { light: '#7A7F87', dark: '#A0A4AD' } },
          { type: 'text', text: value, font: { size: 13, weight: 'semibold' }, textColor: { light: '#111111', dark: '#FFFFFF' }, lineLimit: 1 }
        ]
      }
    ]
  };
}

function createMiniMetric(icon, label, value, color) {
  return {
    type: 'stack',
    direction: 'column',
    alignItems: 'center',
    gap: 3,
    children: [
      { type: 'image', src: `sf-symbol:${icon}`, width: 20, height: 20, color: { light: color, dark: color } },
      { type: 'text', text: label, font: { size: 10 }, textColor: { light: '#7A7F87', dark: '#A0A4AD' } },
      { type: 'text', text: value, font: { size: 13, weight: 'semibold' }, textColor: { light: '#111111', dark: '#FFFFFF' } }
    ]
  };
}

function isCoordinate(value) {
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(value);
}

function isAccessoryFamily(family) {
  return String(family || '').startsWith('accessory');
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function aqiCategory(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return { text: '--', color: { light: '#8E8E93', dark: '#8E8E93' } };
  if (n <= 50) return { text: '优', color: { light: '#34C759', dark: '#30D158' } };
  if (n <= 100) return { text: '良', color: { light: '#FFCC00', dark: '#FFD60A' } };
  if (n <= 150) return { text: '轻度', color: { light: '#FF9500', dark: '#FF9F0A' } };
  if (n <= 200) return { text: '中度', color: { light: '#FF3B30', dark: '#FF453A' } };
  if (n <= 300) return { text: '重度', color: { light: '#AF52DE', dark: '#BF5AF2' } };
  return { text: '严重', color: { light: '#8E0D2C', dark: '#FF2D55' } };
}

function weatherSymbol(code) {
  const c = String(code || '');
  const map = {
    100: 'sun.max.fill',
    101: 'cloud.sun.fill',
    102: 'cloud.sun.fill',
    103: 'cloud.sun.fill',
    104: 'cloud.fill',
    150: 'moon.stars.fill',
    151: 'cloud.moon.fill',
    152: 'cloud.moon.fill',
    153: 'cloud.moon.fill',
    300: 'cloud.bolt.rain.fill',
    301: 'cloud.bolt.rain.fill',
    302: 'cloud.bolt.rain.fill',
    303: 'cloud.bolt.rain.fill',
    304: 'cloud.hail.fill',
    305: 'cloud.drizzle.fill',
    306: 'cloud.rain.fill',
    307: 'cloud.heavyrain.fill',
    308: 'cloud.heavyrain.fill',
    309: 'cloud.drizzle.fill',
    310: 'cloud.heavyrain.fill',
    311: 'cloud.heavyrain.fill',
    312: 'cloud.heavyrain.fill',
    313: 'cloud.sleet.fill',
    314: 'cloud.rain.fill',
    315: 'cloud.rain.fill',
    316: 'cloud.heavyrain.fill',
    317: 'cloud.heavyrain.fill',
    318: 'cloud.heavyrain.fill',
    350: 'cloud.rain.fill',
    351: 'cloud.rain.fill',
    399: 'cloud.rain.fill',
    400: 'snowflake',
    401: 'snowflake',
    402: 'snowflake',
    403: 'snowflake',
    404: 'cloud.sleet.fill',
    405: 'cloud.sleet.fill',
    406: 'cloud.sleet.fill',
    407: 'snowflake',
    408: 'snowflake',
    409: 'snowflake',
    410: 'snowflake',
    456: 'cloud.sleet.fill',
    457: 'snowflake',
    499: 'snowflake',
    500: 'aqi.medium',
    501: 'cloud.fog.fill',
    502: 'aqi.high',
    503: 'sun.dust.fill',
    504: 'sun.dust.fill',
    507: 'sun.dust.fill',
    508: 'sun.dust.fill',
    509: 'cloud.fog.fill',
    510: 'cloud.fog.fill',
    511: 'aqi.medium',
    512: 'aqi.high',
    513: 'aqi.high',
    514: 'cloud.fog.fill',
    515: 'cloud.fog.fill'
  };
  return map[c] || 'cloud.sun.fill';
}

function weatherColor(code) {
  const n = Number(code);
  if (n >= 100 && n <= 153) return { light: '#FF9500', dark: '#FFB340' };
  if (n >= 300 && n <= 399) return { light: '#0A84FF', dark: '#64D2FF' };
  if (n >= 400 && n <= 499) return { light: '#5AC8FA', dark: '#64D2FF' };
  if (n >= 500 && n <= 599) return { light: '#8E8E93', dark: '#A0A4AD' };
  return { light: '#0A84FF', dark: '#64D2FF' };
}
