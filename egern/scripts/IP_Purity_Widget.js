/**
 * IP 纯净度 · Egern 小组件（数据来自 IPPure）
 *
 * 接口：https://my.ippure.com/v1/info（IPPure 公开接口，测试阶段）
 *   fraudScore     风险分 0–100，越高越容易被风控；IPv6 不评分
 *   isResidential  住宅宽带 / 机房
 *   isBroadcast    广播 IP（注册地和所在地不同）/ 原生 IP
 *
 * 样式：一条「试纸」。五格从极净到很差，风险分落在哪格，哪格就显色凸起；
 * 分数居中放在试纸上方，下方的小三角对准亮起的那一格，最下面一排是五个档位名。
 * 分档是小组件自己定的（IPPure 没有公布）：0–19 极净，20–39 纯净，40–59 一般，60–79 较差，80 以上很差。
 *
 * 布局注意（真机上确认过）：Egern 里带 flex 的元素横竖两个方向都会撑满，写了 height 也只是可见部分的高度；
 * 装着它的 row 会跟着被纵向拉高，同一列里的 spacer 被压成 0。所以凡是装着 flex 子元素的 row 都写明 height，
 * 只有中号中间那一行是故意让它撑满页眉和页脚之间的空间。
 *
 * 模块：egern/module/IP_Purity_Widget.yaml
 *
 * Env（都可选）：
 *   POLICY           检测哪个策略组或节点的出口 IP；留空按 Egern 分流规则
 *   MARK_IP          IP 打码，默认 true
 *   REFRESH_MINUTES  刷新间隔（分钟），默认 10
 *   LABEL            名称，用来区分多个小组件（小号、大号在 IP 右边，中号在右下角）；不填时显示检测策略名
 */

const API_URL = 'https://my.ippure.com/v1/info';
const SITE_URL = 'https://ippure.com/';
const TIMEOUT = 8000;

// 矿泉水般的冷白 / 深水色底，墨绿的字；颜色只用来表达含义
const C = {
  bg: { light: '#EEF2F0', dark: '#0E1719' },
  ink: { light: '#12201F', dark: '#E8F0EE' },
  soft: { light: '#566765', dark: '#93A6A3' },
  faint: { light: '#8A9A98', dark: '#5C6E6B' },
  good: { light: '#0F8F82', dark: '#3CCFBD' },
  warn: { light: '#B4600F', dark: '#F0A040' },
};

const BANDS = [
  { min: 0, name: '极净', light: '#0F8F82', dark: '#2CC4B3' },
  { min: 20, name: '纯净', light: '#4E9A2A', dark: '#84CC52' },
  { min: 40, name: '一般', light: '#A87F00', dark: '#E9BE2C' },
  { min: 60, name: '较差', light: '#C9601C', dark: '#F08C42' },
  { min: 80, name: '很差', light: '#C8323C', dark: '#F05A62' },
];
const solid = band => ({ light: band.light, dark: band.dark });
const faded = band => ({ light: `${band.light}2E`, dark: `${band.dark}33` });

// 分数用 DIN Condensed（像检测仪器上的读数），IP 和 ASN 用 DIN Alternate；中文跟随系统字体
const READOUT = 'DIN Condensed';
const FIGURES = 'DIN Alternate';

const COUNTRY_ZH = {
  HK: '香港', MO: '澳门', TW: '台湾', CN: '中国', JP: '日本', KR: '韩国', SG: '新加坡', MY: '马来西亚',
  TH: '泰国', VN: '越南', PH: '菲律宾', ID: '印尼', IN: '印度', AU: '澳大利亚', NZ: '新西兰', US: '美国',
  CA: '加拿大', MX: '墨西哥', BR: '巴西', AR: '阿根廷', CL: '智利', GB: '英国', IE: '爱尔兰', DE: '德国',
  FR: '法国', NL: '荷兰', BE: '比利时', LU: '卢森堡', CH: '瑞士', AT: '奥地利', IT: '意大利', ES: '西班牙',
  PT: '葡萄牙', SE: '瑞典', NO: '挪威', DK: '丹麦', FI: '芬兰', PL: '波兰', CZ: '捷克', RO: '罗马尼亚',
  BG: '保加利亚', HU: '匈牙利', GR: '希腊', UA: '乌克兰', TR: '土耳其', IL: '以色列', AE: '阿联酋',
  SA: '沙特', QA: '卡塔尔', ZA: '南非', EG: '埃及', NG: '尼日利亚', KZ: '哈萨克斯坦', RU: '俄罗斯',
  PK: '巴基斯坦', BD: '孟加拉',
};

