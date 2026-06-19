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

### World Cup Group Standings

- Script: `egern/scripts/WorldCup_Group_Standings_Widget.js`
- Config snippet: `egern/yaml/WorldCup_Group_Standings_Widget.yaml`
- Data source: ESPN FIFA World Cup (`fifa.world`)
- Layout: green group card, qualification/pending section marks, and table columns `场次` / `胜/平/负` / `进/失` / `积分`

Egern widget config:

```text
https://raw.githubusercontent.com/vfelix7/rule_module_script/refs/heads/master/egern/yaml/WorldCup_Group_Standings_Widget.yaml
```

Default group selection:

```yaml
env:
  GROUP: "A"
```

The active group is controlled by `GROUP` in the widget environment.

### QWeather

- Script: `egern/scripts/QWeather_Widget.js`
