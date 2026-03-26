import { createLevelEncounter } from './encounters'

export const STARTING_STAT_POINTS = 10
export const STARTING_GENOME_POINTS = 0
export const BATTLE_TICK_LIMIT = 45
export const MAX_LEVEL = 6
export const GENOME_UNLOCK_AFTER_WINS = 3

export function createInitialRun() {
  return {
    level: 1,
    wins: 0,
    statPoints: STARTING_STAT_POINTS,
    genomePoints: STARTING_GENOME_POINTS,
    genomeUnlocked: false,
    battleIndex: 0,
    mode: 'workshop',
    battleResult: null,
    finished: false,
    score: 0,
    stats: {
      largestMass: 0,
      bestScore: 0,
      lastPlayerScore: 0,
      lastEnemyScore: 0,
    },
  }
}

export function getCurrentEncounter(run) {
  return createLevelEncounter(run.battleIndex)
}

export function applyBattleOutcome(run, outcome) {
  const didWin = outcome.winner === 'player'
  const nextStats = {
    largestMass: Math.max(run.stats.largestMass, outcome.playerMass ?? 0),
    bestScore: Math.max(run.stats.bestScore, outcome.playerScore ?? 0),
    lastPlayerScore: outcome.playerScore ?? 0,
    lastEnemyScore: outcome.enemyScore ?? 0,
  }

  if (!didWin) {
    return {
      ...run,
      mode: 'gameover',
      battleResult: outcome,
      finished: true,
      score: run.score + Math.max(0, (outcome.playerScore ?? 0) + run.wins * 10),
      stats: nextStats,
    }
  }

  const nextBattleIndex = run.battleIndex + 1
  const nextWins = run.wins + 1
  const nextLevel = run.level + 1
  const clearedRun = nextBattleIndex >= MAX_LEVEL
  const genomeUnlocked = nextWins >= GENOME_UNLOCK_AFTER_WINS

  return {
    ...run,
    level: nextLevel,
    wins: nextWins,
    statPoints: STARTING_STAT_POINTS + nextWins,
    genomePoints: genomeUnlocked ? Math.max(0, nextWins - 2) : 0,
    genomeUnlocked,
    battleIndex: nextBattleIndex,
    mode: clearedRun ? 'gameover' : 'workshop',
    battleResult: outcome,
    finished: clearedRun,
    score: run.score + 25 + (outcome.playerScore ?? 0) + nextWins * 5,
    stats: nextStats,
  }
}
