const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

const COLORS = {
  background: { light: '#F7F9FC', dark: '#101418' },
  card: { light: '#FFFFFF', dark: '#1B2227' },
  cardSubtle: { light: '#EEF3F7', dark: '#202A31' },
  text: { light: '#101418', dark: '#F7F9FC' },
  muted: { light: '#68737D', dark: '#A7B0B8' },
  faint: { light: '#8A949E', dark: '#7F8A94' },
  accent: { light: '#0A7A5A', dark: '#35D399' },
  trophy: { light: '#D4A017', dark: '#FFD60A' },
  live: { light: '#D70015', dark: '#FF453A' },
  finished: { light: '#475569', dark: '#CBD5E1' },
  error: { light: '#D70015', dark: '#FF453A' },
};

const FONT_SIZE = {
  header: 14,
  headerMeta: 11,
  dayTitle: 14,
  match: 11,
};

const MATCH_GRID_WIDTH = {
  date: 38,
  time: 42,
  status: 52,
  home: 76,
  score: 28,
  away: 76,
};

const TEAM_DATA = {
  ALB: team('阿尔巴尼亚', 'AL', ['Albania']),
  ALG: team('阿尔及利亚', 'DZ', ['Algeria']),
  ANG: team('安哥拉', 'AO', ['Angola']),
  ARG: team('阿根廷', 'AR', ['Argentina']),
  AUS: team('澳大利亚', 'AU', ['Australia']),
  AUT: team('奥地利', 'AT', ['Austria']),
  BEL: team('比利时', 'BE', ['Belgium']),
  BEN: team('贝宁', 'BJ', ['Benin']),
  BFA: team('布基纳法索', 'BF', ['Burkina Faso']),
  BIH: team('波黑', 'BA', ['Bosnia and Herzegovina', 'Bosnia-Herzegovina']),
  BOL: team('玻利维亚', 'BO', ['Bolivia']),
  BRA: team('巴西', 'BR', ['Brazil']),
  BUL: team('保加利亚', 'BG', ['Bulgaria']),
  CAN: team('加拿大', 'CA', ['Canada']),
  CHI: team('智利', 'CL', ['Chile']),
  CHN: team('中国', 'CN', ['China PR', 'China']),
  CIV: team('科特迪瓦', 'CI', ["Cote d'Ivoire", "Côte d'Ivoire", 'Ivory Coast']),
  CMR: team('喀麦隆', 'CM', ['Cameroon']),
  COD: team('民主刚果', 'CD', ['Congo DR', 'DR Congo', 'Congo-Kinshasa']),
  COL: team('哥伦比亚', 'CO', ['Colombia']),
  CPV: team('佛得角', 'CV', ['Cape Verde', 'Cabo Verde']),
  CRC: team('哥斯达黎加', 'CR', ['Costa Rica']),
  CRO: team('克罗地亚', 'HR', ['Croatia']),
  CUW: team('库拉索', 'CW', ['Curaçao', 'Curacao']),
  CZE: team('捷克', 'CZ', ['Czechia', 'Czech Republic']),
  DEN: team('丹麦', 'DK', ['Denmark']),
  DOM: team('多米尼加', 'DO', ['Dominican Republic']),
  ECU: team('厄瓜多尔', 'EC', ['Ecuador']),
  EGY: team('埃及', 'EG', ['Egypt']),
  ENG: team('英格兰', 'GB', ['England']),
  ESP: team('西班牙', 'ES', ['Spain']),
  SLV: team('萨尔瓦多', 'SV', ['El Salvador']),
  FIN: team('芬兰', 'FI', ['Finland']),
  FRA: team('法国', 'FR', ['France']),
  GAB: team('加蓬', 'GA', ['Gabon']),
  GEO: team('格鲁吉亚', 'GE', ['Georgia']),
  GER: team('德国', 'DE', ['Germany']),
  GHA: team('加纳', 'GH', ['Ghana']),
  GRE: team('希腊', 'GR', ['Greece']),
  GUA: team('危地马拉', 'GT', ['Guatemala']),
  HAI: team('海地', 'HT', ['Haiti']),
  HON: team('洪都拉斯', 'HN', ['Honduras']),
  HUN: team('匈牙利', 'HU', ['Hungary']),
  IDN: team('印度尼西亚', 'ID', ['Indonesia']),
  IND: team('印度', 'IN', ['India']),
  IRN: team('伊朗', 'IR', ['Iran', 'IR Iran']),
  IRQ: team('伊拉克', 'IQ', ['Iraq']),
  ISL: team('冰岛', 'IS', ['Iceland']),
  ISR: team('以色列', 'IL', ['Israel']),
  ITA: team('意大利', 'IT', ['Italy']),
  JAM: team('牙买加', 'JM', ['Jamaica']),
  JOR: team('约旦', 'JO', ['Jordan']),
  JPN: team('日本', 'JP', ['Japan']),
  KOR: team('韩国', 'KR', ['Korea Republic', 'South Korea', 'Republic of Korea']),
  KSA: team('沙特阿拉伯', 'SA', ['Saudi Arabia']),
  KUW: team('科威特', 'KW', ['Kuwait']),
  MAR: team('摩洛哥', 'MA', ['Morocco']),
  MAS: team('马来西亚', 'MY', ['Malaysia']),
  MEX: team('墨西哥', 'MX', ['Mexico']),
  MKD: team('北马其顿', 'MK', ['North Macedonia', 'Macedonia FYR']),
  MLI: team('马里', 'ML', ['Mali']),
  MNE: team('黑山', 'ME', ['Montenegro']),
  NED: team('荷兰', 'NL', ['Netherlands', 'Holland']),
  NGA: team('尼日利亚', 'NG', ['Nigeria']),
  NIR: team('北爱尔兰', 'GB', ['Northern Ireland']),
  NOR: team('挪威', 'NO', ['Norway']),
  NZL: team('新西兰', 'NZ', ['New Zealand']),
  OMA: team('阿曼', 'OM', ['Oman']),
  PAN: team('巴拿马', 'PA', ['Panama']),
  PAR: team('巴拉圭', 'PY', ['Paraguay']),
  PER: team('秘鲁', 'PE', ['Peru']),
  POL: team('波兰', 'PL', ['Poland']),
  POR: team('葡萄牙', 'PT', ['Portugal']),
  PRK: team('朝鲜', 'KP', ['Korea DPR', 'North Korea']),
  QAT: team('卡塔尔', 'QA', ['Qatar']),
  ROU: team('罗马尼亚', 'RO', ['Romania']),
  RSA: team('南非', 'ZA', ['South Africa']),
  RUS: team('俄罗斯', 'RU', ['Russia']),
  SCO: team('苏格兰', 'GB', ['Scotland']),
  SEN: team('塞内加尔', 'SN', ['Senegal']),
  SRB: team('塞尔维亚', 'RS', ['Serbia']),
  SUR: team('苏里南', 'SR', ['Suriname']),
  SUI: team('瑞士', 'CH', ['Switzerland']),
  SVK: team('斯洛伐克', 'SK', ['Slovakia']),
  SVN: team('斯洛文尼亚', 'SI', ['Slovenia']),
  SWE: team('瑞典', 'SE', ['Sweden']),
  THA: team('泰国', 'TH', ['Thailand']),
  TRI: team('特立尼达和多巴哥', 'TT', ['Trinidad and Tobago']),
  TUN: team('突尼斯', 'TN', ['Tunisia']),
  TUR: team('土耳其', 'TR', ['Turkey', 'Türkiye']),
  UAE: team('阿联酋', 'AE', ['United Arab Emirates', 'UAE']),
  UKR: team('乌克兰', 'UA', ['Ukraine']),
  URU: team('乌拉圭', 'UY', ['Uruguay']),
  USA: team('美国', 'US', ['United States', 'USA', 'United States of America']),
  UZB: team('乌兹别克斯坦', 'UZ', ['Uzbekistan']),
  VEN: team('委内瑞拉', 'VE', ['Venezuela']),
  VIE: team('越南', 'VN', ['Vietnam']),
  WAL: team('威尔士', 'GB', ['Wales']),
};

