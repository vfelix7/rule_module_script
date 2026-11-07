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

### IP Purity (IPPure)

- Script: `egern/scripts/IP_Purity_Widget.js`
- Module: `egern/module/IP_Purity_Widget.yaml`
- Surge module: `surge/module/IP_Purity_Surge.sgmodule`
- Surge panel with the widget's bands: `surge/module/IPPure_Surge.sgmodule`
- Data source: `https://my.ippure.com/v1/info`

Module URL:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/egern/module/IP_Purity_Widget.yaml
```

Optional env:

```yaml
POLICY: "Proxy"         # policy group or node to check; empty follows routing rules
MARK_IP: "true"         # false shows the full IP
REFRESH_MINUTES: "10"
LABEL: "Tokyo"          # tells widgets apart: bottom right on small and medium, not on large; defaults to the policy name
```

The widget draws the same meter as ippure.com, as one SVG: six equal bands in
one bar, from 极度纯净 to 极度风险, in the site's colors. A label in the band's
color sits above the bar with the score and the site's name for the band, and
its pointer marks the exact score: as on the site, each band takes a sixth of
the bar and the score is linear inside it, so 61 sits 55% into 50–70. The
boundaries 0, 15, 25, 40, 50, 70 and 100 run below the bar. The bands follow
the site: 0–15 极度纯净, 16–25 纯净, 26–40 中性, 41–50 轻度风险, 51–70 中度风险
and 71–100 极度风险, with a boundary value in the lower band. IPv6 addresses are
not scored. The widget also shows native or broadcast IP, residential or data
center, location, ASN, and the IP. Set `POLICY` to a landing node to check that
node's IP.

The band colors are Tailwind's green-800, green-500, lime-500, yellow-500,
orange-500 and red-600 (`#166534`, `#22C55E`, `#84CC16`, `#EAB308`, `#F97316`,
`#DC2626`). Screenshots from an iPhone or a Mac are in Display P3, so their
pixels read as sRGB look duller; converted to sRGB they match these values.
Native and residential are green (`#48C78E`), broadcast and data center pink
(`#FE6685`): the pair ippure.com uses for human and bot traffic. On the large
widget, the 属性 and 来源 rows show these as colored text.

Egern does not tell a script how wide the widget is, so the SVG is drawn at the
iPhone 15/16 size and scaled to the real width. Positions scale with the bar and
stay exact; text is slightly larger or smaller on other phones. The image frame
is 12% taller than the drawing, so the width fills first even on a Pro Max. The
drawing reaches the widget's right edge (both edges on small and large) and the
bar is inset to line up with the rows above and below, so 100 can sit centered
on the bar's end as on the site. The label stops at the ends of the bar, and its
pointer still marks the score. On the device, Egern draws the gray tick digits
about 0.17em below the baseline the SVG gives them (the label's bold text is
where it should be), so the ticks are raised by that much and the drawing keeps
room below them.

The 运营商 row shows the holder of the AS, looked up by ASN on RIPEstat
(`https://stat.ripe.net/data/as-overview/data.json?resource=AS<asn>`), which is
what ippure.com shows next to the ASN. IPPure's own `asOrganization` is
sometimes whoever uses the address block rather than the AS holder (an IIJ block
on AS2497 comes back as Stacks Inc.), so it is only the fallback. The holder is
cached per ASN for 30 days in Egern's storage, and a failed lookup is tried
again after an hour.

The small widget has the location and time in small gray type on top, then the
IP in 16pt bold with its operator below it in gray. The meter is smaller there
and has no ticks, and sits halfway between the operator and the bottom row,
which has the IP type on the left and the `LABEL` name on the right. A long
operator name wraps to a second line instead of shrinking.

The medium widget has location and time on top, the IP, ASN and 运营商 on the
left, and the meter on the right with its label level with the IP. The IP type
and the `LABEL` name are at the bottom.

The large widget has location and time on top, then the IP in 22pt. It leaves
out the `LABEL` name, since its 检测 row already names the policy. The IP sits
18pt above the meter, so the two read as one group, and the height left over is
split between the gap under the top row and the gap above the details. The
meter's label is 15pt there, smaller than the IP. The details list 属性, 来源,
ASN, 运营商 and 检测, with labels and values both in 13pt and told apart by
color; 属性 and 来源 say only 机房 or 广播 IP, with no explanation after them.

Lock-screen widgets show the score and a two-character band name (极净, 纯净,
中性, 轻险, 中险, 极险), since the system tints them in one color.

All text uses the system font: SF Pro, with PingFang for Chinese. The meter's
SVG asks for `-apple-system`, which is the same font.

In Egern, an element with `flex` fills both directions, even when it has a
`height`, so a row that holds one grows taller and squeezes the spacers next to
it to zero. Every row here that holds `flex` children has an explicit height.

