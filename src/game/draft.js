import { canUnlockNode } from './tree'
import balance from './GameBalance.json'

export function createInitialDraft() {
  return {
    stats: { attack: 1, growth: 1, spreadBias: balance.defaultSpreadBias },
    nodes: [],
  }
}

export function createResetDraft(previous) {
  return {
    stats: { ...previous.stats },
    nodes: [...previous.nodes],
  }
}

export function getAllocatedStatPoints(draft) {
  return draft.stats.attack + draft.stats.growth
}

export function getRemainingStatPoints(draft, run) {
  return run.statPoints - getAllocatedStatPoints(draft)
}

export function setDraftStat(draft, run, key, value) {
  if (key === 'spreadBias') {
    return {
      ...draft,
      stats: { ...draft.stats, spreadBias: Math.max(0, Math.min(100, value)) },
    }
  }

  const nextValue = Math.max(0, Math.min(8, value))
  const currentValue = draft.stats[key]
  const diff = nextValue - currentValue
  const remaining = getRemainingStatPoints(draft, run)
  if (diff > remaining) return draft

  return {
    ...draft,
    stats: {
      ...draft.stats,
      [key]: nextValue,
    },
  }
}

export function tryUnlockNode(draft, run, nodeId) {
  if (!canUnlockNode(draft.nodes, run.skillPoints - draft.nodes.length, nodeId)) return draft
  return { ...draft, nodes: [...draft.nodes, nodeId] }
}