// ───────────────────────────── 入口 ─────────────────────────────

export default async function (ctx) {
  const cfg = readEnv(ctx);
  const family = ctx.widgetFamily || 'systemMedium';
  let m;
  try {
    m = buildModel(await fetchInfo(ctx, cfg), cfg);
  } catch (error) {
    const err = error instanceof WidgetError ? error : new WidgetError('出错了', shorten(error?.message || error, 80));
    return errorWidget(family, cfg, err);
  }

  switch (family) {
    case 'accessoryInline': return inlineWidget(m);
    case 'accessoryCircular': return circularWidget(m);
    case 'accessoryRectangular': return rectangularWidget(m);
    case 'systemSmall': return smallWidget(m);
    case 'systemLarge':
    case 'systemExtraLarge': return largeWidget(m);
    default: return mediumWidget(m);
  }
}

function readEnv(ctx) {
  const env = ctx.env || {};
  const get = key => String(env[key] ?? '').trim();
  const minutes = Number(get('REFRESH_MINUTES'));
  return {
    policy: get('POLICY'),
    markIP: !/^(false|0|no|off)$/i.test(get('MARK_IP')),
    refreshMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.min(720, Math.max(5, minutes)) : 10,
    label: get('LABEL'),
  };
}

// ───────────────────────────── 数据 ─────────────────────────────

class WidgetError extends Error {
  constructor(title, hint) {
    super(title);
    this.title = title;
    this.hint = hint || '';
  }
}

async function fetchInfo(ctx, cfg) {
  const options = { timeout: TIMEOUT };
  if (cfg.policy) options.policy = cfg.policy;

  let text = '';
  try {
    const response = await ctx.http.get(API_URL, options);
    const status = Number(response.status);
    text = await response.text();
    if (status >= 400) throw httpError(status, cfg);
  } catch (error) {
    if (error instanceof WidgetError) throw error;
    const message = String(error?.message || error || '');
    // Egern 收到 4xx/5xx 时不返回响应，而是抛出「HTTP error! status: 429, body: …」
    const thrown = message.match(/HTTP error!?\s*status:?\s*(\d{3})/i);
    if (thrown) throw httpError(Number(thrown[1]), cfg);
    const where = cfg.policy ? `检查策略「${cfg.policy}」是否可用。` : '检查网络和分流规则。';
    const title = /timed?\s*out|timeout/i.test(message) ? '连接 IPPure 超时' : '连不上 IPPure';
    throw new WidgetError(title, `${where}${shorten(message, 60)}`);
  }

  const data = parseJSON(text);
  if (!data || typeof data !== 'object') throw new WidgetError('IPPure 没返回数据', '接口可能在维护，稍后会自动重试。');
  if (!data.ip) throw new WidgetError('IPPure 没返回 IP', '接口可能在维护，稍后会自动重试。');
  return data;
}

function httpError(status, cfg) {
  if (status === 429) return new WidgetError('IPPure 请求太频繁', '稍后会自动重试，也可以把刷新间隔调大。');
  if (status === 403) {
    const node = cfg.policy ? `（当前策略「${cfg.policy}」）` : '';
    return new WidgetError('IPPure 拒绝了这次请求', `出口可能被它拦截，换个节点试试${node}。`);
  }
  return new WidgetError(`IPPure 出错，HTTP ${status}`, '稍后会自动重试。');
}