const TEAM_BY_NAME = buildTeamNameIndex();

export default async function(ctx) {
  const env = ctx.env || {};
  const now = new Date();

  let state;
  try {
    state = await loadMatches(ctx, env, now);
  } catch (error) {
    state = {
      matches: [],
      error: error && error.message ? error.message : String(error),
    };
  }

  const days = buildDays(state.matches, now);
  const family = ctx.widgetFamily || 'systemMedium';

  if (family === 'accessoryInline') return renderInline(days);
  if (family === 'accessoryCircular') return renderCircular(days);
  if (family === 'accessoryRectangular') return renderRectangular(days);
  if (family === 'systemSmall') return renderSmall(days, state, now);
  if (family === 'systemLarge' || family === 'systemExtraLarge') return renderLarge(days, state, now);
  return renderMedium(days, state, now);
}

async function loadMatches(ctx, env, now) {
  let raw = null;

  if (env.MATCHES_JSON) {
    raw = JSON.parse(env.MATCHES_JSON);
  } else {
    const resp = await ctx.http.get(buildApiUrl(env, now), {
      timeout: Number(env.TIMEOUT || 10000),
      headers: buildHeaders(env),
    });

    if (resp.status < 200 || resp.status >= 300) {
      throw new Error('数据请求失败：HTTP ' + resp.status);
    }

    raw = await resp.json();
  }

  return {
    matches: normalizeMatches(raw, now),
    error: '',
  };
}

