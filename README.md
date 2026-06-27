# rule_module_script

Egern and Surge rules, modules, and scripts.

## Widgets

### World Cup Schedule

- Script: `egern/scripts/WorldCup_Widget.js`
- Config snippet: `egern/yaml/WorldCup_Widget.yaml`
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

### Codex Usage

- Script: `egern/scripts/Codex_Usage_Widget.js`
- Module: `egern/yaml/Codex_Usage_Widget.yaml`

Module URL:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/egern/yaml/Codex_Usage_Widget.yaml
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
