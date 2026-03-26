import { canUnlockNode } from './tree'

export const STAT_DEFS = [
  { key: 'bloom', name: 'Bloom', description: 'Creates new mass and fuels long growth chains.', min: 0, max: 10 },
  { key: 'drift', name: 'Drift', description: 'Pushes cells into open terrain and better angles.', min: 0, max: 10 },
  { key: 'rupture', name: 'Rupture', description: 'Turns committed mass into violent tile captures.', min: 0, max: 10 },
  { key: 'shell', name: 'Shell', description: 'Lets colonies keep territory under pressure.', min: 0, max: 10 },
  { key: 'synapse', name: 'Synapse', description: 'Rewards tight formations with stronger support.', min: 0, max: 10 },
]

export const PRESETS = [
  {
    id: 'balanced',
    label: 'Balanced Mesh',
    stats: { bloom: 4, drift: 4, rupture: 4, shell: 4, synapse: 4 },
    nodes: [],
  },
  {
    id: 'swarm',
    label: 'Swarm Bloom',
    stats: { bloom: 6, drift: 6, rupture: 3, shell: 2, synapse: 3 },
    nodes: [],
  },
  {
    id: 'bulwark',
    label: 'Bulwark Colony',
    stats: { bloom: 3, drift: 2, rupture: 4, shell: 6, synapse: 5 },
    nodes: [],
  },
]

export function createInitialDraft() {
  return {
    stats: { bloom: 2, drift: 2, rupture: 2, shell: 2, synapse: 2 },
    nodes: [],
  }
}

export function createResetDraft(previous) {
  return {
    stats: { bloom: 2, drift: 2, rupture: 2, shell: 2, synapse: 2 },
    nodes: [...previous.nodes],
  }
}

export function getAllocatedStatPoints(draft) {
  return Object.values(draft.stats).reduce((sum, value) => sum + (value - 2), 0)
}

export function getRemainingStatPoints(draft, run) {
  return run.statPoints - getAllocatedStatPoints(draft)
}

export function setDraftStat(draft, run, key, value) {
  const nextValue = Math.max(0, Math.min(10, value))
  const currentValue = draft.stats[key]
  const diff = nextValue - currentValue
  const remaining = getRemainingStatPoints(draft, run)
  if (diff > remaining) return draft
  return { ...draft, stats: { ...draft.stats, [key]: nextValue } }
}

export function tryUnlockNode(draft, run, nodeId) {
  if (!run.genomeUnlocked) return draft
  if (!canUnlockNode(draft.nodes, run.genomePoints - draft.nodes.length, nodeId)) return draft
  return { ...draft, nodes: [...draft.nodes, nodeId] }
}

export function applyDraftPreset(current, presetId, run) {
  const preset = PRESETS.find((entry) => entry.id === presetId)
  if (!preset) return current

  const next = {
    stats: { ...preset.stats },
    nodes: run.genomeUnlocked ? [...current.nodes] : [],
  }

  if (getRemainingStatPoints(next, run) < 0) return current
  return next
}