function isEspnSource(env) {
  return dataSource(env) === 'espn';
}

function isFootballDataSource(env) {
  const source = dataSource(env);
  return source === 'football-data' || source === 'football-data.org' || source === 'footballdata';
}

function dataSource(env) {
  return String(env.DATA_SOURCE || env.PROVIDER || (env.API_URL ? '' : 'espn')).toLowerCase();
}

function buildApiUrl(env, now) {
  const from = addDays(now, -1);
  const to = addDays(now, 1);
  const espnFrom = addDays(now, -2);
  const footballDataFrom = addDays(now, -2);
  const competitionCode = encodeURIComponent(String(env.COMPETITION_CODE || 'WC').trim() || 'WC');
  const values = {
    dates: compactDay(from) + '-' + compactDay(to),
    espnDates: compactDay(espnFrom) + '-' + compactDay(to),
    dateFrom: dayKey(from),
    dateTo: dayKey(to),
    footballDataDateFrom: dayKey(footballDataFrom),
    footballDataDateTo: dayKey(to),
    yyyymmddFrom: compactDay(from),
    yyyymmddTo: compactDay(to),
  };

  if (env.API_URL_TEMPLATE) return fillTemplate(env.API_URL_TEMPLATE, values);

  if (isEspnSource(env) && !env.API_URL) {
    const league = env.ESPN_LEAGUE || 'fifa.world';
    return 'https://site.api.espn.com/apis/site/v2/sports/soccer/' + league + '/scoreboard?limit=500&dates=' + values.espnDates;
  }

  if (isFootballDataSource(env) && !env.API_URL) {
    return 'https://api.football-data.org/v4/competitions/' + competitionCode + '/matches?dateFrom=' + values.footballDataDateFrom + '&dateTo=' + values.footballDataDateTo;
  }

  if (isEspnSource(env) && env.API_URL.indexOf('dates=') < 0) {
    return appendQuery(env.API_URL, {
      limit: env.LIMIT || '500',
      dates: values.espnDates,
    });
  }

  if (isFootballDataSource(env) && env.API_URL.indexOf('dateFrom=') < 0 && env.API_URL.indexOf('dateTo=') < 0) {
    return appendQuery(env.API_URL, {
      dateFrom: values.footballDataDateFrom,
      dateTo: values.footballDataDateTo,
    });
  }

  return fillTemplate(env.API_URL, values);
}

function fillTemplate(template, values) {
  return template.replace(/\{(dates|espnDates|dateFrom|dateTo|footballDataDateFrom|footballDataDateTo|yyyymmddFrom|yyyymmddTo)\}/g, function(_, key) {
    return values[key];
  });
}

function appendQuery(url, params) {
  const joiner = url.indexOf('?') >= 0 ? '&' : '?';
  return url + joiner + Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');
}

function buildHeaders(env) {
  if (env.API_HEADERS) return JSON.parse(env.API_HEADERS);
  if (!env.API_KEY) return {};

  const name = env.API_KEY_HEADER || (isFootballDataSource(env) ? 'X-Auth-Token' : 'Authorization');
  const prefix = env.API_KEY_PREFIX == null ? (isFootballDataSource(env) ? '' : 'Bearer ') : env.API_KEY_PREFIX;
  return Object.fromEntries([[name, prefix + env.API_KEY]]);
}

