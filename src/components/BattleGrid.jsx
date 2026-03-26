function getCellClass(cell) {
  if (cell.owner === 'player') return 'grid-cell player'
  if (cell.owner === 'enemy') return 'grid-cell enemy'
  return 'grid-cell empty'
}

export function BattleGrid({ state, mode }) {
  return (
    <section className="grid-panel">
      <div className="grid-wrap" role="img" aria-label="Simulation grid">
        {state.grid.flat().map((cell) => (
          <div key={`${cell.x}-${cell.y}`} className={getCellClass(cell)}>
            <div className="cell-coord">
              {cell.x},{cell.y}
            </div>
            {cell.owner ? (
              <>
                <div className="cell-mass">{cell.mass}</div>
                <div className="cell-action">{cell.lastAction ?? (mode === 'arena' ? 'hold' : 'preview')}</div>
              </>
            ) : (
              <div className="cell-empty-dot" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
