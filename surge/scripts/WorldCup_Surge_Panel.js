// Surge Panel: FIFA World Cup Schedule
// Data source: ESPN fifa.world scoreboard. No API key required.

var BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
var ESPN_LEAGUE = 'fifa.world';

var TEAM_DATA = {
  ARG: team('阿根廷', 'AR', ['Argentina']),
  AUS: team('澳大利亚', 'AU', ['Australia']),
  BEL: team('比利时', 'BE', ['Belgium']),
  BIH: team('波黑', 'BA', ['Bosnia-Herzegovina', 'Bosnia and Herzegovina']),
  BRA: team('巴西', 'BR', ['Brazil']),
  CAN: team('加拿大', 'CA', ['Canada']),
  CIV: team('科特迪瓦', 'CI', ["Cote d'Ivoire", "Côte d'Ivoire", 'Ivory Coast']),
  CPV: team('佛得角', 'CV', ['Cape Verde', 'Cabo Verde']),
  CUW: team('库拉索', 'CW', ['Curaçao', 'Curacao']),
  ECU: team('厄瓜多尔', 'EC', ['Ecuador']),
  EGY: team('埃及', 'EG', ['Egypt']),
  ESP: team('西班牙', 'ES', ['Spain']),
  FRA: team('法国', 'FR', ['France']),
  GER: team('德国', 'DE', ['Germany']),
  HAI: team('海地', 'HT', ['Haiti']),
  IRN: team('伊朗', 'IR', ['Iran', 'IR Iran']),
  JPN: team('日本', 'JP', ['Japan']),
  KSA: team('沙特阿拉伯', 'SA', ['Saudi Arabia']),
  MAR: team('摩洛哥', 'MA', ['Morocco']),
  NED: team('荷兰', 'NL', ['Netherlands', 'Holland']),
  NZL: team('新西兰', 'NZ', ['New Zealand']),
  PAR: team('巴拉圭', 'PY', ['Paraguay']),
  QAT: team('卡塔尔', 'QA', ['Qatar']),
  SCO: team('苏格兰', 'GB', ['Scotland']),
  SEN: team('塞内加尔', 'SN', ['Senegal']),
  SUI: team('瑞士', 'CH', ['Switzerland']),
  SWE: team('瑞典', 'SE', ['Sweden']),
  TUN: team('突尼斯', 'TN', ['Tunisia']),
  TUR: team('土耳其', 'TR', ['Turkey', 'Türkiye']),
  URU: team('乌拉圭', 'UY', ['Uruguay']),
  USA: team('美国', 'US', ['United States', 'USA', 'United States of America'])
};

var TEAM_BY_NAME = buildTeamNameIndex();
var now = new Date();
var url = buildEspnUrl(now);

$httpClient.get({ url: url, timeout: 20 }, function(error, response, body) {
  if (error) return finish('世界杯赛程', '数据请求失败：' + error, '#D70015');

  var statusCode = response && response.status ? response.status : 0;
  if (statusCode < 200 || statusCode >= 300) {
    return finish('世界杯赛程', '数据请求失败：HTTP ' + statusCode, '#D70015');
  }

  try {
    var raw = JSON.parse(body || '{}');
    var matches = normalizeMatches(raw, now);
    var days = buildDays(matches, now);
    finish('世界杯赛程', panelContent(days), hasLiveMatch(matches) ? '#D70015' : '#D4A017');
  } catch (e) {
    finish('世界杯赛程', '数据解析失败：' + e.message, '#D70015');
  }
});

function finish(title, content, color) {
  $done({
    title: title,
    content: content || '暂无赛程',
    icon: 'trophy.fill',
    'icon-color': color
  });
}

function panelContent(days) {
  var lines = [];

  for (var i = 0; i < days.length; i += 1) {
    var day = days[i];
    lines.push(day.title + ' ' + day.dateLabel + '  ' + day.matches.length + ' 场');

    if (!day.matches.length) {
      lines.push('暂无比赛');
    } else {
      for (var j = 0; j < day.matches.length && j < 4; j += 1) {
        lines.push(matchText(day.matches[j]));
      }
      if (day.matches.length > 4) lines.push('另有 ' + (day.matches.length - 4) + ' 场');
    }

    if (i < days.length - 1) lines.push('');
  }

  return lines.join('\n');
}

