/*
 * IPPure - Surge IP 纯净度面板
 * 数据源：https://my.ippure.com/v1/info
 *
 * 参数：
 * Policy  - 指定检测策略/策略组；留空时按当前规则请求
 * Mark_IP - true/false，是否打码 IP，默认 true
 * Title   - 面板标题，默认 IP PURITY
 */

var API_URL = "https://my.ippure.com/v1/info";
var args = parseArguments(typeof $argument === "string" ? $argument : "");
var policy = readArgument(args, ["Policy", "policy"], "");
var markIP = readBoolean(readArgument(args, ["Mark_IP", "MARK_IP", "markIP"], "true"), true);
var panelTitle = readArgument(args, ["Title", "LABEL", "label"], "IP PURITY");

var request = {
  url: API_URL,
  headers: {
    Accept: "application/json",
    "User-Agent": "Surge IPPure Panel"
  },
  timeout: 8,
  "auto-cookie": false
};

if (policy) request.policy = policy;

$httpClient.get(request, function (error, response, body) {
  if (error) {
    finishError("请求失败", String(error));
    return;
  }

  var status = Number(response && (response.status || response.statusCode));
  if (status < 200 || status >= 300) {
    finishError("接口异常", "HTTP " + (status || "未知"));
    return;
  }

  var data;
  try {
    data = JSON.parse(body);
  } catch (e) {
    finishError("数据解析失败", "接口未返回有效 JSON");
    return;
  }

  var ip = text(data.ip);
  if (!ip) {
    finishError("未获取到 IP", "接口返回数据缺少 ip 字段");
    return;
  }

  var risk = extractRisk(data);
  var level = riskLevel(risk);
  var countryCode = text(data.countryCode).toUpperCase();
  var location = compactLocation(data, countryCode);
  var asn = data.asn !== undefined && data.asn !== null && data.asn !== ""
    ? "AS" + data.asn
    : "-";
  var organization = text(data.asOrganization) || "-";
  var residential = Boolean(data.isResidential);
  var networkType = residential ? "住宅 / 家宽" : "机房 / 商业";
  var ipVersion = ip.indexOf(":") >= 0 ? "IPv6" : "IPv4";
  var displayIP = markIP ? maskIP(ip) : ip;
  var score = Number.isFinite(risk) ? Math.round(risk) + " / 100" : "暂无评分";

  var lines = [
    ipVersion + "  " + displayIP,
    "位置  " + (location || "-"),
    "ASN   " + asn,
    "组织  " + truncate(organization, 42),
    "类型  " + networkType,
    "评分  " + score + " · " + level.label
  ];

  if (policy) lines.push("策略  " + policy);
  lines.push("更新  " + formatTime(new Date()));

  $done({
    title: panelTitle + " · " + level.title,
    content: lines.join("\n"),
    style: level.style
  });
});

function finishError(message, detail) {
  var lines = [message, detail || "未知错误"];
  if (policy) lines.push("策略  " + policy);
  lines.push("更新  " + formatTime(new Date()));

  $done({
    title: panelTitle + " · 检测失败",
    content: lines.join("\n"),
    style: "error"
  });
}

function parseArguments(input) {
  var result = {};
  if (!input) return result;

  input.split("&").forEach(function (item) {
    if (!item) return;
    var index = item.indexOf("=");
    var rawKey = index >= 0 ? item.slice(0, index) : item;
    var rawValue = index >= 0 ? item.slice(index + 1) : "";
    var key = safeDecode(rawKey);
    if (key) result[key] = safeDecode(rawValue);
  });

  return result;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(String(value || "").replace(/\+/g, " "));
  } catch (e) {
    return String(value || "");
  }
}

function readArgument(source, keys, fallback) {
  for (var i = 0; i < keys.length; i += 1) {
    if (source[keys[i]] !== undefined && source[keys[i]] !== "") {
      return String(source[keys[i]]).trim();
    }
  }
  return fallback;
}

function readBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  var normalized = String(value).toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
}

function extractRisk(source) {
  var candidates = [
    source.fraudScore,
    source.fraud_score,
    source.riskScore,
    source.risk_score,
    source.score,
    source.risk && source.risk.score,
    source.security && source.security.riskScore
  ];

  for (var i = 0; i < candidates.length; i += 1) {
    if (candidates[i] === undefined || candidates[i] === null || candidates[i] === "") {
      continue;
    }
    var parsed = Number(candidates[i]);
    if (Number.isFinite(parsed)) return parsed;
  }

  return NaN;
}

function riskLevel(risk) {
  if (!Number.isFinite(risk)) {
    return { label: "风险未知", title: "未知", style: "info" };
  }
  if (risk >= 80) {
    return { label: "极高风险", title: Math.round(risk) + " · 极高风险", style: "error" };
  }
  if (risk >= 70) {
    return { label: "高风险", title: Math.round(risk) + " · 高风险", style: "error" };
  }
  if (risk >= 40) {
    return { label: "中等风险", title: Math.round(risk) + " · 中等风险", style: "alert" };
  }
  return { label: "低风险", title: Math.round(risk) + " · 低风险", style: "good" };
}

function compactLocation(source, countryCode) {
  var flag = flagEmoji(countryCode);
  var city = text(source.city || source.region || source.state);
  var country = text(source.country);
  var parts = [];

  if (flag) parts.push(flag);
  if (city) parts.push(city);
  if (country && country !== city) parts.push(country);
  if (!city && !country && countryCode) parts.push(countryCode);

  return parts.join(" · ");
}

function maskIP(ip) {
  if (ip.indexOf(".") >= 0) {
    var ipv4 = ip.split(".");
    if (ipv4.length === 4) return ipv4[0] + "." + ipv4[1] + ".••." + ipv4[3];
    return ip;
  }

  var ipv6 = ip.split(":");
  if (ipv6.length >= 4) {
    return ipv6.slice(0, 2).join(":") + ":••:" + ipv6.slice(-1)[0];
  }
  return ip;
}

function flagEmoji(code) {
  if (!code || code.length !== 2) return "";
  var upper = code.toUpperCase();
  return String.fromCodePoint(
    127397 + upper.charCodeAt(0),
    127397 + upper.charCodeAt(1)
  );
}

function truncate(value, maxLength) {
  var output = text(value) || "-";
  return output.length > maxLength ? output.slice(0, maxLength - 1) + "…" : output;
}

function text(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function formatTime(date) {
  var hours = String(date.getHours()).padStart(2, "0");
  var minutes = String(date.getMinutes()).padStart(2, "0");
  var seconds = String(date.getSeconds()).padStart(2, "0");
  return hours + ":" + minutes + ":" + seconds;
}