function buildModel(data, cfg) {
  const ip = String(data.ip);
  const score = readScore(data.fraudScore);
  const code = String(data.countryCode || '').trim().toUpperCase();
  const country = COUNTRY_ZH[code] || String(data.country || code || '未知地区');
  const city = String(data.city || data.region || '').trim();
  const sameAsCountry = !city || [country, data.country, code].some(x => x && String(x).toLowerCase() === city.toLowerCase());

  return {
    ip,
    shownIP: cfg.markIP ? maskIP(ip) : ip,
    isV6: ip.includes(':'),
    score,
    band: score === null ? null : BANDS.filter(band => score >= band.min).pop(),
    flag: flagEmoji(code),
    country,
    city: sameAsCountry ? '' : city,
    asn: Number(data.asn) > 0 ? `AS${Number(data.asn)}` : '',
    org: String(data.asOrganization || '').trim(),
    residential: readBool(data.isResidential),
    broadcast: readBool(data.isBroadcast),
    timezone: String(data.timezone || '').trim(),
    name: cfg.label || cfg.policy,
    policy: cfg.policy,
    time: clock(),
    refreshMinutes: cfg.refreshMinutes,
  };
}

function readScore(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
}

function readBool(value) {
  if (value === true || value === 'true' || value === 1) return true;
  if (value === false || value === 'false' || value === 0) return false;
  return null;
}

// 原生 / 广播，住宅 / 机房：对代理用户有利的一侧用青绿色
function traits(m) {
  const list = [];
  if (m.broadcast !== null) {
    list.push(m.broadcast
      ? { icon: 'dot.radiowaves.left.and.right', short: '广播', long: '广播 IP，注册地和所在地不同', good: false }
      : { icon: 'checkmark.seal.fill', short: '原生', long: '原生 IP', good: true });
  }
  if (m.residential !== null) {
    list.push(m.residential
      ? { icon: 'house.fill', short: '住宅', long: '住宅宽带', good: true }
      : { icon: 'server.rack', short: '机房', long: '机房（数据中心）', good: false });
  }
  return list;
}

