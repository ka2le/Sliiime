import { BATTLE_TICK_LIMIT } from './run'

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
      holdTicks: 0,
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

function hasNode(entity, nodeId) {
  return entity?.nodes?.includes(nodeId) || entity?.mutations?.includes(nodeId)
}

function getEntityPower(entity, kind) {
  const stats = entity.stats

  if (kind === 'grow') return 1 + Math.floor(stats.bloom / 4)
  if (kind === 'expand') return 1 + Math.floor(stats.drift / 4)
  if (kind === 'attack') return Math.floor(stats.rupture / 2)
  if (kind === 'defend') return Math.floor(stats.shell / 2)
  if (kind === 'supportMultiplier') return 1 + Math.floor(stats.synapse / 5)

  return 0
}

function getEntityByOwner(state, owner) {
  return owner === PLAYER ? state.player : state.enemy
}

function getSupportBonus(grid, x, y, owner, entity) {
  const count = getNeighbors(x, y).reduce((sum, [nx, ny]) => sum + (grid[ny][nx].owner === owner ? 1 : 0), 0)
  const mult = getEntityPower(entity, 'supportMultiplier')
  let bonus = count * mult

  if (hasNode(entity, 'linked-nodes')) bonus += count

  return bonus
}

function isHomeSide(owner, y) {
  return owner === PLAYER ? y >= 5 : y <= 2
}

function getGrowthGain(cell, entity) {
  let gain = getEntityPower(entity, 'grow')
  if (hasNode(entity, 'soft-division')) gain += 1
  return gain
}

function scoreGrowth(cell, entity, grid) {
  let score = 2 + getGrowthGain(cell, entity) - cell.mass * 0.15
  const support = getSupportBonus(grid, cell.x, cell.y, cell.owner, entity)
  score += support * 0.2
  if (cell.mass >= 8 && hasNode(entity, 'overflow-bloom')) score += 2
  return score
}

function scoreExpansion(cell, targetCell, entity, grid) {
  if (cell.mass <= 1) return -999

  const support = getSupportBonus(grid, cell.x, cell.y, cell.owner, entity)
  let score = 4 + getEntityPower(entity, 'expand') + support * 0.3

  const nearEnemy = getNeighbors(targetCell.x, targetCell.y).some(([nx, ny]) => grid[ny][nx].owner && grid[ny][nx].owner !== cell.owner)
  if (nearEnemy) score += 1.5
  if (hasNode(entity, 'frontier-sense')) score += 1.5
  if (hasNode(entity, 'phase-surge') && entity.stats.drift >= 6) score += 1
  if (hasNode(entity, 'encircle-instinct') && nearEnemy) score += 2

  return score
}

function scoreFriendlyTransfer(cell, targetCell, entity, grid) {
  if (cell.mass <= 1 || targetCell.mass >= cell.mass) return -999
  return 1 + getSupportBonus(grid, targetCell.x, targetCell.y, cell.owner, entity) * 0.4 + (cell.mass - targetCell.mass)
}

function scoreAttack(cell, targetCell, entity, defenderEntity, grid) {
  if (cell.mass <= 1) return -999

  const attackSupport = getSupportBonus(grid, cell.x, cell.y, cell.owner, entity)
  const defenseSupport = getSupportBonus(grid, targetCell.x, targetCell.y, targetCell.owner, defenderEntity)
  const committedMass = Math.max(1, cell.mass - 1)
  let attackForce = committedMass * 2 + getEntityPower(entity, 'attack') + attackSupport
  let defenseForce = targetCell.mass + getEntityPower(defenderEntity, 'defend') + defenseSupport

  if (hasNode(entity, 'weakpoint-probe')) {
    const enemyNeighbors = getNeighbors(targetCell.x, targetCell.y).reduce((sum, [nx, ny]) => sum + (grid[ny][nx].owner === targetCell.owner ? 1 : 0), 0)
    if (enemyNeighbors <= 1) attackForce += 2
  }

  return 6 + attackForce - defenseForce
}

