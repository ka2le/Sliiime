export function BattleControls({
  encounter,
  summary,
  isRunning,
  tickMs,
  speedOptions,
  onToggleRunning,
  onSetTickMs,
  onStep,
  onRun,
  onResetBoard,
  onResetAll,
  onBringChallenger,
}) {
  return (
    <section className="panel controls-panel">
      <div>
        <div className="panel-title-row">
          <h2>Battle sandbox</h2>
          <span className="chip">{encounter.id}</span>
        </div>
        <p className="muted">{encounter.description}</p>
      </div>

      <div className="summary-row">
        <div>
          <span className="label">your mass</span>
          <strong>{summary.playerMass}</strong>
        </div>
        <div>
          <span className="label">enemy mass</span>
          <strong>{summary.enemyMass}</strong>
        </div>
        <div>
          <span className="label">territory</span>
          <strong>
            {summary.playerCells} / {summary.enemyCells}
          </strong>
        </div>
        <div>
          <span className="label">sim</span>
          <strong>{isRunning ? 'Running' : 'Paused'}</strong>
        </div>
      </div>

      <div className="button-row">
        <button type="button" onClick={onToggleRunning}>{isRunning ? 'Pause' : 'Play'}</button>
        <button type="button" onClick={onStep}>Step +1</button>
        <button type="button" onClick={onRun}>Run +12</button>
        <button type="button" onClick={onResetBoard}>Reset board</button>
        <button type="button" onClick={onBringChallenger}>Bring in challenger</button>
        <button type="button" className="ghost" onClick={onResetAll}>Reset everything</button>
      </div>

      <div className="speed-row">
        <span className="label">tick speed</span>
        <div className="speed-options">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              type="button"
              className={tickMs === speed ? 'small active-speed' : 'small ghost'}
              onClick={() => onSetTickMs(speed)}
            >
              {speed}ms
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
