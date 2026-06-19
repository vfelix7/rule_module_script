const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
const DEFAULT_LEAGUE = 'fifa.world';
const DEFAULT_SEASON = '2026';
const DEFAULT_GROUP_STAGE_START = '20260611';
const DEFAULT_GROUP_STAGE_END = '20260628';

const COLORS = {
  background: { light: '#F7F9FC', dark: '#101418' },
  card: { light: '#FFFFFF', dark: '#1B2227' },
  cardSubtle: { light: '#EEF3F7', dark: '#202A31' },
  text: { light: '#101418', dark: '#F7F9FC' },
  muted: { light: '#68737D', dark: '#A7B0B8' },
  faint: { light: '#8A949E', dark: '#7F8A94' },
  accent: { light: '#0A7A5A', dark: '#35D399' },
  panelGreen: { light: '#5DBA72', dark: '#2F8D58' },
  panelGreenDeep: { light: '#43A85F', dark: '#267749' },
  table: { light: '#FFFFFF', dark: '#172119' },
  qualify: { light: '#43A85F', dark: '#6EE7A2' },
  qualifyBg: { light: '#EDF8F0', dark: '#1B3825' },
  pending: { light: '#747C84', dark: '#B8C0C8' },
  pendingBg: { light: '#F4F4F4', dark: '#2A2E32' },
  trophy: { light: '#D4A017', dark: '#FFD60A' },
  error: { light: '#D70015', dark: '#FF453A' },
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
  const family = ctx.widgetFamily || 'systemMedium';

  let state;
  try {
    state = await loadStandings(ctx, env, now);
  } catch (error) {
    state = {
      groups: [],
      source: '',
      error: error && error.message ? error.message : String(error),
    };
  }

  if (family === 'accessoryInline') return renderInline(state);
  if (family === 'accessoryCircular') return renderCircular(state);
  if (family === 'accessoryRectangular') return renderRectangular(state);
  if (family === 'systemSmall') return renderSmall(state, env, now);
  return renderTable(state, env, now, family);
}

async function loadStandings(ctx, env, now) {
  if (env.STANDINGS_JSON) {
    const groups = parseStandings(JSON.parse(env.STANDINGS_JSON), env);
    if (groups.length) return { groups, source: 'standings-json', error: '' };
  }

  const errors = [];
  const standingsUrls = buildStandingsUrls(env);
  for (const url of standingsUrls) {
    try {
      const resp = await ctx.http.get(url, {
        timeout: Number(env.TIMEOUT || 10000),
        headers: buildHeaders(env),
      });
      if (resp.status < 200 || resp.status >= 300) {
        errors.push('HTTP ' + resp.status);
        continue;
      }
      const groups = parseStandings(await resp.json(), env);
      if (groups.length) return { groups, source: 'standings', error: '' };
    } catch (error) {
      errors.push(error && error.message ? error.message : String(error));
    }
  }

  const groups = await loadComputedStandings(ctx, env, now);
  if (groups.length) return { groups, source: 'matches', error: '' };

  throw new Error(errors.length ? errors[0] : '暂无小组积分数据');
}

function buildStandingsUrls(env) {
  if (env.API_URL) return [fillTemplate(env.API_URL, templateValues(new Date()))];

  const league = encodeURIComponent(String(env.ESPN_LEAGUE || DEFAULT_LEAGUE));
  const season = encodeURIComponent(String(env.SEASON || DEFAULT_SEASON));
  return [
    'https://site.web.api.espn.com/apis/v2/sports/soccer/' + league + '/standings?region=us&lang=en&contentorigin=espn&season=' + season + '&sort=rank:asc',
    'https://site.api.espn.com/apis/site/v2/sports/soccer/' + league + '/standings?season=' + season,
  ];
}

async function loadComputedStandings(ctx, env, now) {
  const resp = await ctx.http.get(buildScoreboardUrl(env), {
    timeout: Number(env.TIMEOUT || 10000),
    headers: buildHeaders(env),
  });
  if (resp.status < 200 || resp.status >= 300) {
    throw new Error('比赛数据请求失败：HTTP ' + resp.status);
  }
  return computeStandings(await resp.json(), env, now);
}