function chooseAction(state, cell) {
  const entity = getEntityByOwner(state, cell.owner)
  const grid = state.grid
  const actions = [{ type: 'grow', score: scoreGrowth(cell, entity, grid) }]

  for (const [x, y] of getNeighbors(cell.x, cell.y)) {
    const targetCell = grid[y][x]

    if (!targetCell.owner) {
      actions.push({ type: 'expand', target: { x, y }, score: scoreExpansion(cell, targetCell, entity, grid) })
    } else if (targetCell.owner === cell.owner) {
      actions.push({ type: 'reinforce', target: { x, y }, score: scoreFriendlyTransfer(cell, targetCell, entity, grid) })
    } else {
      actions.push({
        type: 'attack',
        target: { x, y },
        score: scoreAttack(cell, targetCell, entity, getEntityByOwner(state, targetCell.owner), grid),
      })
    }
  }

  actions.sort((a, b) => b.score - a.score)
  return actions[0]
}

function applyOverflowBloom(grid, cell, entity) {
  if (!hasNode(entity, 'overflow-bloom')) return
  if (cell.mass < MAX_MASS) return

  const allies = getNeighbors(cell.x, cell.y)
    .map(([x, y]) => grid[y][x])
    .filter((neighbor) => neighbor.owner === cell.owner && neighbor.mass < MAX_MASS)
    .sort((a, b) => a.mass - b.mass)

  if (allies[0]) {
    allies[0].mass += 1
    allies[0].lastAction = 'fed'
  }
}

function applyGrowth(grid, cell, entity) {
  cell.mass = Math.min(MAX_MASS, cell.mass + getGrowthGain(cell, entity))
  cell.lastAction = 'grow'
  applyOverflowBloom(grid, cell, entity)
}

function applyFriendlyTransfer(sourceCell, targetCell) {
  sourceCell.mass -= 1
  targetCell.mass = Math.min(MAX_MASS, targetCell.mass + 1)
  sourceCell.lastAction = 'reinforce'
  targetCell.lastAction = 'receive'
}

function getExpansionCost(sourceCell, entity) {
  let cost = 1 + Math.floor(getEntityPower(entity, 'expand') / 2)
  if (hasNode(entity, 'slide-membrane') && sourceCell.mass <= 4) cost -= 1
  if (hasNode(entity, 'nutrient-hold') && sourceCell.mass >= 6) cost -= 1
  return Math.max(1, cost)
}

function getSpawnMass(sourceCell, entity, nearEnemy) {
  let mass = 1 + Math.floor(entity.stats.drift / 4)
  if (hasNode(entity, 'empty-lure') && nearEnemy) mass += 1
  if (hasNode(entity, 'fractal-splitting') && sourceCell.mass >= 6) mass += 1
  if (hasNode(entity, 'fresh-spawn')) mass += 1
  if (hasNode(entity, 'encircle-instinct') && nearEnemy) mass += 1
  return Math.min(MAX_MASS, mass)
}

function applyExpansion(grid, sourceCell, targetCell, entity) {
  const nearEnemy = getNeighbors(targetCell.x, targetCell.y).some(([nx, ny]) => grid[ny][nx].owner && grid[ny][nx].owner !== sourceCell.owner)
  const cost = getExpansionCost(sourceCell, entity)
  const spawnMass = getSpawnMass(sourceCell, entity, nearEnemy)

  if (sourceCell.mass - cost < 1) {
    sourceCell.lastAction = 'hold'
    return
  }

  sourceCell.mass -= cost
  targetCell.owner = sourceCell.owner
  targetCell.mass = Math.min(MAX_MASS, spawnMass)
  targetCell.holdTicks = 0
  sourceCell.lastAction = 'expand'
  targetCell.lastAction = 'spawn'
}

