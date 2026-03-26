const GRID_SIZE = 8
const MAX_MASS = 9
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

function getEntityPower(entity, kind) {
  const stats = entity.stats

  if (kind === 'grow') return 1 + Math.floor(stats.bloom / 3)
  if (kind === 'expand') return 1 + Math.floor(stats.drift / 3)
  if (kind === 'attack') return 1 + Math.floor(stats.rupture / 2)
  if (kind === 'defend') return 1 + Math.floor(stats.shell / 2)
  if (kind === 'support') return Math.floor(stats.synapse / 3)

  return 0
}

function getSupportCount(grid, x, y, owner, entity) {
  const base = getNeighbors(x, y).reduce((count, [nx, ny]) => {
    return count + (grid[ny][nx].owner === owner ? 1 : 0)
  }, 0)

  if (hasMutation(entity, 'linked-nodes')) {
    return base + 1
  }

  return base
}

function getEntityByOwner(state, owner) {
  return owner === PLAYER ? state.player : state.enemy
}

function scoreGrowth(cell, entity, grid) {
  const support = getSupportCount(grid, cell.x, cell.y, cell.owner, entity)
  return 1 + getEntityPower(entity, 'grow') + support - cell.mass * 0.2
}

function scoreExpansion(cell, targetCell, entity, grid) {
  if (cell.mass <= 1) return -999

  const support = getSupportCount(grid, cell.x, cell.y, cell.owner, entity)
  let score = 4 + getEntityPower(entity, 'expand') + support

  if (hasMutation(entity, 'empty-lure')) score += 2
  if (hasMutation(entity, 'fractal-splitting') && cell.mass >= 5) score += 2

  const frontierBonus = getNeighbors(targetCell.x, targetCell.y).some(([nx, ny]) => grid[ny][nx].owner && grid[ny][nx].owner !== cell.owner)
  if (frontierBonus) score += 1.5

  return score
}

function scoreFriendlyTransfer(cell, targetCell, entity, grid) {
  if (cell.mass <= 1 || targetCell.mass >= cell.mass) return -999

  const support = getSupportCount(grid, targetCell.x, targetCell.y, cell.owner, entity)
  return 1 + support + (cell.mass - targetCell.mass)
}

function scoreAttack(cell, targetCell, entity, defenderEntity, grid) {
  if (cell.mass <= 1) return -999

  const support = getSupportCount(grid, cell.x, cell.y, cell.owner, entity)
  const defenseSupport = getSupportCount(grid, targetCell.x, targetCell.y, targetCell.owner, defenderEntity)
  const attackMass = Math.max(1, cell.mass - 1)
  const attackForce = attackMass * 2 + getEntityPower(entity, 'attack') + support
  const defenseForce = targetCell.mass + getEntityPower(defenderEntity, 'defend') + defenseSupport

  return 5 + attackForce - defenseForce
}

function chooseAction(state, cell) {
  const entity = getEntityByOwner(state, cell.owner)
  const grid = state.grid
  const actions = [{ type: 'grow', score: scoreGrowth(cell, entity, grid) }]

  for (const [x, y] of getNeighbors(cell.x, cell.y)) {
    const targetCell = grid[y][x]

    if (!targetCell.owner) {
      actions.push({
        type: 'expand',
        target: { x, y },
        score: scoreExpansion(cell, targetCell, entity, grid),
      })
      continue
    }

    if (targetCell.owner === cell.owner) {
      actions.push({
        type: 'reinforce',
        target: { x, y },
        score: scoreFriendlyTransfer(cell, targetCell, entity, grid),
      })
      continue
    }

    const defenderEntity = getEntityByOwner(state, targetCell.owner)
    actions.push({
      type: 'attack',
      target: { x, y },
      score: scoreAttack(cell, targetCell, entity, defenderEntity, grid),
    })
  }

  actions.sort((a, b) => b.score - a.score)
  return actions[0]
}

function applyGrowth(cell, entity) {
  let gain = getEntityPower(entity, 'grow')
  if (hasMutation(entity, 'rapid-mitosis')) gain += 1
  cell.mass = Math.min(MAX_MASS, cell.mass + gain)
  cell.lastAction = 'grow'
}

function applyFriendlyTransfer(sourceCell, targetCell) {
  if (sourceCell.mass <= 1) {
    sourceCell.lastAction = 'hold'
    return
  }

  sourceCell.mass -= 1
  targetCell.mass = Math.min(MAX_MASS, targetCell.mass + 1)
  sourceCell.lastAction = 'reinforce'
  targetCell.lastAction = 'receive'
}

