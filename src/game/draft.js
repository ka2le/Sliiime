export const STAT_DEFS = [
  {
    key: 'bloom',
    name: 'Bloom',
    description: 'How quickly the colony creates new mass.',
    min: 0,
    max: 10,
  },
  {
    key: 'drift',
    name: 'Drift',
    description: 'How readily the colony spreads into open cells.',
    min: 0,
    max: 10,
  },
  {
    key: 'rupture',
    name: 'Rupture',
    description: 'Offensive force when pushing into enemy territory.',
    min: 0,
    max: 10,
  },
  {
    key: 'shell',
    name: 'Shell',
    description: 'Durability when holding contested space.',
    min: 0,
    max: 10,
  },
  {
    key: 'synapse',
    name: 'Synapse',
    description: 'How much nearby cells coordinate and reinforce each other.',
    min: 0,
    max: 10,
  },
]

export const PRESETS = [
  {
    id: 'balanced',
    label: 'Balanced Mesh',
    stats: { bloom: 4, drift: 4, rupture: 4, shell: 4, synapse: 4 },
    mutations: ['reinforced-membrane'],
  },
  {
    id: 'swarm',
    label: 'Swarm Bloom',
    stats: { bloom: 7, drift: 7, rupture: 3, shell: 1, synapse: 2 },
    mutations: ['rapid-mitosis', 'empty-lure'],
  },
  {
    id: 'bulwark',
    label: 'Bulwark Colony',
    stats: { bloom: 2, drift: 1, rupture: 4, shell: 7, synapse: 6 },
    mutations: ['reinforced-membrane', 'linked-nodes'],
  },
]

export const MUTATIONS = [
  {
    id: 'rapid-mitosis',
    name: 'Rapid Mitosis',
    description: '+1 growth on each reinforce action.',
  },
  {
    id: 'empty-lure',
    name: 'Empty Lure',
    description: 'Expansion into empty cells gets bonus force.',
  },
  {
    id: 'reinforced-membrane',
    name: 'Reinforced Membrane',
    description: 'Occupied cells lose less mass in clashes.',
  },
  {
    id: 'linked-nodes',
    name: 'Linked Nodes',
    description: 'Adjacent friendly cells provide stronger support.',
  },
  {
    id: 'predator-spines',
    name: 'Predator Spines',
    description: 'Successful invasions retain extra surviving mass.',
  },
  {
    id: 'fractal-splitting',
    name: 'Fractal Splitting',
    description: 'High-mass cells are more willing to divide.',
  },
]

export function createInitialDraft() {
  return {
    stats: {
      bloom: 4,
      drift: 4,
      rupture: 4,
      shell: 4,
      synapse: 4,
    },
    mutations: ['reinforced-membrane'],
  }
}

export function applyDraftPreset(current, presetId) {
  const preset = PRESETS.find((entry) => entry.id === presetId)

  if (!preset) {
    return current
  }

  return {
    stats: { ...preset.stats },
    mutations: [...preset.mutations],
  }
}
