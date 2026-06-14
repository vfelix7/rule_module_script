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
  } else if (env.API_URL || isEspnSource(env) || isFootballDataSource(env)) {
    const resp = await ctx.http.get(buildApiUrl(env, now), {
      timeout: Number(env.TIMEOUT || 10000),
      headers: buildHeaders(env),
    });

    if (resp.status < 200 || resp.status >= 300) {
      throw new Error('数据请求失败：HTTP ' + resp.status);
    }

    raw = await resp.json();
  } else {
    return {
      matches: [],
      error: '请在 env 里配置 DATA_SOURCE、API_URL 或 MATCHES_JSON',
    };
  }

  return {
    matches: normalizeMatches(raw, now),
    error: '',
  };
}

function isEspnSource(env) {
  return String(env.DATA_SOURCE || env.PROVIDER || '').toLowerCase() === 'espn';
}

function isFootballDataSource(env) {
  const source = String(env.DATA_SOURCE || env.PROVIDER || '').toLowerCase();
  return source === 'football-data' || source === 'football-data.org' || source === 'footballdata';
}

function buildApiUrl(env, now) {
  const from = addDays(now, -1);
  const to = addDays(now, 1);
  const values = {
    dates: compactDay(from) + '-' + compactDay(to),
    dateFrom: dayKey(from),
    dateTo: dayKey(to),
    yyyymmddFrom: compactDay(from),
    yyyymmddTo: compactDay(to),
  };

  if (env.API_URL_TEMPLATE) return fillTemplate(env.API_URL_TEMPLATE, values);

  if (isEspnSource(env) && !env.API_URL) {
    const league = env.ESPN_LEAGUE || 'fifa.world';
    return 'https://site.api.espn.com/apis/site/v2/sports/soccer/' + league + '/scoreboard?limit=500&dates=' + values.dates;
  }

  if (isFootballDataSource(env) && !env.API_URL) {
    return 'https://api.football-data.org/v4/competitions/WC/matches?dateFrom=' + values.dateFrom + '&dateTo=' + values.dateTo;
  }

  if (isEspnSource(env) && env.API_URL.indexOf('dates=') < 0) {
    return appendQuery(env.API_URL, {
      limit: env.LIMIT || '500',
      dates: values.dates,
    });
  }

  if (isFootballDataSource(env) && env.API_URL.indexOf('dateFrom=') < 0 && env.API_URL.indexOf('dateTo=') < 0) {
    return appendQuery(env.API_URL, {
      dateFrom: values.dateFrom,
      dateTo: values.dateTo,
    });
  }

  return fillTemplate(env.API_URL, values);
}