function buildScoreboardUrl(env) {
  if (env.MATCHES_API_URL) return fillTemplate(env.MATCHES_API_URL, templateValues(new Date()));

  const league = env.ESPN_LEAGUE || DEFAULT_LEAGUE;
  const start = env.START_DATE || DEFAULT_GROUP_STAGE_START;
  const end = env.END_DATE || DEFAULT_GROUP_STAGE_END;
  return 'https://site.api.espn.com/apis/site/v2/sports/soccer/' + league + '/scoreboard?limit=500&dates=' + start + '-' + end;
}

function parseStandings(raw, env) {
  const groups = [];
  const seen = {};
  collectStandingsGroups(raw, groups, seen, []);

  return groups.map(function(group, index) {
    return normalizeGroup(group, index + 1);
  }).filter(function(group) {
    return group.rows.length;
  }).sort(compareGroups);
}

function collectStandingsGroups(node, groups, seen, path) {
  if (!node || typeof node !== 'object') return;

  const entries = standingsEntries(node);
  if (entries.length && entries.some(hasTeamLikeValue)) {
    const label = groupLabelFromNode(node, path, groups.length + 1);
    const key = normalizeLookup(label) + ':' + entries.length + ':' + entries.map(function(entry) {
      return normalizeLookup(rawTeamName(entry.team || entry));
    }).join('|');
    if (!seen[key]) {
      seen[key] = true;
      groups.push({
        label,
        rows: entries.map(parseStandingEntry).filter(Boolean),
      });
    }
  }

  const childKeys = ['children', 'groups', 'groupStandings', 'standings', 'divisions', 'conferences', 'items'];
  for (const key of childKeys) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) collectStandingsGroups(item, groups, seen, path.concat([node.name || node.displayName || node.abbreviation || '']));
    } else if (child && typeof child === 'object') {
      collectStandingsGroups(child, groups, seen, path.concat([node.name || node.displayName || node.abbreviation || '']));
    }
  }
}

function standingsEntries(node) {
  if (Array.isArray(node.entries)) return node.entries;
  if (node.standings && Array.isArray(node.standings.entries)) return node.standings.entries;
  if (node.table && Array.isArray(node.table)) return node.table;
  if (node.rankings && Array.isArray(node.rankings)) return node.rankings;
  return [];
}

function hasTeamLikeValue(entry) {
  return !!(entry && (entry.team || entry.competitor || entry.name || entry.displayName));
}

function groupLabelFromNode(node, path, fallbackIndex) {
  const values = [
    node.displayName,
    node.name,
    node.abbreviation,
    node.shortName,
    path.filter(Boolean).slice(-1)[0],
  ].filter(Boolean);

  for (const value of values) {
    const label = normalizeGroupLabel(value);
    if (label) return label;
  }
  return '小组 ' + fallbackIndex;
}

function normalizeGroup(group, fallbackIndex) {
  const label = normalizeGroupLabel(group.label) || ('小组 ' + fallbackIndex);
  const rows = group.rows.map(function(row) {
    const normalized = normalizeStandingRow(row);
    normalized.rank = row.rank;
    return normalized;
  }).sort(compareRows).map(function(row, index) {
    row.rank = index + 1;
    return row;
  });

  return { label, rows };
}

function parseStandingEntry(entry) {
  const teamValue = entry.team || entry.competitor || entry;
  const normalizedTeam = normalizeTeam(teamValue);
  if (!normalizedTeam.name) return null;

  const stats = mergeStats([
    entry.stats,
    entry.overallStats,
    entry.records && entry.records[0] && entry.records[0].stats,
    entry.record && entry.record.stats,
  ]);

  const played = numberFromFirst(entry, stats, ['played', 'gamesPlayed', 'matchesPlayed', 'appearances', 'gp', 'p']);
  const wins = numberFromFirst(entry, stats, ['wins', 'win', 'w']);
  const draws = numberFromFirst(entry, stats, ['ties', 'draws', 'tie', 'draw', 'd']);
  const losses = numberFromFirst(entry, stats, ['losses', 'loss', 'l']);
  const goalsFor = numberFromFirst(entry, stats, ['pointsFor', 'goalsFor', 'goalsfor', 'for', 'gf']);
  const goalsAgainst = numberFromFirst(entry, stats, ['pointsAgainst', 'goalsAgainst', 'goalsagainst', 'against', 'ga']);
  const goalDiff = numberFromFirst(entry, stats, ['pointDifferential', 'pointsDifferential', 'goalDifference', 'goaldifference', 'differential', 'gd']);
  const points = numberFromFirst(entry, stats, ['points', 'pts', 'p']);
  const rank = numberFromFirst(entry, stats, ['rank', 'position', 'seed']);

  return {
    rank,
    team: normalizedTeam.name,
    flag: normalizedTeam.flag,
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDiff: goalDiff == null && goalsFor != null && goalsAgainst != null ? goalsFor - goalsAgainst : goalDiff,
    points: points == null && wins != null && draws != null ? wins * 3 + draws : points,
  };
}