function normalizeMatches(raw, now) {
  const list = pickMatchArray(raw);
  return list.map(function(item) {
    return normalizeOne(item, now);
  }).filter(function(match) {
    return match && match.kickoff && match.home && match.away;
  }).sort(function(a, b) {
    return a.kickoff.getTime() - b.kickoff.getTime();
  });
}

function pickMatchArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];

  const candidates = [
    raw.matches,
    raw.data,
    raw.data && raw.data.matches,
    raw.events,
    raw.fixtures,
    raw.response,
    raw.result,
    raw.schedule,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function normalizeOne(item, now) {
  const homeCompetitor = findCompetitor(item, 'home');
  const awayCompetitor = findCompetitor(item, 'away');
  const kickoffValue = pick(item, [
    'kickoff',
    'kickoffAt',
    'startTime',
    'matchTime',
    'utcDate',
    'date',
    'time',
    'fixture.date',
  ]);
  const kickoff = toDate(kickoffValue);
  if (!kickoff) return null;

  const homeTeam = normalizeTeam(homeCompetitor || pick(item, [
    'home',
    'homeTeam',
    'teamHome',
    'teams.home',
    'competitors.0',
  ]));
  const awayTeam = normalizeTeam(awayCompetitor || pick(item, [
    'away',
    'awayTeam',
    'teamAway',
    'teams.away',
    'competitors.1',
  ]));

  const statusValue = pick(item, [
    'status.type.state',
    'status.type.name',
    'status.type.description',
    'status.type.detail',
    'status.type.shortDetail',
    'status.description',
    'state',
    'matchStatus',
    'status',
    'fixture.status.short',
    'fixture.status.long',
  ]);
  const minute = pick(item, [
    'minute',
    'elapsed',
    'gameMinute',
    'fixture.status.elapsed',
    'status.displayClock',
  ]);
  let homeScore = scoreFromSide(item, homeCompetitor, 'home');
  if (homeScore == null) homeScore = toScore(pick(item, [
    'homeScore',
    'score.home',
    'score.fullTime.home',
    'score.current.home',
    'goals.home',
    'teams.home.score',
  ]));
  let awayScore = scoreFromSide(item, awayCompetitor, 'away');
  if (awayScore == null) awayScore = toScore(pick(item, [
    'awayScore',
    'score.away',
    'score.fullTime.away',
    'score.current.away',
    'goals.away',
    'teams.away.score',
  ]));

  return {
    kickoff,
    home: homeTeam.name,
    homeFlag: homeTeam.flag,
    away: awayTeam.name,
    awayFlag: awayTeam.flag,
    status: normalizeStatus(statusValue, kickoff, now),
    minute: minute == null ? '' : String(minute),
    homeScore,
    awayScore,
  };
}

function findCompetitor(item, homeAway) {
  const competitors = pick(item, [
    'competitions.0.competitors',
    'competitors',
  ]);

  if (!Array.isArray(competitors)) return null;

  for (const competitor of competitors) {
    if (String(competitor.homeAway || '').toLowerCase() === homeAway) return competitor;
  }

  return null;
}

function scoreFromSide(item, primary, homeAway) {
  const direct = competitorScore(primary);
  if (direct != null) return direct;

  const competitors = pick(item, [
    'competitions.0.competitors',
    'competitors',
  ]);
  if (!Array.isArray(competitors)) return null;

  const matched = competitors.find(function(competitor) {
    return String(competitor.homeAway || '').toLowerCase() === homeAway;
  });
  const fallback = competitors[homeAway === 'home' ? 0 : 1];

  return competitorScore(matched || fallback);
}

function competitorScore(competitor) {
  if (!competitor) return null;
  if (competitor.score != null) return toScore(competitor.score);
  return toScore(pick(competitor, [
    'score.value',
    'score.displayValue',
  ]));
}

function normalizeStatus(value, kickoff, now) {
  const raw = value == null ? '' : String(value).toLowerCase();
  const compact = raw.replace(/[\s_-]+/g, '');

  if (compact === 'pre' || compact === 'scheduled' || compact === 'timed') return 'scheduled';
  if (compact === 'in') return 'live';
  if (compact === 'post') return 'finished';

  if (includesAny(compact, ['live', 'inplay', 'inprogress', 'paused', 'playing', '进行', '1h', '2h', 'ht', 'et', 'pen', 'statusinprogress'])) {
    return 'live';
  }
  if (includesAny(compact, ['finished', 'fulltime', 'ended', 'closed', 'complete', '完场', '结束', 'ft', 'aet'])) {
    return 'finished';
  }
  if (includesAny(compact, ['postponed', 'cancelled', 'canceled', 'delayed', '延期', '取消'])) {
    return 'other';
  }

  const elapsed = now.getTime() - kickoff.getTime();
  if (elapsed >= 0 && elapsed <= 135 * 60 * 1000) return 'live';
  if (elapsed > 135 * 60 * 1000) return 'finished';
  return 'scheduled';
}

function includesAny(text, words) {
  for (const word of words) {
    if (text.indexOf(word) >= 0) return true;
  }
  return false;
}

function buildDays(matches, now) {
  const configs = [
    buildDayConfig(now, -1, '昨天', '昨'),
    buildDayConfig(now, 0, '今天', '今'),
    buildDayConfig(now, 1, '明天', '明'),
  ];

  return configs.map(function(day) {
    return {
      title: day.title,
      dateLabel: day.dateLabel,
      shortTitle: day.shortTitle,
      matches: matches.filter(function(match) {
        return dayKey(match.kickoff) === day.key;
      }),
    };
  });
}

function buildDayConfig(now, offset, title, shortTitle) {
  const date = addDays(now, offset);
  return {
    key: dayKey(date),
    title,
    dateLabel: formatDay(date),
    shortTitle,
  };
}

function renderInline(days) {
  const match = firstLive(days) || firstUpcoming(days) || firstAny(days);
  return {
    type: 'widget',
    children: [{
      type: 'text',
      text: match ? '世界杯 ' + lineText(match, true) : '世界杯 暂无赛程',
      maxLines: 1,
      minScale: 0.7,
    }],
  };
}

function renderCircular(days) {
  const today = days[1];
  const match = firstLive(days) || (today.matches.length ? today.matches[0] : firstUpcoming(days));
  return {
    type: 'widget',
    padding: 4,
    backgroundColor: COLORS.background,
    children: [
      {
        type: 'text',
        text: '世界杯',
        font: { size: 'caption2', weight: 'semibold' },
        textColor: COLORS.text,
        textAlign: 'center',
        maxLines: 1,
        minScale: 0.55,
      },
      {
        type: 'text',
        text: match ? compactStatus(match) : '暂无',
        font: { size: 'caption1', weight: 'bold' },
        textColor: match && match.status === 'live' ? COLORS.live : COLORS.muted,
        textAlign: 'center',
        maxLines: 1,
        minScale: 0.5,
      },
    ],
  };
}

function renderRectangular(days) {
  const match = firstLive(days) || firstUpcoming(days) || firstAny(days);
  return {
    type: 'widget',
    padding: [6, 8, 6, 8],
    gap: 3,
    backgroundColor: COLORS.background,
    children: [
      {
        type: 'text',
        text: '世界杯赛程',
        font: { size: 'caption1', weight: 'bold' },
        textColor: COLORS.text,
        maxLines: 1,
      },
      {
        type: 'text',
        text: match ? lineText(match, true) : '暂无比赛',
        font: { size: 'caption2', weight: 'medium' },
        textColor: COLORS.muted,
        maxLines: 2,
        minScale: 0.65,
      },
    ],
  };
}

function renderSmall(days, state, now) {
  const today = days[1];
  return shell(now, state, [
    header('世界杯赛程', now),
    {
      type: 'stack',
      direction: 'column',
      gap: 5,
      children: matchRows(today.matches, 3, true),
    },
  ], 14);
}

function renderMedium(days, state, now) {
  return shell(now, state, [
    header('世界杯赛程', now),
    {
      type: 'stack',
      direction: 'row',
      gap: 8,
      children: days.map(function(day) {
        return dayColumn(day, 2);
      }),
    },
  ], 14);
}

function renderLarge(days, state, now) {
  const children = [
    header('世界杯赛程', now),
    { type: 'spacer', length: 8 },
  ];

  const dayCards = days.map(function(day) {
    return dayCard(day, 4);
  });

  children.push.apply(children, interleaveSpacers(dayCards, 7));

  return shell(now, state, children, 14, 0);
}

function shell(now, state, children, padding, gap) {
  const body = children.slice();

  if (state.error) {
    body.push({
      type: 'text',
      text: state.error,
      font: { size: 'caption1', weight: 'medium' },
      textColor: COLORS.error,
      maxLines: 2,
      minScale: 0.7,
    });
  }

  return {
    type: 'widget',
    refreshAfter: nextRefresh(now),
    padding,
    gap: gap == null ? 7 : gap,
    backgroundColor: COLORS.background,
    children: body,
  };
}

function header(title, now) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: 8,
    children: [
      {
        type: 'image',
        src: 'sf-symbol:trophy.fill',
        color: COLORS.trophy,
        width: 12,
        height: 12,
      },
      {
        type: 'text',
        text: title,
        font: { size: FONT_SIZE.header, weight: 'bold' },
        textColor: COLORS.text,
        maxLines: 1,
        minScale: 0.75,
      },
      { type: 'spacer' },
      {
        type: 'text',
        text: '更新 ' + formatTime(now),
        font: { size: FONT_SIZE.headerMeta, weight: 'medium' },
        textColor: COLORS.muted,
        maxLines: 1,
        minScale: 0.65,
      },
    ],
  };
}