function hasLiveMatch(matches) {
  for (var i = 0; i < matches.length; i += 1) {
    if (matches[i].status === 'live') return true;
  }
  return false;
}

function matchText(match) {
  var status = matchStatusLine(match);
  return formatTime(match.kickoff) + '  ' + status + '  ' + matchLine(match);
}

function matchLine(match) {
  var score = scoreText(match);
  if (score && (match.status === 'finished' || match.status === 'live')) {
    return homeDisplay(match) + score + awayDisplay(match);
  }
  return homeDisplay(match) + 'vs' + awayDisplay(match);
}

function matchStatusLine(match) {
  if (match.status === 'finished') return '已结束';
  if (match.status === 'live') {
    if (!match.minute) return '进行中';
    return /^\d+$/.test(match.minute) ? "进行中 " + match.minute + "'" : '进行中 ' + match.minute;
  }
  if (match.status === 'other') return '待定';
  return '未开赛';
}

function scoreText(match) {
  if (match.homeScore == null || match.awayScore == null) return '';
  return match.homeScore + '-' + match.awayScore;
}

function homeDisplay(match) {
  return match.home + (match.homeFlag ? match.homeFlag : '');
}

function awayDisplay(match) {
  return (match.awayFlag ? match.awayFlag : '') + match.away;
}

function normalizeMatches(raw, current) {
  var list = raw && raw.events && raw.events.length ? raw.events : [];
  var matches = [];

  for (var i = 0; i < list.length; i += 1) {
    var item = normalizeOne(list[i], current);
    if (item && item.kickoff && item.home && item.away) matches.push(item);
  }

  matches.sort(function(a, b) {
    return a.kickoff.getTime() - b.kickoff.getTime();
  });
  return matches;
}

function normalizeOne(item, current) {
  var homeCompetitor = findCompetitor(item, 'home');
  var awayCompetitor = findCompetitor(item, 'away');
  var kickoff = toDate(item.date);
  if (!kickoff) return null;

  var homeTeam = normalizeTeam(homeCompetitor);
  var awayTeam = normalizeTeam(awayCompetitor);
  var statusValue = get(item, 'status.type.state') || get(item, 'status.type.name') || get(item, 'status.type.description');
  var minute = get(item, 'status.displayClock') || get(item, 'status.type.detail') || get(item, 'status.type.shortDetail');

  return {
    kickoff: kickoff,
    home: homeTeam.name,
    homeFlag: homeTeam.flag,
    away: awayTeam.name,
    awayFlag: awayTeam.flag,
    status: normalizeStatus(statusValue, kickoff, current),
    minute: cleanMinute(minute),
    homeScore: toScore(homeCompetitor && homeCompetitor.score),
    awayScore: toScore(awayCompetitor && awayCompetitor.score)
  };
}

function findCompetitor(item, homeAway) {
  var competitors = get(item, 'competitions.0.competitors');
  if (!competitors || !competitors.length) return null;

  for (var i = 0; i < competitors.length; i += 1) {
    if (String(competitors[i].homeAway || '').toLowerCase() === homeAway) return competitors[i];
  }
  return null;
}

function normalizeStatus(value, kickoff, current) {
  var raw = String(value || '').toLowerCase();
  var compact = raw.replace(/[\s_-]+/g, '');

  if (compact === 'pre' || compact === 'scheduled') return 'scheduled';
  if (compact === 'in' || compact.indexOf('progress') >= 0 || compact.indexOf('half') >= 0) return 'live';
  if (compact === 'post' || compact.indexOf('fulltime') >= 0 || compact.indexOf('finished') >= 0) return 'finished';

  var elapsed = current.getTime() - kickoff.getTime();
  if (elapsed >= 0 && elapsed <= 135 * 60 * 1000) return 'live';
  if (elapsed > 135 * 60 * 1000) return 'finished';
  return 'scheduled';
}