function mergeStats(list) {
  const output = {};
  for (const stats of list) {
    if (!stats) continue;
    if (Array.isArray(stats)) {
      for (const item of stats) {
        const key = normalizeStatKey(item.name || item.displayName || item.abbreviation || item.shortDisplayName);
        const value = toNumber(item.value == null ? item.displayValue : item.value);
        if (key && value != null) output[key] = value;
      }
    } else if (typeof stats === 'object') {
      for (const key of Object.keys(stats)) {
        const value = toNumber(stats[key]);
        if (value != null) output[normalizeStatKey(key)] = value;
      }
    }
  }
  return output;
}

function numberFromFirst(entry, stats, keys) {
  for (const key of keys) {
    const direct = toNumber(entry[key]);
    if (direct != null) return direct;
    const normalized = normalizeStatKey(key);
    if (stats[normalized] != null) return stats[normalized];
  }
  return null;
}

function computeStandings(raw, env, now) {
  const matches = pickMatchArray(raw).map(function(item) {
    return normalizeMatch(item, now);
  }).filter(Boolean);
  const membership = parseGroupMembership(env.GROUPS_JSON);
  const groups = {};

  for (const match of matches) {
    if (!shouldCountMatch(match, env)) continue;
    const group = match.group || membership[normalizeLookup(match.home)] || membership[normalizeLookup(match.away)] || '小组赛';
    if (!groups[group]) groups[group] = {};
    ensureTeam(groups[group], match.home, match.homeFlag);
    ensureTeam(groups[group], match.away, match.awayFlag);
    applyResult(groups[group][match.home], match.homeScore, match.awayScore);
    applyResult(groups[group][match.away], match.awayScore, match.homeScore);
  }

  return Object.keys(groups).map(function(label, index) {
    return normalizeGroup({
      label,
      rows: Object.keys(groups[label]).map(function(key) {
        return groups[label][key];
      }),
    }, index + 1);
  }).sort(compareGroups);
}

function shouldCountMatch(match, env) {
  if (match.homeScore == null || match.awayScore == null) return false;
  if (match.status === 'finished') return true;
  return match.status === 'live' && String(env.INCLUDE_LIVE || 'true').toLowerCase() !== 'false';
}

function ensureTeam(group, name, flag) {
  if (!group[name]) {
    group[name] = {
      team: name,
      flag,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    };
  }
}

function applyResult(row, goalsFor, goalsAgainst) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDiff = row.goalsFor - row.goalsAgainst;
  if (goalsFor > goalsAgainst) {
    row.wins += 1;
    row.points += 3;
  } else if (goalsFor === goalsAgainst) {
    row.draws += 1;
    row.points += 1;
  } else {
    row.losses += 1;
  }
}

function normalizeMatch(item, now) {
  const homeCompetitor = findCompetitor(item, 'home');
  const awayCompetitor = findCompetitor(item, 'away');
  const kickoff = toDate(pick(item, ['date', 'kickoff', 'utcDate', 'time', 'fixture.date']));
  const homeTeam = normalizeTeam(homeCompetitor || pick(item, ['homeTeam', 'home', 'competitors.0']));
  const awayTeam = normalizeTeam(awayCompetitor || pick(item, ['awayTeam', 'away', 'competitors.1']));
  const statusValue = pick(item, ['status.type.state', 'status.type.name', 'status.type.description', 'status.description', 'state', 'status']);

  if (!homeTeam.name || !awayTeam.name) return null;

  return {
    group: extractGroupName(item),
    kickoff,
    home: homeTeam.name,
    homeFlag: homeTeam.flag,
    away: awayTeam.name,
    awayFlag: awayTeam.flag,
    status: normalizeStatus(statusValue, kickoff || now, now),
    homeScore: competitorScore(homeCompetitor),
    awayScore: competitorScore(awayCompetitor),
  };
}