function applyExpansion(sourceCell, targetCell, entity) {
  const expandPower = getEntityPower(entity, 'expand') + (hasMutation(entity, 'empty-lure') ? 1 : 0)
  const createdMass = Math.max(1, Math.floor(expandPower / 2))

  if (sourceCell.mass <= createdMass) {
    sourceCell.lastAction = 'hold'
    return
  }

  sourceCell.mass -= createdMass
  targetCell.owner = sourceCell.owner
  targetCell.mass = Math.min(MAX_MASS, createdMass)
  sourceCell.lastAction = 'expand'
  targetCell.lastAction = 'spawn'
}

function applyAttack(state, sourceCell, targetCell) {
  const attacker = getEntityByOwner(state, sourceCell.owner)
  const defender = getEntityByOwner(state, targetCell.owner)

  if (!attacker || !defender || sourceCell.mass <= 1) {
    sourceCell.lastAction = 'hold'
    return
  }

  const attackSupport = getSupportCount(state.grid, sourceCell.x, sourceCell.y, sourceCell.owner, attacker)
  const defenseSupport = getSupportCount(state.grid, targetCell.x, targetCell.y, targetCell.owner, defender)
  const attackingMass = Math.max(1, sourceCell.mass - 1)
  const attackForce = attackingMass * 2 + getEntityPower(attacker, 'attack') + attackSupport
  let defenseForce = targetCell.mass + getEntityPower(defender, 'defend') + defenseSupport

  if (hasMutation(defender, 'reinforced-membrane')) {
    defenseForce += 1
  }

  sourceCell.mass = Math.max(1, sourceCell.mass - attackingMass)
  sourceCell.lastAction = 'attack'

  if (attackForce > defenseForce) {
    let remaining = attackForce - defenseForce
    if (hasMutation(attacker, 'predator-spines')) {
      remaining += 1
    }

    targetCell.owner = sourceCell.owner
    targetCell.mass = Math.min(MAX_MASS, Math.max(1, remaining))
    targetCell.lastAction = 'captured'
    return
  }

  const remainingDefense = Math.max(1, defenseForce - attackForce)
  targetCell.mass = Math.min(MAX_MASS, remainingDefense)
  targetCell.lastAction = 'defend'
}

function runSingleTick(previous) {
  const grid = cloneGrid(previous.grid)

  const state = {
    ...previous,
    grid,
  }

  grid.forEach((row) => {
    row.forEach((cell) => {
      cell.lastAction = null
    })
  })

  const actors = []
  grid.forEach((row) => {
    row.forEach((cell) => {
      if (cell.owner && cell.mass > 0) {
        actors.push({ x: cell.x, y: cell.y, owner: cell.owner, mass: cell.mass })
      }
    })
  })

  actors.sort((a, b) => b.mass - a.mass)

  for (const actor of actors) {
    const liveCell = grid[actor.y][actor.x]
    if (!liveCell.owner || liveCell.mass <= 0) continue

    const action = chooseAction(state, liveCell)

    if (action.type === 'grow') {
      applyGrowth(liveCell, getEntityByOwner(state, liveCell.owner))
      continue
    }

    const targetCell = grid[action.target.y][action.target.x]

    if (action.type === 'expand') {
      applyExpansion(liveCell, targetCell, getEntityByOwner(state, liveCell.owner))
      continue
    }

    if (action.type === 'reinforce') {
      applyFriendlyTransfer(liveCell, targetCell)
      continue
    }

    if (action.type === 'attack') {
      applyAttack(state, liveCell, targetCell)
    }
  }

  return {
    ...state,
    tick: previous.tick + 1,
  }
}

function seedGrid(grid, encounter) {
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
  seedGrid(grid, encounter)

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

export function summarizeState(state) {
  const summary = {
    playerCells: 0,
    enemyCells: 0,
    playerMass: 0,
    enemyMass: 0,
    finished: false,
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
    summary.verdict = 'Player victory'
    summary.finished = true
  } else if (summary.playerCells === 0) {
    summary.verdict = 'Enemy victory'
    summary.finished = true
  } else if (summary.playerMass > summary.enemyMass) {
    summary.verdict = 'Player pressure'
  } else if (summary.playerMass < summary.enemyMass) {
    summary.verdict = 'Enemy pressure'
  } else {
    summary.verdict = 'Even pressure'
  }

  return summary
}
