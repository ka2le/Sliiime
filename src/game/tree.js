export const BRANCH_ORDER = ['bloom', 'drift', 'rupture', 'shell']

export const TREE_NODES = [
  {
    id: 'soft-division',
    name: 'Soft Division',
    branch: 'bloom',
    tier: 1,
    requiresSpent: 0,
    description: '+1 growth in calm cells.',
  },
  {
    id: 'nutrient-hold',
    name: 'Nutrient Hold',
    branch: 'bloom',
    tier: 1,
    requiresSpent: 0,
    description: 'Expansion spends 1 less mass when source is large.',
  },
  {
    id: 'fractal-splitting',
    name: 'Fractal Splitting',
    branch: 'bloom',
    tier: 2,
    requiresSpent: 2,
    description: 'Large cells split into stronger new cells.',
  },
  {
    id: 'fresh-spawn',
    name: 'Fresh Spawn',
    branch: 'bloom',
    tier: 2,
    requiresSpent: 2,
    description: 'Newly created cells enter with +1 mass when possible.',
  },
  {
    id: 'overflow-bloom',
    name: 'Overflow Bloom',
    branch: 'bloom',
    tier: 3,
    requiresSpent: 4,
    description: 'Maxed cells push spare growth into allies.',
  },
  {
    id: 'frontier-sense',
    name: 'Frontier Sense',
    branch: 'drift',
    tier: 1,
    requiresSpent: 0,
    description: 'Expansion strongly prefers enemy-facing open space.',
  },
  {
    id: 'slide-membrane',
    name: 'Slide Membrane',
    branch: 'drift',
    tier: 1,
    requiresSpent: 0,
    description: 'Expansion cost reduced in low-mass tiles.',
  },
  {
    id: 'empty-lure',
    name: 'Empty Lure',
    branch: 'drift',
    tier: 2,
    requiresSpent: 2,
    description: 'Frontier expansion gets bonus spawn mass.',
  },
  {
    id: 'phase-surge',
    name: 'Phase Surge',
    branch: 'drift',
    tier: 2,
    requiresSpent: 2,
    description: 'High-drift tiles value expansion more aggressively.',
  },
  {
    id: 'encircle-instinct',
    name: 'Encircle Instinct',
    branch: 'drift',
    tier: 3,
    requiresSpent: 4,
    description: 'Expansion near enemies gets extra priority and mass.',
  },
  {
    id: 'predator-spines',
    name: 'Predator Spines',
    branch: 'rupture',
    tier: 1,
    requiresSpent: 0,
    description: 'Captures retain extra surviving mass.',
  },
  {
    id: 'weakpoint-probe',
    name: 'Weakpoint Probe',
    branch: 'rupture',
    tier: 1,
    requiresSpent: 0,
    description: 'Bonus attack against isolated enemy tiles.',
  },
  {
    id: 'piercing-lash',
    name: 'Piercing Lash',
    branch: 'rupture',
    tier: 2,
    requiresSpent: 2,
    description: 'High-mass attackers hit harder.',
  },
  {
    id: 'cascade-kill',
    name: 'Cascade Kill',
    branch: 'rupture',
    tier: 2,
    requiresSpent: 2,
    description: 'Freshly captured cells become temporarily more dangerous.',
  },
  {
    id: 'breakline-pulse',
    name: 'Breakline Pulse',
    branch: 'rupture',
    tier: 3,
    requiresSpent: 4,
    description: 'Successful captures damage adjacent enemy cells.',
  },
  {
    id: 'reinforced-membrane',
    name: 'Reinforced Membrane',
    branch: 'shell',
    tier: 1,
    requiresSpent: 0,
    description: 'Extra defense during clashes.',
  },
  {
    id: 'braced-core',
    name: 'Braced Core',
    branch: 'shell',
    tier: 1,
    requiresSpent: 0,
    description: 'Home-side cells get a hold bonus.',
  },
  {
    id: 'linked-nodes',
    name: 'Linked Nodes',
    branch: 'shell',
    tier: 2,
    requiresSpent: 2,
    description: 'Adjacency support becomes stronger.',
  },
  {
    id: 'elastic-wall',
    name: 'Elastic Wall',
    branch: 'shell',
    tier: 2,
    requiresSpent: 2,
    description: 'Successful defenses keep more mass.',
  },
  {
    id: 'static-carapace',
    name: 'Static Carapace',
    branch: 'shell',
    tier: 3,
    requiresSpent: 4,
    description: 'Tiles holding position gain scaling defense.',
  },
]

export function getNode(nodeId) {
  return TREE_NODES.find((node) => node.id === nodeId)
}

export function getBranchSpend(unlockedNodes, branch) {
  return unlockedNodes.reduce((count, nodeId) => count + (getNode(nodeId)?.branch === branch ? 1 : 0), 0)
}

export function canUnlockNode(unlockedNodes, genomePoints, nodeId) {
  const node = getNode(nodeId)
  if (!node) return false
  if (genomePoints < 1) return false
  if (unlockedNodes.includes(nodeId)) return false
  return getBranchSpend(unlockedNodes, node.branch) >= node.requiresSpent
}