function extractGroupName(item) {
  const values = [];
  addGroupCandidates(values, item);
  addGroupCandidates(values, item.competitions && item.competitions[0]);
  addGroupCandidates(values, item.season);
  addGroupCandidates(values, item.group);
  addNoteCandidates(values, item.competitions && item.competitions[0] && item.competitions[0].notes);

  for (const value of values) {
    const label = normalizeGroupLabel(value);
    if (label) return label;
  }
  return '';
}

function addGroupCandidates(values, value) {
  if (!value || typeof value !== 'object') return;
  values.push(value.groupName, value.group, value.displayName, value.name, value.abbreviation, value.shortName, value.description, value.stage, value.round);
  if (value.type && typeof value.type === 'object') values.push(value.type.name, value.type.description, value.type.abbreviation);
}

function addNoteCandidates(values, notes) {
  if (!Array.isArray(notes)) return;
  for (const note of notes) {
    values.push(note.headline, note.text, note.type);
  }
}

function parseGroupMembership(json) {
  const output = {};
  if (!json) return output;
  const raw = JSON.parse(json);
  for (const group of Object.keys(raw)) {
    const label = normalizeGroupLabel(group) || group;
    const teams = Array.isArray(raw[group]) ? raw[group] : [];
    for (const teamName of teams) {
      const normalized = normalizeTeam({ displayName: teamName });
      output[normalizeLookup(normalized.name)] = label;
      output[normalizeLookup(teamName)] = label;
    }
  }
  return output;
}

function pickMatchArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  const candidates = [raw.events, raw.matches, raw.data, raw.fixtures, raw.response, raw.schedule];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function findCompetitor(item, homeAway) {
  const competitors = pick(item, ['competitions.0.competitors', 'competitors']);
  if (!Array.isArray(competitors)) return null;
  for (const competitor of competitors) {
    if (String(competitor.homeAway || '').toLowerCase() === homeAway) return competitor;
  }
  return competitors[homeAway === 'home' ? 0 : 1] || null;
}

function competitorScore(competitor) {
  if (!competitor) return null;
  if (competitor.score != null) return toNumber(competitor.score);
  return toNumber(pick(competitor, ['score.value', 'score.displayValue']));
}

function normalizeStandingRow(row) {
  return {
    rank: row.rank,
    team: row.team,
    flag: row.flag || '',
    played: fallbackNumber(row.played),
    wins: fallbackNumber(row.wins),
    draws: fallbackNumber(row.draws),
    losses: fallbackNumber(row.losses),
    goalsFor: fallbackNumber(row.goalsFor),
    goalsAgainst: fallbackNumber(row.goalsAgainst),
    goalDiff: fallbackNumber(row.goalDiff),
    points: fallbackNumber(row.points),
  };
}

function compareRows(a, b) {
  const aRank = a.rank || 999;
  const bRank = b.rank || 999;
  if (aRank !== bRank && (a.rank || b.rank)) return aRank - bRank;
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.team.localeCompare(b.team, 'zh-Hans-CN');
}

function compareGroups(a, b) {
  return groupSortValue(a.label) - groupSortValue(b.label) || a.label.localeCompare(b.label, 'zh-Hans-CN');
}

function groupSortValue(label) {
  const match = String(label || '').match(/([A-Z])组|小组\s*([A-Z])|Group\s*([A-Z])/i);
  const letter = match && (match[1] || match[2] || match[3]);
  if (letter) return letter.toUpperCase().charCodeAt(0) - 64;
  const number = String(label || '').match(/\d+/);
  return number ? Number(number[0]) : 999;
}

function normalizeGroupLabel(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  let match = text.match(/(?:Group|GROUP|group)\s*([A-L])/);
  if (match) return match[1].toUpperCase() + '组';
  match = text.match(/([A-L])\s*(?:组|Group|GROUP|group)/);
  if (match) return match[1].toUpperCase() + '组';
  match = text.match(/小组\s*([A-L])/i);
  if (match) return match[1].toUpperCase() + '组';
  if (/^[A-L]$/i.test(text)) return text.toUpperCase() + '组';
  if (/^(小组赛|Group Stage)$/i.test(text)) return '小组赛';
  if (/组|group|小组/i.test(text)) return text.replace(/^Group\s*/i, '').replace(/\s*Group$/i, '组');
  return '';
}