function dayColumn(day, limit) {
  return {
    type: 'stack',
    direction: 'column',
    gap: 5,
    flex: 1,
    children: [
      {
        type: 'text',
        text: day.title + ' ' + day.dateLabel,
        font: { size: FONT_SIZE.dayTitle, weight: 'bold' },
        textColor: COLORS.text,
        maxLines: 1,
      },
    ].concat(matchRows(day.matches, limit, true)),
  };
}

function dayCard(day, limit) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: 4,
    padding: [7, 6, 7, 6],
    backgroundColor: COLORS.card,
    borderRadius: 8,
    children: [
      dateBadge(day),
      {
        type: 'stack',
        direction: 'column',
        gap: 4,
        flex: 1,
        children: cardMatchRows(day.matches, limit),
      },
    ],
  };
}

function dateBadge(day) {
  return {
    type: 'stack',
    direction: 'column',
    alignItems: 'center',
    width: MATCH_GRID_WIDTH.date,
    gap: 1,
    children: [
      {
        type: 'text',
        text: day.title,
        font: { size: FONT_SIZE.dayTitle, weight: 'bold' },
        textColor: COLORS.text,
        maxLines: 1,
        minScale: 0.75,
      },
      {
        type: 'text',
        text: day.dateLabel,
        font: { size: FONT_SIZE.headerMeta, weight: 'medium' },
        textColor: COLORS.muted,
        maxLines: 1,
        minScale: 0.75,
      },
      {
        type: 'text',
        text: day.matches.length + ' 场',
        font: { size: 9, weight: 'medium' },
        textColor: COLORS.faint,
        maxLines: 1,
        minScale: 0.75,
      },
    ],
  };
}