function applyBreaklinePulse(grid, targetCell, newOwner) {
  for (const [nx, ny] of getNeighbors(targetCell.x, targetCell.y)) {
    const neighbor = grid[ny][nx]
    if (neighbor.owner && neighbor.owner !== newOwner) {
      neighbor.mass = Math.max(1, neighbor.mass - 1)
      neighbor.lastAction = 'pulse'
    }
  }
}

function applyAttack(state, sourceCell, targetCell) {
  const attacker = getEntityByOwner(state, sourceCell.owner)
  const defender = getEntityByOwner(state, targetCell.owner)
  const attackSupport = getSupportBonus(state.grid, sourceCell.x, sourceCell.y, sourceCell.owner, attacker)
  const defenseSupport = getSupportBonus(state.grid, targetCell.x, targetCell.y, targetCell.owner, defender)
  const committedMass = Math.max(1, sourceCell.mass - 1)

  let attackForce = committedMass * 2 + getEntityPower(attacker, 'attack') + attackSupport
  let defenseForce = targetCell.mass + getEntityPower(defender, 'defend') + defenseSupport

  if (hasNode(attacker, 'weakpoint-probe')) {
    const enemyNeighbors = getNeighbors(targetCell.x, targetCell.y).reduce((sum, [nx, ny]) => sum + (state.grid[ny][nx].owner === targetCell.owner ? 1 : 0), 0)
    if (enemyNeighbors <= 1) attackForce += 2
  }

  if (hasNode(attacker, 'piercing-lash') && sourceCell.mass >= 6) attackForce += 2
  if (hasNode(defender, 'reinforced-membrane')) defenseForce += 1
  if (hasNode(defender, 'braced-core') && isHomeSide(targetCell.owner, targetCell.y)) defenseForce += 2
  if (hasNode(defender, 'static-carapace')) defenseForce += Math.min(3, targetCell.holdTicks)

  sourceCell.mass = Math.max(1, sourceCell.mass - committedMass)
  sourceCell.lastAction = 'attack'

  if (attackForce > defenseForce) {
    let remaining = attackForce - defenseForce
    if (hasNode(attacker, 'predator-spines')) remaining += 1
    if (hasNode(attacker, 'cascade-kill')) remaining += 1

    targetCell.owner = sourceCell.owner
    targetCell.mass = Math.min(MAX_MASS, Math.max(1, remaining))
    targetCell.holdTicks = 0
    targetCell.lastAction = 'captured'

    if (hasNode(attacker, 'breakline-pulse')) {
      applyBreaklinePulse(state.grid, targetCell, sourceCell.owner)
    }
    return
  }

  const retained = Math.max(1, defenseForce - attackForce)
  targetCell.mass = Math.min(MAX_MASS, retained + (hasNode(defender, 'elastic-wall') ? 1 : 0))
  targetCell.lastAction = 'defend'
}

function runSingleTick(previous) {
  const grid = cloneGrid(previous.grid)
  const state = { ...previous, grid }

  grid.forEach((row) => {
    row.forEach((cell) => {
      cell.lastAction = null
      cell.holdTicks = cell.owner ? cell.holdTicks + 1 : 0
    })
  })

  const actors = []
  grid.forEach((row) => {
    row.forEach((cell) => {
      if (cell.owner && cell.mass > 0) actors.push({ x: cell.x, y: cell.y, mass: cell.mass })
    })
  })

  actors.sort((a, b) => b.mass - a.mass)

  for (const actor of actors) {
    const liveCell = grid[actor.y][actor.x]
    if (!liveCell.owner || liveCell.mass <= 0) continue

    const action = chooseAction(state, liveCell)

    if (action.type === 'grow') {
      applyGrowth(grid, liveCell, getEntityByOwner(state, liveCell.owner))
      continue
    }

    const targetCell = grid[action.target.y][action.target.x]
    if (action.type === 'expand') {
      applyExpansion(grid, liveCell, targetCell, getEntityByOwner(state, liveCell.owner))
      continue
    }

    if (action.type === 'reinforce') {
      applyFriendlyTransfer(liveCell, targetCell)
      continue
    }

    applyAttack(state, liveCell, targetCell)
  }

  return { ...state, tick: previous.tick + 1 }
}