function fillTemplate(template, values) {
  return template.replace(/\{(dates|dateFrom|dateTo|yyyymmddFrom|yyyymmddTo)\}/g, function(_, key) {
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

  const home = teamName(homeCompetitor) || teamName(pick(item, [
    'home',
    'homeTeam',
    'teamHome',
    'teams.home',
    'competitors.0',
  ]));
  const away = teamName(awayCompetitor) || teamName(pick(item, [
    'away',
    'awayTeam',
    'teamAway',
    'teams.away',
    'competitors.1',
  ]));

  const statusValue = pick(item, [
    'status',
    'state',
    'matchStatus',
    'status.type.state',
    'status.type.name',
    'fixture.status.short',
    'fixture.status.long',
    'status.description',
    'status.type.description',
    'status.type.detail',
    'status.type.shortDetail',
  ]);
  const minute = pick(item, [
    'minute',
    'elapsed',
    'gameMinute',
    'fixture.status.elapsed',
    'status.displayClock',
  ]);
  let homeScore = toScore(homeCompetitor && homeCompetitor.score);
  if (homeScore == null) homeScore = toScore(pick(item, [
    'homeScore',
    'score.home',
    'score.fullTime.home',
    'score.current.home',
    'goals.home',
    'teams.home.score',
  ]));
  let awayScore = toScore(awayCompetitor && awayCompetitor.score);
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
    home,
    away,
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
    { key: dayKey(addDays(now, -1)), title: '昨天', shortTitle: '昨' },
    { key: dayKey(now), title: '今天', shortTitle: '今' },
    { key: dayKey(addDays(now, 1)), title: '明天', shortTitle: '明' },
  ];

  return configs.map(function(day) {
    return {
      title: day.title,
      shortTitle: day.shortTitle,
      matches: matches.filter(function(match) {
        return dayKey(match.kickoff) === day.key;
      }),
    };
  });
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
    backgroundColor: '#0A4D3C',
    children: [
      {
        type: 'text',
        text: '世界杯',
        font: { size: 'caption2', weight: 'semibold' },
        textColor: '#FFFFFF',
        textAlign: 'center',
        maxLines: 1,
        minScale: 0.55,
      },
      {
        type: 'text',
        text: match ? compactStatus(match) : '暂无',
        font: { size: 'caption1', weight: 'bold' },
        textColor: match && match.status === 'live' ? '#FFD166' : '#FFFFFFCC',
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
    backgroundColor: '#0A4D3C',
    children: [
      {
        type: 'text',
        text: '世界杯赛程',
        font: { size: 'caption1', weight: 'bold' },
        textColor: '#FFFFFF',
        maxLines: 1,
      },
      {
        type: 'text',
        text: match ? lineText(match, true) : '昨天、今天、明天暂无比赛',
        font: { size: 'caption2', weight: 'medium' },
        textColor: '#FFFFFFDD',
        maxLines: 2,
        minScale: 0.65,
      },
    ],
  };
}

function renderSmall(days, state, now) {
  const today = days[1];
  return shell(now, state, [
    header('世界杯赛程', '今天'),
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
    header('世界杯赛程', '昨天 / 今天 / 明天'),
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
    header('世界杯赛程', '昨天 / 今天 / 明天'),
  ];

  days.forEach(function(day) {
    children.push(daySection(day, 4));
  });

  return shell(now, state, children, 16);
}

function shell(now, state, children, padding) {
  const body = children.slice();

  if (state.error) {
    body.push({
      type: 'text',
      text: state.error,
      font: { size: 'caption1', weight: 'medium' },
      textColor: '#FFD166',
      maxLines: 2,
      minScale: 0.7,
    });
  }

  body.push({
    type: 'date',
    date: now.toISOString(),
    format: 'relative',
    font: { size: 'caption2', weight: 'regular' },
    textColor: '#D7FFF1AA',
    maxLines: 1,
  });

  return {
    type: 'widget',
    refreshAfter: nextRefresh(now),
    padding,
    gap: 10,
    backgroundGradient: {
      type: 'linear',
      colors: ['#092D2B', '#0A4D3C', '#12355B'],
      stops: [0, 0.56, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    },
    children: body,
  };
}

function header(title, subtitle) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: 8,
    children: [
      {
        type: 'image',
        src: 'sf-symbol:trophy.fill',
        color: '#FFD166',
        width: 17,
        height: 17,
      },
      {
        type: 'text',
        text: title,
        font: { size: 'headline', weight: 'bold' },
        textColor: '#FFFFFF',
        maxLines: 1,
        minScale: 0.75,
      },
      { type: 'spacer' },
      {
        type: 'text',
        text: subtitle,
        font: { size: 'caption1', weight: 'medium' },
        textColor: '#D7FFF1CC',
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
    gap: 6,
    flex: 1,
    padding: [8, 8, 8, 8],
    backgroundColor: '#FFFFFF14',
    borderRadius: 8,
    children: [
      {
        type: 'text',
        text: day.title,
        font: { size: 'caption1', weight: 'bold' },
        textColor: '#FFFFFF',
        maxLines: 1,
      },
    ].concat(matchRows(day.matches, limit, false)),
  };
}

function daySection(day, limit) {
  return {
    type: 'stack',
    direction: 'column',
    gap: 6,
    padding: [9, 10, 9, 10],
    backgroundColor: '#FFFFFF14',
    borderRadius: 8,
    children: [
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        children: [
          {
            type: 'text',
            text: day.title,
            font: { size: 'subheadline', weight: 'bold' },
            textColor: '#FFFFFF',
          },
          { type: 'spacer' },
          {
            type: 'text',
            text: day.matches.length + ' 场',
            font: { size: 'caption1', weight: 'medium' },
            textColor: '#D7FFF1BB',
          },
        ],
      },
    ].concat(matchRows(day.matches, limit, true)),
  };
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
      font: { size: 'caption1', weight: 'regular' },
      textColor: '#D7FFF199',
      maxLines: 1,
    });
  } else if (matches.length > limit) {
    rows.push({
      type: 'text',
      text: '另有 ' + (matches.length - limit) + ' 场',
      font: { size: 'caption2', weight: 'medium' },
      textColor: '#D7FFF1AA',
      maxLines: 1,
    });
  }

  return rows;
}

function matchRow(match, showTime) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: 5,
    children: [
      {
        type: 'text',
        text: formatTime(match.kickoff),
        font: { size: 'caption2', weight: 'medium', family: 'Menlo' },
        textColor: match.status === 'live' ? '#FFD166' : '#D7FFF1BB',
        maxLines: 1,
        minScale: 0.6,
      },
      {
        type: 'text',
        text: teamLine(match),
        font: { size: 'caption1', weight: 'semibold' },
        textColor: '#FFFFFF',
        flex: 1,
        maxLines: 1,
        minScale: 0.55,
      },
      {
        type: 'text',
        text: statusBadge(match),
        font: { size: 'caption2', weight: 'bold' },
        textColor: match.status === 'live' ? '#FFD166' : '#FFFFFFCC',
        textAlign: 'right',
        maxLines: 1,
        minScale: 0.55,
      },
    ],
  };
}

function teamLine(match) {
  return match.home + ' vs ' + match.away;
}

function lineText(match, withTime) {
  const prefix = withTime ? formatDay(match.kickoff) + ' ' + formatTime(match.kickoff) + ' ' : '';
  const status = statusBadge(match);
  return prefix + teamLine(match) + (status ? ' ' + status : '');
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
  return formatTime(match.kickoff);
}

function statusBadge(match) {
  if (match.status === 'scheduled') return '';
  return statusText(match);
}

function compactStatus(match) {
  if (match.status === 'finished' && match.homeScore != null && match.awayScore != null) {
    return match.homeScore + '-' + match.awayScore;
  }
  if (match.status === 'live') return '进行中';
  return formatTime(match.kickoff);
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

function teamName(value) {
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
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
}

function compactDay(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('');
}

function formatDay(date) {
  return pad(date.getMonth() + 1) + '/' + pad(date.getDate());
}

function formatTime(date) {
  return pad(date.getHours()) + ':' + pad(date.getMinutes());
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function nextRefresh(now) {
  const next = new Date(now.getTime() + 10 * 60 * 1000);
  return next.toISOString();
}