function cardMatchRows(matches, limit) {
  const rows = [];
  const count = Math.min(matches.length, limit);

  for (let i = 0; i < count; i += 1) {
    rows.push(cardMatchRow(matches[i]));
  }

  if (!rows.length) {
    rows.push({
      type: 'text',
      text: '暂无比赛',
      font: { size: FONT_SIZE.match, weight: 'regular' },
      textColor: COLORS.faint,
      maxLines: 1,
    });
  } else if (matches.length > limit) {
    rows.push({
      type: 'text',
      text: '另有 ' + (matches.length - limit) + ' 场',
      font: { size: FONT_SIZE.match, weight: 'medium' },
      textColor: COLORS.faint,
      maxLines: 1,
    });
  }

  return rows;
}

function matchRows(matches, limit, showTime) {
  const rows = [];
  const count = Math.min(matches.length, limit);

  for (let i = 0; i < count; i += 1) {
    rows.push(matchRow(matches[i], showTime));
  }

  if (!rows.length) {
    rows.push({
      type: 'text',
      text: '暂无比赛',
      font: { size: FONT_SIZE.match, weight: 'regular' },
      textColor: COLORS.faint,
      maxLines: 1,
    });
  } else if (matches.length > limit) {
    rows.push({
      type: 'text',
      text: '另有 ' + (matches.length - limit) + ' 场',
      font: { size: FONT_SIZE.match, weight: 'medium' },
      textColor: COLORS.faint,
      maxLines: 1,
    });
  }

  return rows;
}