function renderInline(state) {
  const leader = firstLeader(state.groups);
  return {
    type: 'widget',
    children: [{
      type: 'text',
      text: leader ? '世界杯积分 ' + leader.group + ' ' + leader.row.team + ' ' + leader.row.points + '分' : '世界杯积分 暂无数据',
      maxLines: 1,
      minScale: 0.7,
    }],
  };
}

function renderCircular(state) {
  const leader = firstLeader(state.groups);
  return {
    type: 'widget',
    padding: 4,
    backgroundColor: COLORS.background,
    children: [
      text('世界杯', { size: 'caption2', weight: 'semibold' }, COLORS.text, { textAlign: 'center', maxLines: 1, minScale: 0.55 }),
      text(leader ? leader.group : '积分', { size: 'caption1', weight: 'bold' }, COLORS.accent, { textAlign: 'center', maxLines: 1, minScale: 0.5 }),
      text(leader ? leader.row.points + '分' : '暂无', { size: 'caption2', weight: 'medium' }, COLORS.muted, { textAlign: 'center', maxLines: 1, minScale: 0.5 }),
    ],
  };
}

function renderRectangular(state) {
  const leader = firstLeader(state.groups);
  return {
    type: 'widget',
    padding: 8,
    backgroundColor: COLORS.background,
    children: [
      text('世界杯小组积分', { size: 'caption1', weight: 'bold' }, COLORS.text, { maxLines: 1, minScale: 0.6 }),
      text(leader ? leader.group + ' ' + leader.row.flag + leader.row.team + ' ' + leader.row.points + '分' : '暂无积分数据', { size: 'caption2', weight: 'medium' }, COLORS.muted, { maxLines: 1, minScale: 0.55 }),
    ],
  };
}

function renderSmall(state, env, now) {
  const selected = selectedGroupState(state.groups, env);
  return {
    type: 'widget',
    padding: 0,
    backgroundColor: COLORS.panelGreen,
    refreshAfter: refreshAfter(now, env),
    children: [
      state.error ? errorPanel(state.error, true) : standingsPanel(selected.group, true),
    ].filter(Boolean),
  };
}

function renderTable(state, env, now, family) {
  const selected = selectedGroupState(state.groups, env);
  const compact = family === 'systemMedium';
  return {
    type: 'widget',
    padding: 0,
    backgroundColor: COLORS.panelGreen,
    refreshAfter: refreshAfter(now, env),
    children: [
      state.error ? errorPanel(state.error, compact) : standingsPanel(selected.group, compact),
    ].filter(Boolean),
  };
}

function standingsPanel(group, compact) {
  if (!group) return emptyPanel(compact);
  return {
    type: 'stack',
    direction: 'column',
    gap: compact ? 8 : 10,
    padding: compact ? [12, 10, 10, 10] : [18, 14, 14, 14],
    backgroundColor: COLORS.panelGreen,
    children: [
      text(group.label, { size: compact ? 16 : 23, weight: 'bold' }, '#FFFFFF', { maxLines: 1, minScale: 0.75 }),
      standingsTable(group, compact),
    ],
  };
}

function standingsTable(group, compact) {
  return {
    type: 'stack',
    direction: 'column',
    gap: 0,
    padding: compact ? [8, 8, 8, 8] : [12, 12, 12, 12],
    backgroundColor: COLORS.table,
    borderRadius: compact ? 10 : 14,
    children: [
      tableHeader(compact),
      ...group.rows.slice(0, 4).map(function(row) {
        return standingRow(row, compact);
      }),
    ],
  };
}