// ───────────────────────────── 小工具 ─────────────────────────────

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function shorten(value, max) {
  const text = String(value ?? '').replace(/^\w*Error:\s*/, '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function maskIP(ip) {
  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean);
    return parts.length >= 3 ? `${parts[0]}:${parts[1]}:••:${parts[parts.length - 1]}` : ip;
  }
  const parts = ip.split('.');
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.••.${parts[3]}` : ip;
}

function flagEmoji(code) {
  if (!/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...[...code].map(char => 127397 + char.charCodeAt(0)));
}

function clock() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function refreshAt(minutes) {
  return new Date(Date.now() + minutes * 60000).toISOString();
}

// ───────────────────────────── DSL ─────────────────────────────

function T(text, size, color, weight = 'regular', extra = {}) {
  const font = { size, weight };
  if (extra.family) font.family = extra.family;
  const el = { type: 'text', text: String(text), font, maxLines: 1 };
  if (color) el.textColor = color;
  const { family, ...rest } = extra;
  return { ...el, ...rest };
}

function row(children, extra = {}) {
  return { type: 'stack', direction: 'row', alignItems: 'center', children: children.filter(Boolean), ...extra };
}

function col(children, extra = {}) {
  return { type: 'stack', direction: 'column', alignItems: 'start', children: children.filter(Boolean), ...extra };
}

function spacer(length) {
  return length === undefined ? { type: 'spacer' } : { type: 'spacer', length };
}

function icon(name, size, color) {
  const el = { type: 'image', src: `sf-symbol:${name}`, width: size, height: size };
  if (color) el.color = color;
  return el;
}

function center(child, height) {
  return row([spacer(), child, spacer()], height ? { height } : {});
}

// 和试纸对齐的五格：每格 flex 1、间距 3，跟试纸的五段一样宽，格子里的东西就正对着那一段。
// 格子带 flex 会把这一行撑高，所以 height 必须写明
function fiveCells(fill, height) {
  return row(BANDS.map((band, i) => ({ type: 'stack', direction: 'row', flex: 1, children: fill(band, i) })), { gap: 3, height });
}

// ───────────────────────────── 试纸 ─────────────────────────────

// 读数：分数加档位名；没有分数时（IPv6 或接口没给）显示原因
function reading(m, numberSize, nameSize) {
  if (m.score === null) {
    return T(m.isV6 ? 'IPv6 不评分' : '暂无评分', nameSize + 2, C.soft, 'semibold');
  }
  // 档位名和数字居中对齐；按底边对齐时，数字下方的留白会让档位名看起来往下掉
  return row([
    T(String(Math.round(m.score)), numberSize, C.ink, 'bold', { family: READOUT }),
    T(m.band.name, nameSize, solid(m.band), 'semibold'),
  ], { gap: Math.max(3, Math.round(numberSize / 9)) });
}

function strip(m, height) {
  const active = m.band ? BANDS.indexOf(m.band) : -1;
  return row(BANDS.map((band, i) => {
    const h = i === active ? height + 4 : height;
    return {
      type: 'stack',
      flex: 1,
      height: h,
      borderRadius: h / 2,
      backgroundColor: i === active ? solid(band) : faded(band),
      children: [],
    };
  }), { gap: 3, height: height + 4 });
}

// 小三角放在亮起那一格的正中间
function pointer(m, size) {
  if (!m.band) return null;
  const height = Math.round(size * 0.8);
  const mark = { type: 'image', src: 'sf-symbol:triangle.fill', width: size, height, color: C.ink };
  return fiveCells(band => (band === m.band ? [spacer(), mark, spacer()] : []), height);
}

// 每一格下面的档位名，亮起那一格用它的颜色加粗
function legend(m, size) {
  return fiveCells(band => [
    spacer(),
    T(band.name, size, band === m.band ? solid(band) : C.faint, band === m.band ? 'semibold' : 'regular'),
    spacer(),
  ], size + 6);
}

// 读数、试纸、小三角、档位名从上到下排好；三个尺寸只是字号和间距不同。
// 读数那一行的高度取数字字号，DIN Condensed 行框上下多出来的空白就不会把试纸推远
function gauge(m, s) {
  return [
    center(reading(m, s.number, s.name), s.number),
    spacer(s.gap),
    strip(m, s.bar),
    spacer(s.gap + 3), // 小三角和试纸之间留出空隙
    pointer(m, s.pointer),
    m.band ? spacer(2) : null,
    legend(m, s.legend),
  ];
}

// ───────────────────────────── 布局 ─────────────────────────────

function placeRow(m, size, withCity) {
  return row([
    T(m.flag, size),
    T(m.country, size, C.ink, 'semibold'),
    withCity && m.city ? T(m.city, size, C.soft, 'regular', { minScale: 0.6 }) : null,
    spacer(),
    T(m.time, Math.max(9, size - 3), C.faint, 'medium'),
  ], { gap: 5 });
}

// IP 是这台出口的身份，用深色大字，不再当成次要信息；没打码的 IPv6 很长，允许缩得更小
function ipText(m, size, extra = {}) {
  return T(m.shownIP, size, C.ink, 'bold', { family: FIGURES, minScale: m.shownIP.length > 18 ? 0.4 : 0.6, ...extra });
}

// IP 占满左边剩下的宽度（太长时才能缩小），名称贴右；行里有 flex，所以写明行高
function ipRow(m, size, nameSize) {
  return row([
    ipText(m, size, { flex: 1 }),
    m.name ? T(m.name, nameSize, C.faint, 'medium', { minScale: 0.7 }) : null,
  ], { gap: 6, height: Math.ceil(size * 1.3) });
}

function traitView(t, size) {
  return row([
    icon(t.icon, size, t.good ? C.good : C.faint),
    T(t.short, size + 1, t.good ? C.ink : C.soft, 'medium'),
  ], { gap: 3 });
}

// ASN 加完整的运营商名称，合成一段文字直接放在列里，按列宽折行（最多两行），不用 flex
function networkText(m, size) {
  const text = [m.asn, m.org].filter(Boolean).join(' · ');
  return text ? T(text, size, C.soft, 'medium', { maxLines: 2, minScale: 0.85 }) : null;
}

function root(children, padding, m) {
  return {
    type: 'widget',
    backgroundColor: C.bg,
    padding,
    gap: 0,
    url: SITE_URL,
    refreshAfter: refreshAt(m.refreshMinutes),
    children: children.filter(Boolean),
  };
}

function smallWidget(m) {
  return root([
    placeRow(m, 12, false),
    spacer(3),
    ipRow(m, 14, 9),
    spacer(),
    ...gauge(m, { number: 28, name: 11, bar: 5, pointer: 8, legend: 9, gap: 3 }),
    spacer(),
    row(traits(m).map(t => traitView(t, 10)), { gap: 9 }),
  ], [12, 13, 11, 13], m);
}

// 中号是三行：顶行地区和时间；中间一行左边 IP 和运营商、右边分数和试纸，两边各自上下居中；底行类型和名称
function mediumWidget(m) {
  const identity = col([
    spacer(),
    ipText(m, 24),
    spacer(4),
    networkText(m, 11),
    spacer(),
  ], { flex: 4 });

  const verdict = col([
    spacer(),
    ...gauge(m, { number: 30, name: 12, bar: 6, pointer: 10, legend: 10, gap: 4 }),
    spacer(),
  ], { flex: 3 });

  return root([
    placeRow(m, 13, true),
    spacer(4),
    // 两栏都带 flex，这一行会撑满页眉和页脚之间的高度（根列里没有可伸缩的 spacer 跟它抢）
    row([identity, verdict], { gap: 14 }),
    spacer(4),
    row([
      ...traits(m).map(t => traitView(t, 10)),
      spacer(),
      m.name ? T(m.name, 10, C.faint, 'medium', { minScale: 0.7 }) : null,
    ], { gap: 10 }),
  ], [14, 16, 13, 16], m);
}

function detail(label, value, good) {
  return row([
    { type: 'stack', direction: 'row', width: 36, children: [T(label, 12, C.faint, 'medium'), spacer()] },
    T(value, 13, good ? C.good : C.ink, 'medium', { minScale: 0.7, flex: 1 }),
  ], { gap: 8, height: 18 });
}

function largeWidget(m) {
  const kinds = traits(m);
  const source = kinds.find(t => t.short === '原生' || t.short === '广播');
  const kind = kinds.find(t => t.short === '住宅' || t.short === '机房');
  return root([
    placeRow(m, 16, true),
    spacer(4),
    ipRow(m, 22, 12),
    spacer(),
    ...gauge(m, { number: 56, name: 16, bar: 11, pointer: 13, legend: 12, gap: 5 }),
    spacer(),
    col([
      detail('类型', kind ? kind.long : '未知', kind?.good),
      detail('来源', source ? source.long : '未知', source?.good),
      detail('网络', [m.asn, m.org].filter(Boolean).join(' ') || '未知'),
      m.timezone ? detail('时区', m.timezone) : null,
      detail('检测', m.policy ? `策略「${m.policy}」` : '跟随分流规则'),
    ], { gap: 6 }),
  ], [16, 16, 15, 16], m);
}

// ───────────────────────────── 锁屏 ─────────────────────────────

function gaugeSvg(ratio) {
  const point = deg => {
    const rad = (deg * Math.PI) / 180;
    return `${(50 + 40 * Math.sin(rad)).toFixed(2)} ${(50 - 40 * Math.cos(rad)).toFixed(2)}`;
  };
  const arc = (from, to, stroke) =>
    `<path d='M ${point(from)} A 40 40 0 ${to - from > 180 ? 1 : 0} 1 ${point(to)}' fill='none' stroke='${stroke}' stroke-width='9' stroke-linecap='round'/>`;
  const p = Math.min(1, Math.max(0, ratio));
  const track = arc(-135, 135, 'rgba(255,255,255,0.3)');
  const value = p > 0.01 ? arc(-135, -135 + 270 * p, 'rgb(255,255,255)') : '';
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${track}${value}</svg>`;
}