function interleaveSpacers(rows, length) {
  const result = [];

  for (let i = 0; i < rows.length; i += 1) {
    if (i > 0) result.push(length == null ? { type: 'spacer' } : { type: 'spacer', length });
    result.push(rows[i]);
  }

  return result;
}

function cardMatchRow(match) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: 3,
    children: [
      rowCell(formatTime(match.kickoff), {
        width: MATCH_GRID_WIDTH.time,
        font: matchFont('medium', 'Menlo'),
        color: COLORS.muted,
        align: 'left',
      }),
      rowCell(matchStatusLine(match), {
        width: MATCH_GRID_WIDTH.status,
        font: matchFont('bold'),
        color: statusColor(match),
        align: 'left',
      }),
      rowCell(homeDisplay(match), {
        width: MATCH_GRID_WIDTH.home,
        font: matchFont('semibold'),
        color: COLORS.text,
        align: 'right',
      }),
      rowCell(scoreOrVs(match), {
        width: MATCH_GRID_WIDTH.score,
        font: matchFont('bold'),
        color: match.status === 'live' ? COLORS.live : COLORS.text,
        align: 'center',
      }),
      rowCell(awayDisplay(match), {
        width: MATCH_GRID_WIDTH.away,
        font: matchFont('semibold'),
        color: COLORS.text,
        align: 'left',
      }),
    ],
  };
}

function matchRow(match, showTime) {
  const children = [];
  if (showTime) {
    children.push({
      type: 'text',
      text: formatTime(match.kickoff),
      font: matchFont('medium', 'Menlo'),
      textColor: COLORS.muted,
      maxLines: 1,
      minScale: 0.72,
    });
  }

  children.push({
    type: 'text',
    text: matchStatusLine(match),
    font: matchFont('bold'),
    textColor: statusColor(match),
    maxLines: 1,
    minScale: 0.72,
  });

  children.push({
    type: 'text',
    text: matchLine(match),
    font: matchFont('semibold'),
    textColor: COLORS.text,
    flex: 1,
    maxLines: 1,
    minScale: 0.72,
  });

  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: 4,
    children,
  };
}

function rowCell(text, options) {
  const children = [];
  const align = options.align || 'left';

  if (align === 'right' || align === 'center') children.push({ type: 'spacer' });
  children.push({
    type: 'text',
    text,
    font: options.font,
    textColor: options.color,
    maxLines: 1,
    minScale: 0.65,
  });
  if (align === 'left' || align === 'center') children.push({ type: 'spacer' });

  const cell = {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    children,
  };
  if (options.width) cell.width = options.width;
  if (options.flex) cell.flex = options.flex;
  return cell;
}

function matchFont(weight, family) {
  const font = { size: FONT_SIZE.match, weight };
  if (family) font.family = family;
  return font;
}

function teamLine(match) {
  return homeDisplay(match) + 'vs' + awayDisplay(match);
}

function matchLine(match) {
  const score = scoreText(match);
  if (score && (match.status === 'finished' || match.status === 'live')) {
    return homeDisplay(match) + score + awayDisplay(match);
  }
  return teamLine(match);
}

function scoreOrVs(match) {
  const score = scoreText(match);
  if (score && (match.status === 'finished' || match.status === 'live')) return score;
  return 'vs';
}

function lineText(match, withTime) {
  const prefix = withTime ? formatDay(match.kickoff) + ' ' + formatTime(match.kickoff) + ' ' : '';
  const status = matchStatusLine(match);
  return prefix + (status ? status + ' ' : '') + matchLine(match);
}

function statusText(match) {
  if (match.status === 'live') {
    if (!match.minute) return '进行中';
    return /^\d+$/.test(match.minute) ? '进行中 ' + match.minute + '\'' : '进行中 ' + match.minute;
  }
  if (match.status === 'finished') {
    if (match.homeScore != null && match.awayScore != null) {
      return match.homeScore + '-' + match.awayScore;
    }
    return '完场';
  }
  if (match.status === 'other') return '待定';
  return '未开赛';
}

function matchStatusLine(match) {
  if (match.status === 'finished') return '已结束';
  if (match.status === 'live') return statusText(match);
  if (match.status === 'other') return '待定';
  return '未开赛';
}

