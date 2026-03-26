export function BattleControls({
  summary,
  isRunning,
  tickMs,
  speedOptions,
  onToggleRunning,
  onSetTickMs,
  onStep,
  onResetBattle,
  onClaimBattle,
}) {
  return (
    <section className="stage-actions">
      <div className="run-summary-strip arena-strip">
        <div>
          <span className="label">your score</span>
          <strong>{summary.playerScore}</strong>
        </div>
        <div>
          <span className="label">enemy score</span>
          <strong>{summary.enemyScore}</strong>
        </div>
        <div>
          <span className="label">sim</span>
          <strong>{summary.finished ? 'done' : isRunning ? 'running' : 'paused'}</strong>
        </div>
      </div>

      <div className="button-row centered">
        {!summary.finished ? <button type="button" onClick={onToggleRunning}>{isRunning ? 'Pause' : 'Play'}</button> : null}
        {!summary.finished ? <button type="button" onClick={onStep}>Step</button> : null}
        <button type="button" className="ghost" onClick={onResetBattle}>Restart battle</button>
        {summary.finished ? <button type="button" onClick={onClaimBattle}>Resolve battle</button> : null}
      </div>

      <div className="speed-row centered-speed">
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