function tableHeader(compact) {
  const size = compact ? 9 : 12;
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    padding: compact ? [0, 0, 6, 0] : [0, 0, 10, 0],
    children: [
      text('球队', { size, weight: 'medium' }, COLORS.faint, { flex: 1, maxLines: 1 }),
      text('场次', { size, weight: 'medium' }, COLORS.faint, { width: compact ? 28 : 42, textAlign: 'center', maxLines: 1, minScale: 0.55 }),
      text('胜/平/负', { size, weight: 'medium' }, COLORS.faint, { width: compact ? 52 : 72, textAlign: 'center', maxLines: 1, minScale: 0.55 }),
      text('进/失', { size, weight: 'medium' }, COLORS.faint, { width: compact ? 36 : 52, textAlign: 'center', maxLines: 1, minScale: 0.55 }),
      text('积分', { size, weight: 'medium' }, COLORS.faint, { width: compact ? 28 : 42, textAlign: 'right', maxLines: 1, minScale: 0.6 }),
    ],
  };
}

function standingRow(row, compact) {
  const size = compact ? 9 : 12;
  const zone = row.rank <= 2 ? 'qualify' : row.rank === 3 ? 'pending' : 'normal';
  const zoneBg = zone === 'qualify' ? COLORS.qualifyBg : zone === 'pending' ? COLORS.pendingBg : undefined;
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    padding: compact ? [5, 0, 5, 0] : [9, 0, 9, 0],
    backgroundColor: zoneBg,
    children: [
      rankCell(row.rank, compact),
      text((row.flag || '') + '  ' + row.team, { size, weight: 'semibold' }, COLORS.text, { flex: 1, maxLines: 1, minScale: 0.55 }),
      text(String(row.played), { size, weight: 'medium' }, COLORS.muted, { width: compact ? 28 : 42, textAlign: 'center', maxLines: 1 }),
      text(row.wins + ' / ' + row.draws + ' / ' + row.losses, { size, weight: 'medium' }, COLORS.muted, { width: compact ? 52 : 72, textAlign: 'center', maxLines: 1, minScale: 0.5 }),
      text(row.goalsFor + ' / ' + row.goalsAgainst, { size, weight: 'medium' }, COLORS.muted, { width: compact ? 36 : 52, textAlign: 'center', maxLines: 1, minScale: 0.55 }),
      text(String(row.points), { size, weight: 'bold' }, COLORS.text, { width: compact ? 28 : 42, textAlign: 'right', maxLines: 1 }),
    ],
  };
}

function rankCell(rank, compact) {
  const size = compact ? 9 : 12;
  const label = rank === 1 ? '出线区' : rank === 3 ? '待定区' : '';
  const labelColor = rank === 1 ? COLORS.qualify : COLORS.pending;
  return {
    type: 'stack',
    direction: 'column',
    width: compact ? 30 : 42,
    gap: compact ? 1 : 2,
    children: [
      label ? text(label, { size: compact ? 7 : 9, weight: 'bold' }, labelColor, { maxLines: 1, minScale: 0.5 }) : null,
      text(String(rank), { size, weight: 'medium' }, COLORS.muted, { maxLines: 1 }),
    ].filter(Boolean),
  };
}

function errorPanel(message, compact) {
  return {
    type: 'stack',
    direction: 'column',
    gap: compact ? 8 : 10,
    padding: compact ? [12, 10, 10, 10] : [18, 14, 14, 14],
    backgroundColor: COLORS.panelGreen,
    children: [
      text('小组积分', { size: compact ? 16 : 23, weight: 'bold' }, '#FFFFFF', { maxLines: 1, minScale: 0.75 }),
      {
        type: 'stack',
        direction: 'column',
        gap: 6,
        padding: compact ? 10 : 14,
        backgroundColor: COLORS.table,
        borderRadius: compact ? 10 : 14,
        children: [
          text('积分数据加载失败', { size: compact ? 11 : 13, weight: 'bold' }, COLORS.error, { maxLines: 1 }),
          text(String(message || '请稍后再试'), { size: compact ? 9 : 11, weight: 'medium' }, COLORS.muted, { maxLines: 3, minScale: 0.55 }),
        ],
      },
    ],
  };
}

function emptyPanel(compact) {
  return {
    type: 'stack',
    direction: 'column',
    gap: compact ? 8 : 10,
    padding: compact ? [12, 10, 10, 10] : [18, 14, 14, 14],
    backgroundColor: COLORS.panelGreen,
    children: [
      text('小组积分', { size: compact ? 16 : 23, weight: 'bold' }, '#FFFFFF', { maxLines: 1, minScale: 0.75 }),
      {
        type: 'stack',
        padding: compact ? 10 : 14,
        backgroundColor: COLORS.table,
        borderRadius: compact ? 10 : 14,
        children: [
          text('暂无小组积分数据', { size: compact ? 11 : 13, weight: 'semibold' }, COLORS.muted, { maxLines: 2, minScale: 0.6 }),
        ],
      },
    ],
  };
}

