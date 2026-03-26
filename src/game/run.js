import { createLevelEncounter } from './encounters'

export const STARTING_STAT_POINTS = 8
export const STARTING_GENOME_POINTS = 2
export const BATTLE_TICK_LIMIT = 45
export const MAX_LEVEL = 6

export function createInitialRun() {
  return {
    level: 1,
    wins: 0,
    statPoints: STARTING_STAT_POINTS,
    genomePoints: STARTING_GENOME_POINTS,
    battleIndex: 0,
    mode: 'workshop',
    battleResult: null,
    finished: false,
  }
}

export function getCurrentEncounter(run) {
  return createLevelEncounter(run.battleIndex)
}

export function applyBattleOutcome(run, outcome) {
  const didWin = outcome.winner === 'player'

  if (!didWin) {
    return {
      ...run,
      mode: 'workshop',
      battleResult: outcome,
      finished: true,
    }
  }

  const nextBattleIndex = run.battleIndex + 1
  const nextLevel = run.level + 1
  const clearedRun = nextBattleIndex >= MAX_LEVEL

  return {
    ...run,
    level: nextLevel,
    wins: run.wins + 1,
    statPoints: run.statPoints + 1,
    genomePoints: run.genomePoints + 1,
    battleIndex: nextBattleIndex,
    mode: 'workshop',
    battleResult: outcome,
    finished: clearedRun,
  }
}
