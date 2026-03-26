import { PRESETS, STAT_DEFS } from '../game/draft'

export function StatsPanel({ draft, run, remainingStatPoints, onSetStat, onApplyPreset }) {
  return (
    <section className="panel side-panel">
      <div className="panel-title-row">
        <h2>Strain stats</h2>
        <span className="chip">{remainingStatPoints} free</span>
      </div>

      <p className="muted">Base stats start at 2. Spend carefully or lean into one branch hard.</p>

      <div className="preset-row">
        {PRESETS.map((preset) => (
          <button key={preset.id} type="button" className="ghost small" onClick={() => onApplyPreset(preset.id)}>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="stat-list">
        {STAT_DEFS.map((stat) => (
          <label key={stat.key} className="stat-card">
            <div className="stat-header">
              <div>
                <strong>{stat.name}</strong>
                <p className="muted">{stat.description}</p>
              </div>
              <span className="value-pill">{draft.stats[stat.key]}</span>
            </div>
            <input
              type="range"
              min={stat.min}
              max={stat.max}
              value={draft.stats[stat.key]}
              onChange={(event) => onSetStat(stat.key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>

      <div className="result-card compact">
        <span className="label">run pacing</span>
        <strong>Level {run.level}</strong>
        <p className="muted">Each win grants +1 stat point and +1 genome point.</p>
      </div>
    </section>
  )
}
