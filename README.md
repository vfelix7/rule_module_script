# Egern Config

Egern configuration snippets and JavaScript widgets.

## Widgets

### World Cup Schedule

- Script: `scripts/WorldCup_Widget.js`
- Config snippet: `configs/WorldCup_Widget.yaml`
- Data source: football-data.org

Required widget env:

```yaml
DATA_SOURCE: "football-data"
API_KEY: "your football-data.org token"
```

The widget shows yesterday, today, and tomorrow. Finished matches show scores, live matches show `进行中`, and scheduled matches show kickoff time.

### QWeather

- Script: `scripts/QWeather_Widget.js`
