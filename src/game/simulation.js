const GRID_SIZE = 8
const PLAYER = 'player'
const ENEMY = 'enemy'

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => ({
      x,
      y,
      owner: null,
      mass: 0,
      lastAction: null,
    })),
  )
}

function cloneGrid(grid) {
  return grid.map((row) => row.map((cell) => ({ ...cell })))
}

function getNeighbors(x, y) {
  return [
    [x, y - 1],
    [x + 1, y],
    [x, y + 1],
    [x - 1, y],
  ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < GRID_SIZE && ny < GRID_SIZE)
}

function hasMutation(entity, mutationId) {
  return entity?.mutations?.includes(mutationId)
}

function getSupportCount(grid, x, y, owner) {
  return getNeighbors(x, y).reduce((count, [nx, ny]) => {
    return count + (grid[ny][nx].owner === owner ? 1 : 0)
  }, 0)
}

function getEntityPower(entity, kind) {
  const stats = entity.stats

  if (kind === 'grow') return 1 + Math.floor(stats.bloom / 3)
  if (kind === 'expand') return 1 + Math.floor(stats.drift / 3)
  if (kind === 'attack') return 1 + Math.floor(stats.rupture / 2)
  if (kind === 'defend') return 1 + Math.floor(stats.shell / 2)
  if (kind === 'support') return Math.floor(stats.synapse / 3)

  return 0
}

function scoreAction({ actor, entity, sourceCell, targetCell, grid }) {
  const support = getSupportCount(grid, sourceCell.x, sourceCell.y, actor)
  const sourceMass = sourceCell.mass

  if (!targetCell) {
    return sourceMass + getEntityPower(entity, 'grow') + support
  }

  if (!targetCell.owner) {
    let score = 4 + getEntityPower(entity, 'expand') + support
    if (hasMutation(entity, 'empty-lure')) score += 2
    if (hasMutation(entity, 'fractal-splitting') && sourceMass >= 5) score += 2
    return score
  }

  if (targetCell.owner === actor) {
    return sourceMass > targetCell.mass ? 2 + support : 1 + support
  }

  const enemyPressure = targetCell.mass + getSupportCount(grid, targetCell.x, targetCell.y, targetCell.owner)
  return 3 + getEntityPower(entity, 'attack') + support - enemyPressure / 2
}

function chooseBestTarget({ actor, entity, cell, grid }) {
  const candidates = [null, ...getNeighbors(cell.x, cell.y).map(([x, y]) => grid[y][x])]

  return candidates
    .map((targetCell) => ({
      targetCell,
      score: scoreAction({ actor, entity, sourceCell: cell, targetCell, grid }),
    }))
    .sort((a, b) => b.score - a.score)[0]?.targetCell ?? null
}

function applyGrowth(cell, entity) {
  let gain = getEntityPower(entity, 'grow')
  if (hasMutation(entity, 'rapid-mitosis')) gain += 1
  cell.mass = Math.min(9, cell.mass + gain)
  cell.lastAction = 'grow'
}

function applyFriendlyTransfer(sourceCell, targetCell) {
  if (sourceCell.mass <= 1) {
    sourceCell.lastAction = 'hold'
    return
  }

  sourceCell.mass -= 1
  targetCell.mass = Math.min(9, targetCell.mass + 1)
  sourceCell.lastAction = 'reinforce'
  targetCell.lastAction = 'receive'
}

function applyExpansion(sourceCell, targetCell, entity) {
  const movingMass = Math.max(1, Math.floor(sourceCell.mass / 2))
  const bonus = getEntityPower(entity, 'expand') - 1 + (hasMutation(entity, 'empty-lure') ? 1 : 0)
  sourceCell.mass = Math.max(1, sourceCell.mass - movingMass)
  targetCell.owner = sourceCell.owner
  targetCell.mass = Math.min(9, movingMass + bonus)
  sourceCell.lastAction = 'expand'
  targetCell.lastAction = 'spawn'
}

function applyAttack(sourceCell, targetCell, entity, grid) {
  const attack = sourceCell.mass + getEntityPower(entity, 'attack') + getSupportCount(grid, sourceCell.x, sourceCell.y, sourceCell.owner)
  const defenderEntity = targetCell.owner === PLAYER ? grid.meta.player : grid.meta.enemy
  const defense = targetCell.mass + getEntityPower(defenderEntity, 'defend') + getSupportCount(grid, targetCell.x, targetCell.y, targetCell.owner)
  const mitigation = hasMutation(defenderEntity, 'reinforced-membrane') ? 1 : 0
  const result = attack - defense + mitigation

  sourceCell.lastAction = 'attack'

  if (result > 0) {
    const retained = Math.min(9, Math.max(1, result + (hasMutation(entity, 'predator-spines') ? 1 : 0)))
    targetCell.owner = sourceCell.owner
    targetCell.mass = retained
    targetCell.lastAction = 'captured'
    sourceCell.mass = Math.max(1, sourceCell.mass - 1)
    return
  }

  targetCell.mass = Math.max(1, targetCell.mass - 1)
  sourceCell.mass = Math.max(1, sourceCell.mass - 1)
  targetCell.lastAction = 'hold'
}

