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
