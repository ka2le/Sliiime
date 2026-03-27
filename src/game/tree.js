export const BRANCHES = [
  { id: 'attack', name: 'Attack' },
  { id: 'defense', name: 'Defense' },
  { id: 'growth', name: 'Growth' },
]

export const TREE_NODES = [
  {
    id: 'attack-boost',
    name: 'Predator Muscle',
    branch: 'attack',
    tier: 1,
    maxRank: 2,
    x: 0,
    y: 0,
    requires: [],
    effectText: 'Attack stat gets +20% per rank.',
  },
  {
    id: 'focus-fire',
    name: 'Focus Fire',
    branch: 'attack',
    tier: 2,
    maxRank: 1,
    x: -1,
    y: 1,
    requires: [{ id: 'attack-boost', rank: 2 }],
    effectText: 'Multiple allied attacks into the same tile gain extra power.',
  },
  {
    id: 'shield-breaker',
    name: 'Shield Breaker',
    branch: 'attack',
    tier: 2,
    maxRank: 1,
    x: 1,
    y: 1,
    requires: [{ id: 'attack-boost', rank: 2 }],
    effectText: 'Attacks strip 2 shield before damage.',
  },
  {
    id: 'spore-burst',
    name: 'Spore Burst',
    branch: 'attack',
    tier: 3,
    maxRank: 1,
    x: 0,
    y: 2,
    requires: [{ id: 'focus-fire', rank: 1 }, { id: 'shield-breaker', rank: 1 }],
    effectText: 'Every 10 ticks, blast a small enemy cluster for 2 damage.',
  },
  {
    id: 'defense-boost',
    name: 'Membrane Wall',
    branch: 'defense',
    tier: 1,
    maxRank: 2,
    x: 0,
    y: 0,
    requires: [],
    effectText: 'Cells gain +1 shield per rank when they grow or hold.',
  },
  {
    id: 'shield-pool',
    name: 'Shield Pool',
    branch: 'defense',
    tier: 2,
    maxRank: 1,
    x: -1,
    y: 1,
    requires: [{ id: 'defense-boost', rank: 2 }],
    effectText: 'Maximum shield per cell increases by 2.',
  },
  {
    id: 'thorns',
    name: 'Reactive Thorns',
    branch: 'defense',
    tier: 2,
    maxRank: 1,
    x: 1,
    y: 1,
    requires: [{ id: 'defense-boost', rank: 2 }],
    effectText: 'Blocked attacks chip the attacker.',
  },
  {
    id: 'bulwark-wave',
    name: 'Bulwark Wave',
    branch: 'defense',
    tier: 3,
    maxRank: 1,
    x: 0,
    y: 2,
    requires: [{ id: 'shield-pool', rank: 1 }, { id: 'thorns', rank: 1 }],
    effectText: 'Every 10 ticks, adjacent allied cells gain +1 shield.',
  },
  {
    id: 'growth-boost',
    name: 'Hungry Core',
    branch: 'growth',
    tier: 1,
    maxRank: 2,
    x: 0,
    y: 0,
    requires: [],
    effectText: 'Growth stat gets +20% per rank.',
  },
  {
    id: 'cell-cap',
    name: 'Compression Sacs',
    branch: 'growth',
    tier: 2,
    maxRank: 1,
    x: -1,
    y: 1,
    requires: [{ id: 'growth-boost', rank: 2 }],
    effectText: 'Cell cap +2.',
  },
  {
    id: 'spillover',
    name: 'Spillover',
    branch: 'growth',
    tier: 2,
    maxRank: 1,
    x: 1,
    y: 1,
    requires: [{ id: 'growth-boost', rank: 2 }],
    effectText: 'If growth hits cap, add +1 to each adjacent allied cell.',
  },
  {
    id: 'aggressive-spreader',
    name: 'Aggressive Spreader',
    branch: 'growth',
    tier: 3,
    maxRank: 1,
    x: -1,
    y: 2,
    requires: [{ id: 'spillover', rank: 1 }],
    effectText: 'Your slime prefers spreading much more often.',
  },
  {
    id: 'leap-spread',
    name: 'Leap Spread',
    branch: 'growth',
    tier: 3,
    maxRank: 1,
    x: 0,
    y: 2,
    requires: [{ id: 'cell-cap', rank: 1 }, { id: 'spillover', rank: 1 }],
    effectText: 'Can occasionally spread two cells away into empty space.',
  },
]

export const TREE_EDGES = [
  ['attack-boost', 'focus-fire'],
  ['attack-boost', 'shield-breaker'],
  ['focus-fire', 'spore-burst'],
  ['shield-breaker', 'spore-burst'],
  ['defense-boost', 'shield-pool'],
  ['defense-boost', 'thorns'],
  ['shield-pool', 'bulwark-wave'],
  ['thorns', 'bulwark-wave'],
  ['growth-boost', 'cell-cap'],
  ['growth-boost', 'spillover'],
  ['spillover', 'aggressive-spreader'],
  ['cell-cap', 'leap-spread'],
  ['spillover', 'leap-spread'],
]

export function getNode(nodeId) {
  return TREE_NODES.find((node) => node.id === nodeId)
}

export function getNodeRank(unlockedNodes, nodeId) {
  return unlockedNodes.filter((id) => id === nodeId).length
}

export function hasNode(unlockedNodes, nodeId) {
  return getNodeRank(unlockedNodes, nodeId) > 0
}

export function canUnlockNode(unlockedNodes, skillPoints, nodeId) {
  const node = getNode(nodeId)
  if (!node) return false
  if (skillPoints < 1) return false
  if (getNodeRank(unlockedNodes, nodeId) >= node.maxRank) return false
  return node.requires.every((requirement) => getNodeRank(unlockedNodes, requirement.id) >= requirement.rank)
}