function statusColor(match) {
  if (match.status === 'live') return COLORS.live;
  if (match.status === 'finished') return COLORS.finished;
  return COLORS.muted;
}

function scoreText(match) {
  if (match.homeScore == null || match.awayScore == null) return '';
  return match.homeScore + '-' + match.awayScore;
}

function compactStatus(match) {
  if (match.status === 'finished' && match.homeScore != null && match.awayScore != null) {
    return match.homeScore + '-' + match.awayScore;
  }
  if (match.status === 'live') return '进行中';
  return '未开赛';
}

function firstLive(days) {
  return firstMatch(days, function(match) {
    return match.status === 'live';
  });
}

function firstUpcoming(days) {
  return firstMatch(days, function(match) {
    return match.status === 'scheduled';
  });
}

function firstAny(days) {
  return firstMatch(days, function() {
    return true;
  });
}

function firstMatch(days, predicate) {
  for (const day of days) {
    for (const match of day.matches) {
      if (predicate(match)) return match;
    }
  }
  return null;
}

function pick(obj, paths) {
  for (const path of paths) {
    const value = get(obj, path);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function get(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current == null) return undefined;
    if (/^\d+$/.test(part)) {
      current = current[Number(part)];
    } else {
      current = current[part];
    }
  }

  return current;
}

function team(cnName, alpha2, aliases) {
  return {
    name: cnName,
    flag: flagEmoji(alpha2),
    aliases: aliases || [],
  };
}

function buildTeamNameIndex() {
  const index = {};

  for (const code of Object.keys(TEAM_DATA)) {
    const item = TEAM_DATA[code];
    index[normalizeLookup(code)] = item;
    index[normalizeLookup(item.name)] = item;

    for (const alias of item.aliases) {
      index[normalizeLookup(alias)] = item;
    }
  }

  return index;
}

function normalizeTeam(value) {
  const rawName = rawTeamName(value);
  const code = rawTeamCode(value);
  const byCode = code ? TEAM_DATA[String(code).toUpperCase()] : null;
  const byName = rawName ? TEAM_BY_NAME[normalizeLookup(rawName)] : null;
  const info = byCode || byName;

  return {
    name: info ? info.name : rawName,
    flag: info ? info.flag : '',
  };
}

function rawTeamName(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return pick(value, [
    'name',
    'shortName',
    'displayName',
    'shortDisplayName',
    'country',
    'team.displayName',
    'team.shortDisplayName',
    'team.name',
  ]) || '';
}

function rawTeamCode(value) {
  if (value == null || typeof value === 'string') return '';
  return pick(value, [
    'tla',
    'code',
    'abbreviation',
    'countryCode',
    'team.tla',
    'team.abbreviation',
    'team.country',
  ]) || '';
}

function normalizeLookup(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
    .trim();
}

function homeDisplay(match) {
  return match.home + (match.homeFlag ? match.homeFlag : '');
}

function awayDisplay(match) {
  return (match.awayFlag ? match.awayFlag : '') + match.away;
}

function flagEmoji(alpha2) {
  const code = String(alpha2 || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(
    0x1F1E6 + code.charCodeAt(0) - 65,
    0x1F1E6 + code.charCodeAt(1) - 65
  );
}

function toScore(value) {
  if (value === undefined || value === null || value === '') return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function dayKey(date) {
  const parts = beijingParts(date);
  return [
    parts.year,
    pad(parts.month),
    pad(parts.day),
  ].join('-');
}

function compactDay(date) {
  const parts = beijingParts(date);
  return [
    parts.year,
    pad(parts.month),
    pad(parts.day),
  ].join('');
}

function formatDay(date) {
  const parts = beijingParts(date);
  return pad(parts.month) + '/' + pad(parts.day);
}

function formatTime(date) {
  const parts = beijingParts(date);
  return pad(parts.hour) + ':' + pad(parts.minute);
}

function beijingParts(date) {
  const beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return {
    year: beijing.getUTCFullYear(),
    month: beijing.getUTCMonth() + 1,
    day: beijing.getUTCDate(),
    hour: beijing.getUTCHours(),
    minute: beijing.getUTCMinutes(),
  };
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function nextRefresh(now) {
  const next = new Date(now.getTime() + 10 * 60 * 1000);
  return next.toISOString();
}
