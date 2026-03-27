import { PRESETS } from '../game/draft'

function StepperStat({ label, description, value, min = 0, max = 8, freePoints, onChange }) {
  const canDown = value > min
  const canUp = value < max && freePoints > 0

  return (
    <div className="build-stat-card">
      <div className="build-stat-copy">
        <span className="label">stat</span>
        <strong>{label}</strong>
        <p className="muted">{description}</p>
      </div>

      <div className="stepper-row">
        <button type="button" className="stepper-button" onClick={() => onChange(value - 1)} disabled={!canDown}>−</button>
        <div className="stepper-value">{value}</div>
        <button type="button" className="stepper-button" onClick={() => onChange(value + 1)} disabled={!canUp}>+</button>
      </div>
    </div>
  )
}

export function StatsPanel({ draft, run, remainingStatPoints, onSetStat, onApplyPreset }) {
  return (
    <section className="panel build-panel">
      <div className="panel-title-row build-header">
        <div>
          <span className="label">build</span>
          <h2>Shape your slime</h2>
        </div>
        <span className="chip">{remainingStatPoints} free point{remainingStatPoints === 1 ? '' : 's'}</span>
      </div>

      <div className="build-stats-grid">
        <StepperStat
          label="Attack"
          description="How hard your slime hits when it pushes into enemy cells."
          value={draft.stats.attack}
          freePoints={remainingStatPoints}
          onChange={(nextValue) => onSetStat('attack', nextValue)}
        />

        <StepperStat
          label="Growth"
          description="How much better heavy cells convert into even more mass."
          value={draft.stats.growth}
          freePoints={remainingStatPoints}
          onChange={(nextValue) => onSetStat('growth', nextValue)}
        />

        <div className="build-stat-card spread-card wide-card">
          <div className="build-stat-copy">
            <span className="label">tactic</span>
            <strong>Growth ↔ Spread</strong>
            <p className="muted">Choose whether your slime prefers getting denser first or pushing outward sooner.</p>
          </div>

          <div className="spread-control">
            <span>Grow</span>
            <input
              type="range"
              min="0"
              max="100"
              value={draft.stats.spreadBias}
              onChange={(event) => onSetStat('spreadBias', Number(event.target.value))}
            />
            <span>Spread</span>
          </div>

          <div className="spread-readout">{draft.stats.spreadBias}% spread bias</div>
        </div>
      </div>

      <div className="preset-row">
        {PRESETS.map((preset) => (
          <button key={preset.id} type="button" className="ghost small" onClick={() => onApplyPreset(preset.id)}>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="result-card compact build-footnote">
        <span className="label">progression</span>
        <strong>{run.wins} wins</strong>
        <p className="muted">Each win gives +1 stat point and +1 skill point.</p>
      </div>
    </section>
  )
}