function circularWidget(m) {
  return {
    type: 'widget',
    padding: 0,
    url: SITE_URL,
    refreshAfter: refreshAt(m.refreshMinutes),
    children: [{
      type: 'stack',
      direction: 'column',
      alignItems: 'center',
      flex: 1,
      backgroundImage: gaugeSvg(m.score === null ? 0 : m.score / 100),
      children: [
        spacer(),
        center(T(m.score === null ? '—' : String(Math.round(m.score)), 18, null, 'bold', { family: READOUT })),
        center(T(m.band ? m.band.name : m.isV6 ? 'IPv6' : '未评分', 9, null, 'medium')),
        spacer(),
      ],
    }],
  };
}

function rectangularWidget(m) {
  const kinds = traits(m).map(t => t.short).join(' ');
  return {
    type: 'widget',
    gap: 1,
    url: SITE_URL,
    refreshAfter: refreshAt(m.refreshMinutes),
    children: [
      row([T(m.flag, 12), T([m.country, m.city].filter(Boolean).join(' '), 13, null, 'semibold', { minScale: 0.6 })], { gap: 4 }),
      row([
        T(m.score === null ? '—' : String(Math.round(m.score)), 17, null, 'bold', { family: READOUT }),
        T(m.band ? m.band.name : m.isV6 ? 'IPv6 不评分' : '暂无评分', 12, null, 'semibold'),
      ], { gap: 4 }),
      T(kinds || m.shownIP, 12, null, 'regular', { minScale: 0.6 }),
    ],
  };
}

