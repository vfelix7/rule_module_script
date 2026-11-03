# rule_module_script

Egern and Surge rules, modules, and scripts.

## Widgets

### World Cup Schedule

- Script: `egern/scripts/WorldCup_Widget.js`
- Config snippet: `egern/module/WorldCup_Widget.yaml`
- Surge module: `surge/module/WorldCup_Surge.sgmodule`
- Data source: ESPN FIFA World Cup (`fifa.world`)

Default widget env:

```yaml
# No env is required when using the default ESPN source.
```

The widget shows yesterday, today, and tomorrow in Beijing time. The default ESPN source does not require an API key or environment variables. Finished matches show scores, live matches show `进行中`, and scheduled matches show kickoff time. Team names are displayed in Chinese with country flags when the team can be matched.

Surge panel module:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/surge/module/WorldCup_Surge.sgmodule
```

### QWeather

- Script: `egern/scripts/QWeather_Widget.js`

### Network Security Check

- Script: `egern/scripts/Network_Security_Widget.js`
- Module: `egern/module/Network_Security_Widget.yaml`

Module URL:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/egern/module/Network_Security_Widget.yaml
```

Optional env:

```yaml
MONITOR_POLICY: "Proxy"   # policy for the proxy egress check; empty follows routing rules
SHOW_IP: "false"          # true shows the full egress IP
REFRESH_MINUTES: "10"     # 5-60
```

The widget checks egress isolation (proxy vs direct), DNS leaks, IPv6
routing, the TLS version, and captive portals.

### Streaming and AI Unlock

- Script: `egern/scripts/Streaming_Unlock_Widget.js`
- Config snippet: `egern/module/Streaming_Unlock_Widget.yaml`

Module URL:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/egern/module/Streaming_Unlock_Widget.yaml
```

No environment variables are required. Each service request omits `policy` and
`policyDescriptor`, so Egern applies the configured routing rules separately
for YouTube, Netflix, Disney+, ChatGPT, Claude, and Gemini.

The AI checks follow the current RegionRestrictionCheck methods and compare the
egress region with each service's official supported list. ChatGPT uses the
`api.openai.com` compliance endpoint and `ios.chat.openai.com` (`仅网页` means
the IP is flagged as a data center or VPN, so the app is refused). Claude
follows the `claude.ai` redirect to `app-unavailable-in-region`. Gemini reads
the availability marker and country code from its page. A Hong Kong egress
shows ChatGPT and Claude as locked, while Gemini is available.

### Media & AI Unlock (rewrite)

A rewrite of the unlock widget with the same look. The original
`Streaming_Unlock_Widget` is kept; both modules can be installed side by side.

- Script: `egern/scripts/Media_AI_Unlock_Widget.js`
- Module: `egern/module/Media_AI_Unlock_Widget.yaml`

Module URL:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/egern/module/Media_AI_Unlock_Widget.yaml
```

Optional env:

```yaml
POLICY: "Proxy"            # send every check through this policy; empty follows routing rules
STREAMING_POLICY: "JP"     # only YouTube, Netflix, Disney+ (overrides POLICY)
AI_POLICY: "US"            # only ChatGPT, Claude, Gemini (overrides POLICY)
REFRESH_MINUTES: "30"      # 5-120; each run downloads about 2-3 MB
```

Checks follow the current RegionRestrictionCheck methods: YouTube Premium page,
two non-original Netflix titles (`自制剧` means originals only), the Disney+
device API with its `inSupportedLocation` flag, and the ChatGPT, Claude and
Gemini checks described above. Gemini also asks its own location endpoint
(`K4WWud`, the one RegionRestrictionCheck uses) when the page gives no answer.
Egern throws 4xx responses as `HTTP error! status: …, body: …`; the script turns
them back into responses, so a 403 body such as `unsupported_country` still
counts. Failed checks show the reason in the badge and the failing host with
the status or raw error at the bottom. Small, medium, large and lock-screen
sizes are supported.

### Codex Usage

- Script: `egern/scripts/Codex_Usage_Widget.js`
- Module: `egern/module/Codex_Usage_Widget.yaml`

Module URL:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/egern/module/Codex_Usage_Widget.yaml
```

Required module env:

```yaml
CODEX_ACCESS_TOKEN: "ChatGPT/Codex OAuth access token"
```

Optional env:

```yaml
CODEX_ACCOUNT_ID: "ChatGPT account id"
TIME_ZONE: "Asia/Shanghai"
REFRESH_MINUTES: "15"
```

The widget shows the remaining 5-hour and weekly Codex usage percentages,
their reset times, and the account plan. Credentials are read only from the
Egern module environment and are not stored in the repository.

### CF Server Monitor

- Script: `egern/scripts/CF_Server_Monitor_Widget.js`
- Module: `egern/module/CF_Server_Monitor_Widget.yaml`
- Data source: `GET /api/servers` of [CF-Server-Monitor](https://github.com/huilang-me/CF-Server-Monitor)

Module URL:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/egern/module/CF_Server_Monitor_Widget.yaml
```

Required module env:

```yaml
CFSM_URL: "https://monitor.example.com"
```

Optional env:

```yaml
POLICY: "Proxy"            # needed when *.workers.dev is unreachable directly
CFSM_TOKEN: "admin JWT"     # private site: token, or
CFSM_USER: "admin"          # private site: login, token cached and renewed
CFSM_PASS: "password"
SERVERS: "HK-01,JP-02"      # names or IDs; empty shows all
SHOW_HIDDEN: "false"
TITLE: "CF Monitor"
REFRESH_MINUTES: "15"
EXPIRE_WARN_DAYS: "14"
MAX_ROWS: "4"
```

The small widget shows the online ring, total speed, monthly traffic, and
offline or expiry alerts. The medium widget lists one server per row with CPU,
memory, and traffic. The large widget shows detail cards for up to 3 servers
(CPU, memory, disk, traffic with a depletion estimate, ISP latency, expiry and
price) and compact rows for more. Lock-screen sizes are supported. The global
Turnstile option of the dashboard must be off, because widgets cannot pass it.
Credentials are read only from the Egern module environment.

### CF Server Monitor · Latency & Traffic

A variant of the CF Server Monitor widget that focuses on ISP latency and
monthly traffic. It uses the same env as above and can be installed alongside
the original module (fill the env in each module).

- Script: `egern/scripts/CF_Server_Monitor_Net_Widget.js`
- Module: `egern/module/CF_Server_Monitor_Net_Widget.yaml`

Module URL:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/egern/module/CF_Server_Monitor_Net_Widget.yaml
```

The medium widget lists each server with its 电信 / 联通 / 移动 latency and
traffic used / limit. The large widget shows per-ISP latency with packet loss,
a 2-hour latency chart for up to 2 servers (needs 三网详情, on by default), and
a traffic bar with a depletion estimate. The small widget shows one server's
ISP latency and traffic, or average latency and traffic for up to 3 servers.
On the lock screen, the circular widget shows the highest traffic usage.