Surge panel module, with the same bands, colors and operator lookup as the
widget:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/surge/module/IPPure_Surge.sgmodule
```

Its arguments are `Proxy`, the policy group or node to check, and `MarkIP`
(default `true`). Surge refuses a module argument with an empty default, so
`Proxy` defaults to `跟随规则`, which follows Surge's rules. The title gives the
score and the site's band name, and the icon takes the band's color; IPv6 shows
不评分 with a gray icon. Below are the IP and location, then 属性, 来源, ASN and 运营商,
one per line. A panel shows plain text in a proportional font, so the labels are
padded with full-width spaces to four characters wide and the values start in
one column; there is no meter. The holder is cached per ASN in
`$persistentStore`, as in the widget. The older `IP_Purity_Surge.sgmodule` is
unchanged, and the two use different panel and script names, so both can be
enabled.

### Media & AI Unlock

- Script: `egern/scripts/Media_AI_Unlock_Widget.js`
- Module: `egern/module/Media_AI_Unlock_Widget.yaml`
- Surge module: `surge/module/Media_AI_Unlock_Surge.sgmodule`

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

No env is required. Without a policy, each request follows Egern's routing
rules, so every service is checked through the node it would really use.

Checks follow the current RegionRestrictionCheck methods and compare the egress
region with each service's official supported list:

- YouTube: the Premium page's region and purchase entry.
- Netflix: two non-original titles; `自制剧` means originals only.
- Disney+: the device API's `countryCode` and `inSupportedLocation`.
- ChatGPT: the `api.openai.com` compliance endpoint and `ios.chat.openai.com`;
  `网页` means the IP is flagged as a data center or VPN, so the app is refused.
- Claude: the `claude.ai` redirect to `app-unavailable-in-region`.
- Gemini: the page's availability marker and country code, plus its own
  location endpoint (`K4WWud`). A Hong Kong egress shows ChatGPT and Claude as
  locked, while Gemini is available.

Egern throws 4xx responses as `HTTP error! status: …, body: …`; the script turns
them back into responses, so a 403 body such as `unsupported_country` still
counts. Failed checks show the reason in the badge and the failing host with
the status or raw error at the bottom. The `ms` value is how long the whole
check took, not node latency. Small, medium, large and lock-screen sizes are
supported.

Surge panel module:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/surge/module/Media_AI_Unlock_Surge.sgmodule
```

It runs the same checks. Its arguments `Proxy`, `StreamingProxy` and `AIProxy`
work like the env above. Surge refuses a module argument with an empty default,
so `Proxy` defaults to `跟随规则`, which follows Surge's rules, and the other two
default to `同Proxy`, which uses whatever `Proxy` says; set either of them to
`跟随规则` to follow the rules while `Proxy` names a node. The title gives how many
services passed. Each service gets a line that starts with a status dot (🟢
available, 🟡 partial or unverified, 🔴 locked or failed) and the region's flag,
or 🌐 when no region was found: the panel's text is proportional, but these emoji
are all the same width, so the service names line up. A note such as 仅自制剧, 锁定 or
超时 follows the name, then the check's time. The last lines name the policy and
the time, and for up to two failed checks the host and the raw error. The panel
refreshes every 30 minutes. Surge's `$httpClient` returns 4xx responses as usual
and scripts have no `URL`, so redirects are followed by hand; a check still
running after 36 seconds is reported as 超时, so the rest still show before the
module's 40-second timeout.

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

## Tools

### Script Bench

Compares the script engines of Surge and Egern with the same workload.

- Surge script: `surge/scripts/Script_Bench_Surge.js`
- Surge module: `surge/module/Script_Bench_Surge.sgmodule`
- Egern script: `egern/scripts/Script_Bench.js`
- Egern module: `egern/module/Script_Bench.yaml`

Module URLs:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/surge/module/Script_Bench_Surge.sgmodule
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/egern/module/Script_Bench.yaml
```

Surge module argument:

```text
Engine: auto   # auto (what your other scripts use), jsc or webview
```

Both are request scripts on `^http://example\.com/bench/` that answer the
request themselves, so nothing leaves the phone and the line does not affect
the result:

- `/bench/light` returns `ok` at once. Its round trip is the fixed cost of one
  script call: starting the engine and passing data in and out.
- `/bench/heavy` builds a 380 KB JSON, then 10 times parses it, drops the "ad"
  items, serializes it and runs a regex replace, and returns how long that took
  inside the script, such as `85 ms (3102830)`. The number in brackets is a
  checksum and must be the same in both apps.

The two scripts share the same `heavyWork()` and differ only in how they read
the request and answer it (`$request` and `$done` in Surge, `ctx.request` and
`ctx.respond` in Egern), so change both files together.

Measure with Shortcuts rather than Safari, since Safari may upgrade `http://`
to HTTPS and the pattern then no longer matches:

- Light: Date, then Repeat 200 times Get Contents of URL
  `http://example.com/bench/light?i=` + Repeat Index, then Date. Get Time
  Between Dates in seconds and multiply by 5 for milliseconds per call.
- Heavy: Repeat 10 times Get Contents of URL
  `http://example.com/bench/heavy?i=` + Repeat Index and collect the results.
  Drop the first and take the median.

Run three sets, Surge with `Engine: auto`, Surge with `Engine: jsc` and Egern,
three rounds each, with only this module on and Low Power Mode off. Turn the
module off when you are done.