function inlineWidget(m) {
  const score = m.score === null ? '' : `${Math.round(m.score)} ${m.band.name}`;
  const text = [m.flag, score || (m.isV6 ? 'IPv6 不评分' : '暂无评分'), ...traits(m).map(t => t.short)].join(' ');
  return { type: 'widget', url: SITE_URL, refreshAfter: refreshAt(m.refreshMinutes), children: [T(text, 12, null)] };
}

// ───────────────────────────── 出错 ─────────────────────────────

function errorWidget(family, cfg, err) {
  const refreshAfter = refreshAt(Math.min(cfg.refreshMinutes, 10));
  const base = { type: 'widget', url: SITE_URL, refreshAfter };
  if (family === 'accessoryInline') return { ...base, children: [T(err.title, 12, null)] };
  if (family === 'accessoryCircular') {
    return { ...base, padding: 0, children: [spacer(), center(icon('exclamationmark.triangle', 22, null)), spacer()] };
  }
  if (family === 'accessoryRectangular') {
    return { ...base, gap: 2, children: [T('IP 纯净度', 13, null, 'semibold'), T(err.title, 12, null, 'regular', { maxLines: 2, minScale: 0.7 })] };
  }
  return {
    ...base,
    backgroundColor: C.bg,
    padding: 14,
    gap: 6,
    children: [
      row([icon('exclamationmark.triangle.fill', 13, C.warn), T(err.title, 14, C.ink, 'semibold', { minScale: 0.7 })], { gap: 6 }),
      T(err.hint, 11, C.soft, 'regular', { maxLines: family === 'systemSmall' ? 5 : 3, minScale: 0.8 }),
      spacer(),
      row([T(cfg.label || cfg.policy || 'IP 纯净度', 10, C.faint, 'medium'), spacer(), T(clock(), 10, C.faint, 'medium')]),
    ],
  };
}