function seedGrid(grid, encounter) {
  grid[6][1] = { ...grid[6][1], owner: PLAYER, mass: 5 }
  grid[6][2] = { ...grid[6][2], owner: PLAYER, mass: 3 }

  if (!encounter.enemy) return

  const pattern = encounter.enemy.seedPattern
  if (pattern === 'corner-cluster') {
    grid[1][6] = { ...grid[1][6], owner: ENEMY, mass: 4 }
    grid[1][5] = { ...grid[1][5], owner: ENEMY, mass: 2 }
  } else if (pattern === 'center-mass') {
    grid[2][5] = { ...grid[2][5], owner: ENEMY, mass: 6 }
    grid[2][6] = { ...grid[2][6], owner: ENEMY, mass: 4 }
  } else if (pattern === 'diagonal-pair') {
    grid[1][6] = { ...grid[1][6], owner: ENEMY, mass: 4 }
    grid[2][5] = { ...grid[2][5], owner: ENEMY, mass: 4 }
  } else if (pattern === 'double-wall') {
    grid[1][5] = { ...grid[1][5], owner: ENEMY, mass: 4 }
    grid[1][6] = { ...grid[1][6], owner: ENEMY, mass: 4 }
    grid[2][5] = { ...grid[2][5], owner: ENEMY, mass: 3 }
    grid[2][6] = { ...grid[2][6], owner: ENEMY, mass: 3 }
  }
}

export function createSimulationState({ draft, encounter, tick }) {
  const player = { label: 'Your Strain', stats: draft.stats, nodes: draft.nodes }
  const enemy = encounter.enemy ? { label: encounter.enemy.label, stats: encounter.enemy.stats, nodes: encounter.enemy.mutations } : null

  const grid = createEmptyGrid()
  seedGrid(grid, encounter)

  let state = { tick: 0, grid, player, enemy, encounter }
  for (let index = 0; index < tick; index += 1) state = runSingleTick(state)
  return state
}

export function summarizeState(state) {
  const summary = {
    playerCells: 0,
    enemyCells: 0,
    playerMass: 0,
    enemyMass: 0,
    finished: false,
    timeout: false,
    winner: null,
    maxTicks: BATTLE_TICK_LIMIT,
  }

  state.grid.forEach((row) => {
    row.forEach((cell) => {
      if (cell.owner === PLAYER) {
        summary.playerCells += 1
        summary.playerMass += cell.mass
      } else if (cell.owner === ENEMY) {
        summary.enemyCells += 1
        summary.enemyMass += cell.mass
      }
    })
  })

  const playerScore = summary.playerCells * 2 + summary.playerMass
  const enemyScore = summary.enemyCells * 2 + summary.enemyMass
  summary.playerScore = playerScore
  summary.enemyScore = enemyScore

  if (!state.enemy) {
    summary.verdict = 'Workshop preview'
    return summary
  }

  if (summary.enemyCells === 0) {
    summary.verdict = 'Player victory'
    summary.finished = true
    summary.winner = PLAYER
    return summary
  }

  if (summary.playerCells === 0) {
    summary.verdict = 'Enemy victory'
    summary.finished = true
    summary.winner = ENEMY
    return summary
  }

  if (state.tick >= BATTLE_TICK_LIMIT) {
    summary.finished = true
    summary.timeout = true
    summary.winner = playerScore > enemyScore ? PLAYER : ENEMY
    summary.verdict = summary.winner === PLAYER ? 'Player wins on control' : 'Enemy wins on control'
    return summary
  }

  if (playerScore > enemyScore) summary.verdict = 'Player pressure'
  else if (playerScore < enemyScore) summary.verdict = 'Enemy pressure'
  else summary.verdict = 'Even pressure'

  return summary
}