function runSingleTick(previous) {
  const grid = cloneGrid(previous.grid)
  grid.meta = previous.grid.meta

  grid.forEach((row) => {
    row.forEach((cell) => {
      cell.lastAction = null
    })
  })

  const actors = []
  grid.forEach((row) => {
    row.forEach((cell) => {
      if (cell.owner) {
        actors.push(cell)
      }
    })
  })

  actors.sort((a, b) => a.owner.localeCompare(b.owner) || b.mass - a.mass)

  for (const cell of actors) {
    const liveCell = grid[cell.y][cell.x]
    if (!liveCell.owner || liveCell.mass <= 0) continue

    const entity = liveCell.owner === PLAYER ? previous.player : previous.enemy
    if (!entity) {
      applyGrowth(liveCell, previous.player)
      continue
    }

    const target = chooseBestTarget({
      actor: liveCell.owner,
      entity,
      cell: liveCell,
      grid,
    })

    if (!target) {
      applyGrowth(liveCell, entity)
      continue
    }

    if (!target.owner) {
      applyExpansion(liveCell, target, entity)
      continue
    }

    if (target.owner === liveCell.owner) {
      applyFriendlyTransfer(liveCell, target)
      continue
    }

    applyAttack(liveCell, target, entity, grid)
  }

  return {
    ...previous,
    grid,
    tick: previous.tick + 1,
  }
}

function seedGrid(grid, encounter, playerDraft) {
  grid[6][1] = { ...grid[6][1], owner: PLAYER, mass: 5 }
  grid[6][2] = { ...grid[6][2], owner: PLAYER, mass: 3 }

  if (!encounter.enemy) {
    return
  }

  const pattern = encounter.enemy.seedPattern
  if (pattern === 'corner-cluster') {
    grid[1][6] = { ...grid[1][6], owner: ENEMY, mass: 4 }
    grid[1][5] = { ...grid[1][5], owner: ENEMY, mass: 2 }
    return
  }

  if (pattern === 'center-mass') {
    grid[2][5] = { ...grid[2][5], owner: ENEMY, mass: 6 }
    grid[2][6] = { ...grid[2][6], owner: ENEMY, mass: 4 }
    return
  }

  if (pattern === 'diagonal-pair') {
    grid[1][6] = { ...grid[1][6], owner: ENEMY, mass: 4 }
    grid[2][5] = { ...grid[2][5], owner: ENEMY, mass: 4 }
  }
}

export function createSimulationState({ draft, encounter, tick }) {
  const player = {
    label: 'Your Strain',
    stats: draft.stats,
    mutations: draft.mutations,
  }

  const enemy = encounter.enemy
    ? {
        label: encounter.enemy.label,
        stats: encounter.enemy.stats,
        mutations: encounter.enemy.mutations,
      }
    : null

  const grid = createEmptyGrid()
  grid.meta = { player, enemy }
  seedGrid(grid, encounter, draft)

  let state = {
    tick: 0,
    grid,
    player,
    enemy,
  }

  for (let index = 0; index < tick; index += 1) {
    state = runSingleTick(state)
  }

  return state
}

export function advanceSimulation(state, steps = 1) {
  let next = state
  for (let index = 0; index < steps; index += 1) {
    next = runSingleTick(next)
  }
  return next
}

export function summarizeState(state) {
  const summary = {
    playerCells: 0,
    enemyCells: 0,
    playerMass: 0,
    enemyMass: 0,
  }

  state.grid.forEach((row) => {
    row.forEach((cell) => {
      if (cell.owner === PLAYER) {
        summary.playerCells += 1
        summary.playerMass += cell.mass
      }
      if (cell.owner === ENEMY) {
        summary.enemyCells += 1
        summary.enemyMass += cell.mass
      }
    })
  })

  if (!state.enemy) {
    summary.verdict = 'Sandbox growth'
  } else if (summary.enemyCells === 0) {
    summary.verdict = 'Player advantage'
  } else if (summary.playerCells === 0) {
    summary.verdict = 'Enemy advantage'
  } else if (summary.playerMass > summary.enemyMass) {
    summary.verdict = 'Player pressure'
  } else if (summary.playerMass < summary.enemyMass) {
    summary.verdict = 'Enemy pressure'
  } else {
    summary.verdict = 'Even pressure'
  }

  return summary
}