function buildDays(matches, current) {
  var configs = [
    buildDayConfig(current, -1, '昨天'),
    buildDayConfig(current, 0, '今天'),
    buildDayConfig(current, 1, '明天')
  ];
  var result = [];

  for (var i = 0; i < configs.length; i += 1) {
    var day = configs[i];
    var dayMatches = [];
    for (var j = 0; j < matches.length; j += 1) {
      if (dayKey(matches[j].kickoff) === day.key) dayMatches.push(matches[j]);
    }
    result.push({
      title: day.title,
      dateLabel: day.dateLabel,
      matches: dayMatches
    });
  }

  return result;
}

function buildDayConfig(current, offset, title) {
  var date = addDays(current, offset);
  return {
    key: dayKey(date),
    title: title,
    dateLabel: formatDay(date)
  };
}

function buildEspnUrl(current) {
  var from = addDays(current, -2);
  var to = addDays(current, 1);
  return 'https://site.api.espn.com/apis/site/v2/sports/soccer/' + ESPN_LEAGUE + '/scoreboard?limit=500&dates=' + compactDay(from) + '-' + compactDay(to);
}

function normalizeTeam(value) {
  var rawName = rawTeamName(value);
  var code = rawTeamCode(value);
  var byCode = code ? TEAM_DATA[String(code).toUpperCase()] : null;
  var byName = rawName ? TEAM_BY_NAME[normalizeLookup(rawName)] : null;
  var info = byCode || byName;
  return {
    name: info ? info.name : rawName,
    flag: info ? info.flag : ''
  };
}

function rawTeamName(value) {
  return get(value, 'team.displayName') || get(value, 'team.shortDisplayName') || get(value, 'team.name') || '';
}

function rawTeamCode(value) {
  return get(value, 'team.abbreviation') || get(value, 'team.country') || '';
}

function get(obj, path) {
  var parts = String(path || '').split('.');
  var current = obj;
  for (var i = 0; i < parts.length; i += 1) {
    if (current == null) return undefined;
    current = /^\d+$/.test(parts[i]) ? current[Number(parts[i])] : current[parts[i]];
  }
  return current;
}

function cleanMinute(value) {
  if (!value || value === '0\'' || value === 'FT') return '';
  return String(value).replace(/'/g, '');
}

function toScore(value) {
  if (value === undefined || value === null || value === '') return null;
  var score = Number(value);
  return isFinite(score) ? score : null;
}

function toDate(value) {
  if (!value) return null;
  var date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function addDays(date, days) {
  var next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function dayKey(date) {
  var beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return beijing.getUTCFullYear() + '-' + pad(beijing.getUTCMonth() + 1) + '-' + pad(beijing.getUTCDate());
}

function compactDay(date) {
  var beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return '' + beijing.getUTCFullYear() + pad(beijing.getUTCMonth() + 1) + pad(beijing.getUTCDate());
}

function formatDay(date) {
  var beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return pad(beijing.getUTCMonth() + 1) + '/' + pad(beijing.getUTCDate());
}

function formatTime(date) {
  var beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return pad(beijing.getUTCHours()) + ':' + pad(beijing.getUTCMinutes());
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function team(cnName, alpha2, aliases) {
  return {
    name: cnName,
    flag: flagEmoji(alpha2),
    aliases: aliases || []
  };
}

function buildTeamNameIndex() {
  var index = {};
  var codes = Object.keys(TEAM_DATA);
  for (var i = 0; i < codes.length; i += 1) {
    var code = codes[i];
    var item = TEAM_DATA[code];
    index[normalizeLookup(code)] = item;
    index[normalizeLookup(item.name)] = item;
    for (var j = 0; j < item.aliases.length; j += 1) {
      index[normalizeLookup(item.aliases[j])] = item;
    }
  }
  return index;
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

function flagEmoji(alpha2) {
  var code = String(alpha2 || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(
    0x1F1E6 + code.charCodeAt(0) - 65,
    0x1F1E6 + code.charCodeAt(1) - 65
  );
}
