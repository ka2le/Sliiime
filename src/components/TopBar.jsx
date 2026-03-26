export function TopBar({ mode, run, encounter, summary, remainingStatPoints, remainingGenomePoints }) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">Sliiime</div>
        <h1>{mode === 'arena' ? 'Arena test' : 'Workshop'}</h1>
        <p className="subtitle">
          {mode === 'arena'
            ? `Facing ${encounter.name} on battle ${Math.min(run.battleIndex + 1, 6)}.`
            : 'Tune your strain, buy nodes, then throw it into the basin.'}
        </p>
      </div>

      <div className="topbar-stats">
        <div className="topbar-card">
          <span className="label">level</span>
          <strong>{run.level}</strong>
        </div>
        <div className="topbar-card">
          <span className="label">stat pts</span>
          <strong>{remainingStatPoints}</strong>
        </div>
        <div className="topbar-card">
          <span className="label">genome pts</span>
          <strong>{remainingGenomePoints}</strong>
        </div>
        <div className="topbar-card wide">
          <span className="label">pressure</span>
          <strong>{summary.verdict}</strong>
        </div>
      </div>
    </header>
  )
}
