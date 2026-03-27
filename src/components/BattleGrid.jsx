function getDirectionClass(cell) {
  if (!cell.oozeDir) return ''
  return ` ooze-${cell.oozeDir}`
}

function getCellClass(cell) {
  const ownerClass = cell.owner === 'player' ? 'player' : cell.owner === 'enemy' ? 'enemy' : cell.owner === 'neutral' ? 'neutral' : 'empty'
  const terrainClass = cell.terrain ? ` terrain-${cell.terrain}` : ''
  const pulseClass = cell.pulse ? ` pulse-${cell.pulse}` : ''
  const capClass = cell.capped ? ' capped' : ''
  const contestedClass = cell.contested ? ' contested' : ''
  const oozeClass = cell.oozeFrom ? ' oozing' : ''
  return `grid-cell ${ownerClass}${terrainClass}${pulseClass}${capClass}${contestedClass}${oozeClass}${getDirectionClass(cell)}`
}

function getDeltaClass(delta) {
  if (!delta) return ''
  const ownerClass = delta.owner === 'player' ? 'ally' : delta.owner === 'enemy' ? 'enemy' : 'neutral'
  const dirClass = delta.dir ? ` drift-${delta.dir}` : ''
  const jitterClass = typeof delta.jitter === 'number' ? ` jitter-${delta.jitter}` : ''
  return `cell-delta ${delta.kind} ${ownerClass}${dirClass}${jitterClass}`
}

export function BattleGrid({ state }) {
  return (
    <section className="grid-panel">
      <div className="grid-wrap" role="img" aria-label="Slime battle grid">
        {state.grid.flat().map((cell) => (
          <div key={`${cell.x}-${cell.y}`} className={getCellClass(cell)}>
            {cell.owner ? (
              <>
                <div className="cell-mass">{cell.mass}</div>
                {cell.delta ? <div className={getDeltaClass(cell.delta)}>{cell.delta.text}</div> : null}
                {cell.lastAction === 'capture' || cell.pulse === 'attack' ? <div className="cell-spark" /> : null}
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
