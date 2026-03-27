import { createLevelEncounter } from './encounters'
import balance from './GameBalance.json'

export const STARTING_STAT_POINTS = balance.startingStatPoints
export const BATTLE_TICK_LIMIT = balance.battleTickLimit
export const MAX_LEVEL = balance.maxLevel

function getRewardTypeForWins(wins) {
  return wins % 2 === 0 ? 'stat' : 'skill'
}

export function createInitialRun() {
  return {
    level: 1,
    wins: 0,
    statPoints: STARTING_STAT_POINTS,
    skillPoints: 0,
    battleIndex: 0,
    mode: 'workshop',
    battleResult: null,
    finished: false,
    nextRewardType: 'stat',
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
      mode: 'gameover',
      battleResult: outcome,
      finished: true,
    }
  }

  const nextBattleIndex = run.battleIndex + 1
  const nextWins = run.wins + 1
  const clearedRun = nextBattleIndex >= MAX_LEVEL
  const rewardType = getRewardTypeForWins(run.wins)

  return {
    ...run,
    level: run.level + 1,
    wins: nextWins,
    statPoints: run.statPoints + (rewardType === 'stat' ? 1 : 0),
    skillPoints: run.skillPoints + (rewardType === 'skill' ? 1 : 0),
    battleIndex: nextBattleIndex,
    mode: clearedRun ? 'gameover' : 'workshop',
    battleResult: outcome,
    finished: clearedRun,
    nextRewardType: getRewardTypeForWins(nextWins),
  }
}
