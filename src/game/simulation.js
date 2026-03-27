import { BATTLE_TICK_LIMIT } from './run'
import { getNodeRank, hasNode } from './tree'
import balance from './GameBalance.json'

const GRID_SIZE = balance.gridSize
const PLAYER = 'player'
const ENEMY = 'enemy'
const NEUTRAL = 'neutral'
const SHIELD_CAP_BASE = balance.baseShield
const CELL_CAP_BASE = balance.baseCellCap
const SPREAD_COST = balance.spreadCost
const SPREAD_SPAWN = balance.spreadSpawn
const ATTACK_COST = balance.attackCost

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => ({
      x,
      y,
      owner: null,
      mass: 0,
      shield: 0,
      terrain: null,
      delta: null,
      lastAction: null,
      pulse: null,
      capped: false,
      contested: false,
      oozeFrom: null,
      oozeDir: null,
      attackedThisTick: 0,
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

function getLeapNeighbors(x, y) {
  return [
    [x, y - 2],
    [x + 2, y],
    [x, y + 2],
    [x - 2, y],
  ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < GRID_SIZE && ny < GRID_SIZE)
}

function getDirection(fromX, fromY, toX, toY) {
  if (toX > fromX) return 'right'
  if (toX < fromX) return 'left'
  if (toY > fromY) return 'down'
  if (toY < fromY) return 'up'
  return null
}

function getCellCap(entity) {
  return CELL_CAP_BASE + (hasNode(entity.nodes, 'cell-cap') ? 10 : 0)
}

function getShieldCap(entity) {
  return SHIELD_CAP_BASE + (hasNode(entity.nodes, 'shield-pool') ? 3 : 0)
}

function getAttackStat(entity) {
  const boostRank = getNodeRank(entity.nodes, 'attack-boost')
  return entity.stats.attack * (1 + boostRank * 0.2)
}

function getGrowthStat(entity) {
  const boostRank = getNodeRank(entity.nodes, 'growth-boost')
  return entity.stats.growth * (1 + boostRank * 0.2)
}

function getDefenseRank(entity) {
  return getNodeRank(entity.nodes, 'defense-boost')
}

function getGrowthGain(cell, entity) {
  const statGrowth = getGrowthStat(entity)
  return Math.max(1, Math.floor(balance.growth.base + statGrowth + cell.mass * (balance.growth.massFactor + statGrowth * balance.growth.statFactor)))
}

function getSpreadBias(entity) {
  const base = entity.stats.spreadBias / 100
  return hasNode(entity.nodes, 'aggressive-spreader') ? Math.min(1, base + balance.ai.aggressiveSpreaderBiasBonus) : base
}

function clearCellFlags(grid) {
  grid.forEach((row) => row.forEach((cell) => {
    cell.delta = null
    cell.lastAction = null
    cell.pulse = null
    cell.capped = false
    cell.contested = false
    cell.oozeFrom = null
    cell.oozeDir = null
    cell.attackedThisTick = 0
  }))
}

function applyTerrain(grid, terrain) {
  if (!terrain?.cells) return
  terrain.cells.forEach(([x, y]) => {
    grid[y][x] = {
      ...grid[y][x],
      owner: NEUTRAL,
      terrain: terrain.kind,
      mass: balance.terrainMass[terrain.kind] ?? 10,
      shield: 0,
    }
  })
}

function seedGrid(grid, encounter) {
  balance.playerStartCells.forEach(({ x, y, mass, shield }) => {
    grid[y][x] = { ...grid[y][x], owner: PLAYER, mass, shield }
  })
  applyTerrain(grid, encounter.terrain)

  if (!encounter.enemy) return

  const pattern = encounter.enemy.seedPattern
  if (pattern === 'tiny-cluster') {
    const [m1] = balance.enemySeedMass.tinyCluster
    grid[1][5] = { ...grid[1][5], owner: ENEMY, mass: m1, shield: SHIELD_CAP_BASE }
  } else if (pattern === 'diagonal-pair') {
    const [m1, m2] = balance.enemySeedMass.diagonalPair
    grid[1][5] = { ...grid[1][5], owner: ENEMY, mass: m1, shield: SHIELD_CAP_BASE }
    grid[2][4] = { ...grid[2][4], owner: ENEMY, mass: m2, shield: SHIELD_CAP_BASE }
  } else if (pattern === 'heavy-core') {
    const [m1, m2] = balance.enemySeedMass.heavyCore
    grid[1][4] = { ...grid[1][4], owner: ENEMY, mass: m1, shield: SHIELD_CAP_BASE }
    grid[1][5] = { ...grid[1][5], owner: ENEMY, mass: m2, shield: SHIELD_CAP_BASE }
  } else if (pattern === 'wide-line') {
    const [m1, m2, m3] = balance.enemySeedMass.wideLine
    grid[1][4] = { ...grid[1][4], owner: ENEMY, mass: m1, shield: SHIELD_CAP_BASE }
    grid[1][5] = { ...grid[1][5], owner: ENEMY, mass: m2, shield: SHIELD_CAP_BASE }
    grid[2][5] = { ...grid[2][5], owner: ENEMY, mass: m3, shield: SHIELD_CAP_BASE }
  } else if (pattern === 'double-line') {
    const [m1, m2, m3, m4] = balance.enemySeedMass.doubleLine
    grid[1][4] = { ...grid[1][4], owner: ENEMY, mass: m1, shield: SHIELD_CAP_BASE }
    grid[1][5] = { ...grid[1][5], owner: ENEMY, mass: m2, shield: SHIELD_CAP_BASE }
    grid[2][4] = { ...grid[2][4], owner: ENEMY, mass: m3, shield: SHIELD_CAP_BASE }
    grid[2][5] = { ...grid[2][5], owner: ENEMY, mass: m4, shield: SHIELD_CAP_BASE }
  }
}

function countOpenNeighbors(grid, cell) {
  return getNeighbors(cell.x, cell.y).reduce((sum, [nx, ny]) => sum + (grid[ny][nx].owner ? 0 : 1), 0)
}

function countEnemyNeighbors(grid, cell) {
  return getNeighbors(cell.x, cell.y).reduce((sum, [nx, ny]) => {
    const owner = grid[ny][nx].owner
    return sum + (owner && owner !== cell.owner && owner !== NEUTRAL ? 1 : 0)
  }, 0)
}

function scoreGrow(cell, entity, grid) {
  const cap = getCellCap(entity)
  const spreadBias = getSpreadBias(entity)
  const openNeighbors = countOpenNeighbors(grid, cell)
  const enemyNeighbors = countEnemyNeighbors(grid, cell)
  let score = (1 - spreadBias) * balance.ai.growBaseWeight + cell.mass * balance.ai.growMassWeight + (cap - cell.mass) * balance.ai.growCapRoomWeight

  if (cell.mass >= cap) score -= balance.ai.growNearCapPenalty
  if (cell.mass >= 6 && openNeighbors > 0) score += balance.ai.growOpenNeighborBonusAt6
  if (cell.mass >= 12 && openNeighbors > 0) score += balance.ai.growOpenNeighborBonusAt12
  if (enemyNeighbors > 0 && cell.mass < 12) score -= balance.ai.growEnemyNearbyLowMassPenalty

  return score
}

function scoreSpread(sourceCell, targetCell, entity, isLeap = false) {
  if (sourceCell.mass < SPREAD_COST + SPREAD_SPAWN) return -999

  const spreadBias = getSpreadBias(entity)
  let score = spreadBias * balance.ai.spreadBaseWeight + sourceCell.mass * balance.ai.spreadMassWeight

  if (!targetCell.owner) score += balance.ai.spreadEmptyBonus
  if (targetCell.owner === sourceCell.owner) score -= balance.ai.spreadFriendlyPenalty
  if (targetCell.owner === NEUTRAL) score -= balance.ai.spreadNeutralPenalty
  if (sourceCell.mass < 10) score -= balance.ai.spreadLowMassPenalty
  if (isLeap) score += balance.ai.spreadLeapBonus

  return score
}

function scoreAttack(sourceCell, targetCell, entity) {
  if (sourceCell.mass <= ATTACK_COST) return -999

  let score = balance.ai.attackBaseWeight + getAttackStat(entity) * balance.ai.attackStatWeight + sourceCell.mass * balance.ai.attackMassWeight
  if (sourceCell.mass < 12) score -= balance.ai.attackLowMassPenaltyBelow12
  if (sourceCell.mass < 18) score -= balance.ai.attackLowMassPenaltyBelow18
  if (targetCell.owner === NEUTRAL) score -= balance.ai.attackNeutralPenalty
  if (targetCell.owner && targetCell.owner !== sourceCell.owner) score += balance.ai.attackEnemyBonus
  if (targetCell.shield > 0) score += hasNode(entity.nodes, 'shield-breaker') ? balance.ai.attackShieldBreakerBonus : -balance.ai.attackShieldPenalty
  return score
}

function chooseAction(state, cell) {
  const entity = cell.owner === PLAYER ? state.player : state.enemy
  const actions = [{ type: 'grow', score: scoreGrow(cell, entity, state.grid) }]

  for (const [nx, ny] of getNeighbors(cell.x, cell.y)) {
    const target = state.grid[ny][nx]
    if (!target.owner || target.owner === cell.owner || target.owner === NEUTRAL) {
      actions.push({ type: 'spread', target: { x: nx, y: ny }, leap: false, score: scoreSpread(cell, target, entity, false) })
    }
    if (target.owner && target.owner !== cell.owner && target.owner !== NEUTRAL) {
      actions.push({ type: 'attack', target: { x: nx, y: ny }, score: scoreAttack(cell, target, entity) })
    }
  }

  if (hasNode(entity.nodes, 'leap-spread')) {
    for (const [nx, ny] of getLeapNeighbors(cell.x, cell.y)) {
      const target = state.grid[ny][nx]
      if (!target.owner || target.owner === NEUTRAL) {
        actions.push({ type: 'spread', target: { x: nx, y: ny }, leap: true, score: scoreSpread(cell, target, entity, true) })
      }
    }
  }

  actions.sort((a, b) => b.score - a.score)
  return actions[0]
}

function gainShield(cell, entity) {
  const gain = getDefenseRank(entity)
  if (gain <= 0) return
  const before = cell.shield
  cell.shield = Math.min(getShieldCap(entity), cell.shield + gain)
  if (cell.shield > before) {
    cell.delta = { text: `+${cell.shield - before}`, kind: 'shield', owner: cell.owner, dir: 'up', jitter: (cell.x + cell.y) % 3 }
  }
}

function applySpillover(grid, cell, entity) {
  if (!hasNode(entity.nodes, 'spillover')) return

  for (const [nx, ny] of getNeighbors(cell.x, cell.y)) {
    const neighbor = grid[ny][nx]
    if (neighbor.owner === cell.owner) {
      const cap = getCellCap(entity)
      const before = neighbor.mass
      neighbor.mass = Math.min(cap, neighbor.mass + 1)
      if (neighbor.mass > before) {
        neighbor.delta = { text: '+1', kind: 'grow', owner: neighbor.owner, dir: getDirection(cell.x, cell.y, neighbor.x, neighbor.y), jitter: (neighbor.x + neighbor.y) % 3 }
      }
      neighbor.pulse = 'grow'
    }
  }
}

function applyGrowth(grid, cell, entity) {
  const cap = getCellCap(entity)
  const gain = getGrowthGain(cell, entity)
  const before = cell.mass
  const uncappedMass = cell.mass + gain
  const nextMass = Math.min(cap, uncappedMass)
  cell.capped = uncappedMass > cap
  cell.mass = nextMass
  cell.lastAction = 'grow'
  cell.pulse = 'grow'
  if (cell.mass > before) {
    cell.delta = { text: `+${cell.mass - before}`, kind: 'grow', owner: cell.owner, dir: 'up', jitter: (cell.x * 7 + cell.y) % 3 }
  }
  gainShield(cell, entity)

  if (cell.capped) applySpillover(grid, cell, entity)
}

function runPeriodicEffects(state) {
  if (state.tick === 0 || state.tick % balance.periodicEffects.intervalTicks !== 0) return

  ;[[PLAYER, state.player], [ENEMY, state.enemy]].forEach(([owner, entity]) => {
    if (!entity) return

    if (hasNode(entity.nodes, 'spore-burst')) {
      const enemyOwner = owner === PLAYER ? ENEMY : PLAYER
      const targets = state.grid.flat().filter((cell) => cell.owner === enemyOwner).sort((a, b) => b.mass - a.mass)
      const center = targets[0]
      if (center) {
        ;[[center.x, center.y], ...getNeighbors(center.x, center.y)].forEach(([x, y]) => {
          const cell = state.grid[y][x]
          if (cell.owner === enemyOwner) {
            cell.mass = Math.max(0, cell.mass - balance.periodicEffects.sporeBurstDamage)
            cell.delta = { text: `-${balance.periodicEffects.sporeBurstDamage}`, kind: 'damage', owner: enemyOwner, dir: 'up', jitter: (x + y) % 3 }
            cell.pulse = 'attack'
            if (cell.mass <= 0) {
              cell.owner = null
              cell.mass = 0
              cell.shield = 0
              cell.terrain = null
            }
          }
        })
      }
    }

    if (hasNode(entity.nodes, 'bulwark-wave')) {
      state.grid.flat().forEach((cell) => {
        if (cell.owner === owner) {
          for (const [nx, ny] of getNeighbors(cell.x, cell.y)) {
            const neighbor = state.grid[ny][nx]
            if (neighbor.owner === owner) {
              const before = neighbor.shield
              neighbor.shield = Math.min(getShieldCap(entity), neighbor.shield + balance.periodicEffects.bulwarkWaveShield)
              if (neighbor.shield > before) {
                neighbor.delta = { text: `+${balance.periodicEffects.bulwarkWaveShield}`, kind: 'shield', owner, dir: getDirection(cell.x, cell.y, neighbor.x, neighbor.y), jitter: (nx + ny) % 3 }
              }
            }
          }
        }
      })
    }
  })
}

function resolveCapture(targetCell, newOwner, resultingMass, dir, jitter) {
  targetCell.owner = newOwner
  targetCell.mass = Math.max(0, resultingMass)
  targetCell.shield = SHIELD_CAP_BASE
  targetCell.terrain = null
  targetCell.lastAction = 'capture'
  targetCell.pulse = 'swing'
  targetCell.delta = { text: `+${targetCell.mass}`, kind: 'grow', owner: newOwner, dir, jitter }
}

function applySpread(state, sourceCell, targetCell, leap = false) {
  const attacker = sourceCell.owner === PLAYER ? state.player : state.enemy
  const leaveBehind = leap ? SPREAD_COST + 1 : SPREAD_COST

  if (sourceCell.mass < leaveBehind + SPREAD_SPAWN) {
    sourceCell.lastAction = 'hold'
    gainShield(sourceCell, attacker)
    return
  }

  const before = sourceCell.mass
  sourceCell.mass = Math.max(0, sourceCell.mass - (SPREAD_COST + SPREAD_SPAWN))
  sourceCell.lastAction = leap ? 'leap' : 'spread'
  sourceCell.pulse = 'spread'
  sourceCell.delta = { text: `-${SPREAD_COST + SPREAD_SPAWN}`, kind: 'damage', owner: sourceCell.owner, dir: getDirection(sourceCell.x, sourceCell.y, targetCell.x, targetCell.y), jitter: (sourceCell.x + sourceCell.y) % 3 }
  targetCell.oozeFrom = `${sourceCell.x},${sourceCell.y}`
  targetCell.oozeDir = getDirection(sourceCell.x, sourceCell.y, targetCell.x, targetCell.y)

  if (sourceCell.mass <= 0) {
    sourceCell.owner = null
    sourceCell.mass = 0
    sourceCell.shield = 0
  } else if (before > sourceCell.mass) {
    sourceCell.shield = Math.max(0, sourceCell.shield - 1)
  }

  if (!targetCell.owner) {
    targetCell.owner = attacker.owner
    targetCell.mass = SPREAD_SPAWN
    targetCell.shield = SHIELD_CAP_BASE
    targetCell.lastAction = leap ? 'leap' : 'spread'
    targetCell.pulse = 'spread'
    targetCell.delta = { text: '+1', kind: 'grow', owner: targetCell.owner, dir: targetCell.oozeDir, jitter: (targetCell.x + targetCell.y) % 3 }
    return
  }

  if (targetCell.owner === attacker.owner) {
    const cap = getCellCap(attacker)
    const oldMass = targetCell.mass
    targetCell.mass = Math.min(cap, targetCell.mass + SPREAD_SPAWN)
    targetCell.lastAction = 'feed'
    targetCell.pulse = 'spread'
    if (targetCell.mass > oldMass) {
      targetCell.delta = { text: '+1', kind: 'grow', owner: targetCell.owner, dir: targetCell.oozeDir, jitter: (targetCell.x + targetCell.y) % 3 }
    }
    return
  }

  if (targetCell.owner === NEUTRAL) {
    targetCell.contested = true
    targetCell.mass = Math.max(0, targetCell.mass - SPREAD_SPAWN)
    targetCell.delta = { text: '-1', kind: 'damage', owner: NEUTRAL, dir: targetCell.oozeDir, jitter: (targetCell.x + targetCell.y) % 3 }
    targetCell.pulse = 'attack'
    if (targetCell.mass <= 0) {
      resolveCapture(targetCell, attacker.owner, 1, targetCell.oozeDir, (targetCell.x + targetCell.y) % 3)
    }
  }
}

function applyAttack(state, sourceCell, targetCell) {
  const attacker = sourceCell.owner === PLAYER ? state.player : state.enemy
  const defender = targetCell.owner === PLAYER ? state.player : targetCell.owner === ENEMY ? state.enemy : null
  if (sourceCell.mass <= ATTACK_COST) {
    sourceCell.lastAction = 'hold'
    gainShield(sourceCell, attacker)
    return
  }

  const committed = Math.max(0, sourceCell.mass - ATTACK_COST)
  sourceCell.mass = 0
  sourceCell.owner = null
  sourceCell.shield = 0
  sourceCell.lastAction = 'attack'
  sourceCell.pulse = 'attack'
  sourceCell.delta = { text: `-${committed}`, kind: 'damage', owner: attacker.owner, dir: getDirection(sourceCell.x, sourceCell.y, targetCell.x, targetCell.y), jitter: (sourceCell.x + sourceCell.y) % 3 }

  targetCell.oozeFrom = `${sourceCell.x},${sourceCell.y}`
  targetCell.oozeDir = getDirection(sourceCell.x, sourceCell.y, targetCell.x, targetCell.y)
  targetCell.contested = true
  targetCell.attackedThisTick += 1
  targetCell.pulse = 'contest'

  let attackDamage = committed + Math.floor(getAttackStat(attacker))
  if (hasNode(attacker.nodes, 'focus-fire')) attackDamage += (targetCell.attackedThisTick - 1) * 2

  if (targetCell.owner === NEUTRAL) {
    const neutralReturn = targetCell.mass
    const attackerRemaining = Math.max(0, attackDamage - neutralReturn)
    targetCell.mass = Math.max(0, targetCell.mass - attackDamage)
    targetCell.delta = { text: `-${Math.min(attackDamage, neutralReturn)}`, kind: 'damage', owner: NEUTRAL, dir: targetCell.oozeDir, jitter: (targetCell.x + targetCell.y) % 3 }
    if (targetCell.mass <= 0 && attackerRemaining > 0) {
      resolveCapture(targetCell, attacker.owner, attackerRemaining, targetCell.oozeDir, (targetCell.x + targetCell.y) % 3)
    }
    return
  }

  const defenderBaseShield = SHIELD_CAP_BASE + targetCell.shield
  const shieldBreak = hasNode(attacker.nodes, 'shield-breaker') ? 2 : 0
  const effectiveShield = Math.max(0, defenderBaseShield - shieldBreak)
  const defenderDamage = targetCell.mass

  const totalDefense = effectiveShield + defenderDamage
  const attackerRemaining = Math.max(0, attackDamage - totalDefense)
  const defenderRemaining = Math.max(0, defenderDamage - attackDamage)

  targetCell.delta = { text: `-${Math.min(attackDamage, defenderDamage + effectiveShield)}`, kind: 'damage', owner: targetCell.owner, dir: targetCell.oozeDir, jitter: (targetCell.x + targetCell.y) % 3 }

  if (attackerRemaining > 0) {
    resolveCapture(targetCell, attacker.owner, attackerRemaining, targetCell.oozeDir, (targetCell.x + targetCell.y) % 3)
  } else {
    targetCell.mass = defenderRemaining
    targetCell.shield = SHIELD_CAP_BASE
    targetCell.lastAction = 'hold'
    targetCell.pulse = 'attack'
    if (targetCell.mass <= 0) {
      targetCell.owner = null
      targetCell.mass = 0
      targetCell.shield = 0
    }
  }

  if (defender && hasNode(defender.nodes, 'thorns') && attackerRemaining === 0) {
    targetCell.shield = Math.min(getShieldCap(defender), targetCell.shield + 1)
  }
}

function runSingleTick(previous) {
  const grid = cloneGrid(previous.grid)
  clearCellFlags(grid)
  const state = { ...previous, grid }

  runPeriodicEffects(state)

  const actors = []
  grid.forEach((row) => row.forEach((cell) => {
    if ((cell.owner === PLAYER || cell.owner === ENEMY) && cell.mass > 0) actors.push({ x: cell.x, y: cell.y, mass: cell.mass })
  }))

  actors.sort((a, b) => b.mass - a.mass)

  for (const actor of actors) {
    const cell = grid[actor.y][actor.x]
    if (!(cell.owner === PLAYER || cell.owner === ENEMY) || cell.mass <= 0) continue

    const action = chooseAction(state, cell)
    if (action.type === 'grow') {
      applyGrowth(grid, cell, cell.owner === PLAYER ? state.player : state.enemy)
    } else if (action.type === 'attack') {
      const targetCell = grid[action.target.y][action.target.x]
      applyAttack(state, cell, targetCell)
    } else {
      const targetCell = grid[action.target.y][action.target.x]
      applySpread(state, cell, targetCell, action.leap)
    }
  }

  return { ...state, tick: previous.tick + 1 }
}

export function createSimulationState({ draft, encounter, tick }) {
  const player = { owner: PLAYER, label: 'Your Slime', stats: draft.stats, nodes: draft.nodes }
  const enemy = encounter.enemy ? { owner: ENEMY, label: encounter.enemy.label, stats: encounter.enemy.stats, nodes: encounter.enemy.nodes } : null

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
    playerShield: 0,
    enemyShield: 0,
    finished: false,
    timeout: false,
    winner: null,
    maxTicks: BATTLE_TICK_LIMIT,
  }

  state.grid.forEach((row) => row.forEach((cell) => {
    if (cell.owner === PLAYER) {
      summary.playerCells += 1
      summary.playerMass += cell.mass
      summary.playerShield += cell.shield
    } else if (cell.owner === ENEMY) {
      summary.enemyCells += 1
      summary.enemyMass += cell.mass
      summary.enemyShield += cell.shield
    }
  }))

  summary.playerScore = summary.playerCells * 3 + summary.playerMass + summary.playerShield
  summary.enemyScore = summary.enemyCells * 3 + summary.enemyMass + summary.enemyShield

  if (!state.enemy) {
    summary.verdict = 'Preview'
    return summary
  }

  if (summary.enemyCells === 0) {
    summary.finished = true
    summary.winner = PLAYER
    summary.verdict = 'Player victory'
    return summary
  }

  if (summary.playerCells === 0) {
    summary.finished = true
    summary.winner = ENEMY
    summary.verdict = 'Enemy victory'
    return summary
  }

  if (state.tick >= BATTLE_TICK_LIMIT) {
    summary.finished = true
    summary.timeout = true
    summary.winner = summary.playerScore >= summary.enemyScore ? PLAYER : ENEMY
    summary.verdict = summary.winner === PLAYER ? 'Player control' : 'Enemy control'
    return summary
  }

  summary.verdict = summary.playerScore > summary.enemyScore ? 'Player pressure' : summary.playerScore < summary.enemyScore ? 'Enemy pressure' : 'Even'
  return summary
}