function selectedGroupState(groups, env) {
  const selected = normalizeSelectedGroup(env.GROUP || env.GROUP_KEY || env.GROUP_NAME || 'A');
  let group = groups.find(function(item) {
    return normalizeSelectedGroup(item.label) === selected;
  });
  if (!group) group = groups[0];
  return { groups, group };
}

function normalizeSelectedGroup(value) {
  const text = String(value || '').trim();
  const match = text.match(/[A-L]/i);
  return match ? match[0].toUpperCase() : text;
}

function firstLeader(groups) {
  for (const group of groups) {
    if (group.rows.length) return { group: group.label, row: group.rows[0] };
  }
  return null;
}

function text(value, font, color, extra) {
  return Object.assign({
    type: 'text',
    text: String(value == null ? '' : value),
    font,
    textColor: color,
  }, extra || {});
}

function refreshAfter(now, env) {
  const minutes = Math.max(1, Number(env.REFRESH_MINUTES || 10));
  return new Date(now.getTime() + minutes * 60 * 1000).toISOString();
}

function formatSigned(value) {
  const number = fallbackNumber(value);
  return number > 0 ? '+' + number : String(number);
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
  if (typeof value === 'string') return value;
  return pick(value, ['displayName', 'shortDisplayName', 'name', 'team.displayName', 'team.shortDisplayName', 'team.name']) || '';
}

function rawTeamCode(value) {
  if (!value || typeof value === 'string') return '';
  return pick(value, ['abbreviation', 'country', 'team.abbreviation', 'team.country']) || '';
}

function buildHeaders(env) {
  if (env.API_HEADERS) return JSON.parse(env.API_HEADERS);
  return {};
}

function templateValues(now) {
  return {
    season: DEFAULT_SEASON,
    date: dayKey(now),
    startDate: DEFAULT_GROUP_STAGE_START,
    endDate: DEFAULT_GROUP_STAGE_END,
  };
}

function fillTemplate(template, values) {
  return String(template || '').replace(/\{(season|date|startDate|endDate)\}/g, function(_, key) {
    return values[key] || '';
  });
}

function normalizeStatus(value, kickoff, now) {
  const raw = value == null ? '' : String(value).toLowerCase();
  const compact = raw.replace(/[\s_-]+/g, '');
  if (compact === 'pre' || compact === 'scheduled' || compact === 'timed') return 'scheduled';
  if (compact === 'in') return 'live';
  if (compact === 'post') return 'finished';
  if (includesAny(compact, ['live', 'inplay', 'inprogress', 'paused', 'playing', '1h', '2h', 'ht'])) return 'live';
  if (includesAny(compact, ['finished', 'fulltime', 'ended', 'closed', 'complete', 'ft', 'aet'])) return 'finished';
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

function pick(obj, paths) {
  if (!obj) return undefined;
  for (const path of paths) {
    const value = get(obj, path);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function get(obj, path) {
  const parts = String(path || '').split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = /^\d+$/.test(part) ? current[Number(part)] : current[part];
  }
  return current;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function toNumber(value) {
  if (value == null || value === '') return null;
  const match = String(value).match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  return isFinite(number) ? number : null;
}

function fallbackNumber(value) {
  const number = toNumber(value);
  return number == null ? 0 : number;
}

function normalizeStatKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '');
}

function dayKey(date) {
  const beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return beijing.getUTCFullYear() + '-' + pad(beijing.getUTCMonth() + 1) + '-' + pad(beijing.getUTCDate());
}

function formatTime(date) {
  const beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return pad(beijing.getUTCHours()) + ':' + pad(beijing.getUTCMinutes());
}

function pad(value) {
  return String(value).padStart(2, '0');
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
  const code = String(alpha2 || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(
    0x1F1E6 + code.charCodeAt(0) - 65,
    0x1F1E6 + code.charCodeAt(1) - 65
  );
}
