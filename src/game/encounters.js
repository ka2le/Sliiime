const ENCOUNTERS = [
  {
    id: 'crumb-mite',
    name: 'Crumb Mite',
    description: 'Barely a creature. Good for learning dense growth.',
    enemy: {
      label: 'Crumb Mite',
      stats: { attack: 0, growth: 0, spreadBias: 88 },
      nodes: [],
      seedPattern: 'tiny-cluster',
    },
    terrain: null,
  },
  {
    id: 'wander-bit',
    name: 'Wander Bit',
    description: 'Spreads wider and steals empty ground first.',
    enemy: {
      label: 'Wander Bit',
      stats: { attack: 1, growth: 0, spreadBias: 94 },
      nodes: [],
      seedPattern: 'diagonal-pair',
    },
    terrain: null,
  },
  {
    id: 'fat-pod',
    name: 'Fat Pod',
    description: 'Chunky anchor blob that tests direct pressure.',
    enemy: {
      label: 'Fat Pod',
      stats: { attack: 1, growth: 2, spreadBias: 82 },
      nodes: ['growth-boost'],
      seedPattern: 'heavy-core',
    },
    terrain: { kind: 'neutral-clump', cells: [[3, 3], [3, 2]] },
  },
  {
    id: 'reef-splitter',
    name: 'Reef Splitter',
    description: 'Neutral sludge blocks the center, forcing path choices.',
    enemy: {
      label: 'Reef Splitter',
      stats: { attack: 1, growth: 1, spreadBias: 92 },
      nodes: [],
      seedPattern: 'wide-line',
    },
    terrain: { kind: 'neutral-wall', cells: [[3, 1], [3, 2], [3, 3], [3, 4]] },
  },
  {
    id: 'needle-film',
    name: 'Needle Film',
    description: 'A sharper spreader that punishes passive builds.',
    enemy: {
      label: 'Needle Film',
      stats: { attack: 2, growth: 1, spreadBias: 96 },
      nodes: ['attack-boost'],
      seedPattern: 'wide-line',
    },
    terrain: null,
  },
  {
    id: 'shield-skein',
    name: 'Shield Skein',
    description: 'Builds shield and dares you to break through.',
    enemy: {
      label: 'Shield Skein',
      stats: { attack: 2, growth: 1, spreadBias: 84 },
      nodes: ['defense-boost', 'shield-pool'],
      seedPattern: 'heavy-core',
    },
    terrain: { kind: 'neutral-clump', cells: [[2, 3], [3, 3], [4, 3]] },
  },
  {
    id: 'crusher-jelly',
    name: 'Crusher Jelly',
    description: 'Chunky and dangerous. Wants growth plus attack.',
    enemy: {
      label: 'Crusher Jelly',
      stats: { attack: 3, growth: 2, spreadBias: 86 },
      nodes: ['attack-boost', 'growth-boost'],
      seedPattern: 'heavy-core',
    },
    terrain: null,
  },
  {
    id: 'vault-mold',
    name: 'Vault Mold',
    description: 'Uses both shield and growth while neutral walls delay access.',
    enemy: {
      label: 'Vault Mold',
      stats: { attack: 2, growth: 3, spreadBias: 84 },
      nodes: ['defense-boost', 'growth-boost', 'cell-cap'],
      seedPattern: 'double-line',
    },
    terrain: { kind: 'neutral-gate', cells: [[2, 2], [3, 2], [4, 2], [3, 3]] },
  },
  {
    id: 'glass-hive',
    name: 'Glass Hive',
    description: 'Fast and sharp. Punishes weak map control.',
    enemy: {
      label: 'Glass Hive',
      stats: { attack: 3, growth: 2, spreadBias: 95 },
      nodes: ['attack-boost', 'focus-fire'],
      seedPattern: 'double-line',
    },
    terrain: { kind: 'neutral-clump', cells: [[2, 2], [4, 4]] },
  },
  {
    id: 'bastion-surge',
    name: 'Bastion Surge',
    description: 'Late hybrid enemy with shield, focus fire, and growth backup.',
    enemy: {
      label: 'Bastion Surge',
      stats: { attack: 3, growth: 3, spreadBias: 90 },
      nodes: ['attack-boost', 'focus-fire', 'defense-boost', 'growth-boost'],
      seedPattern: 'double-line',
    },
    terrain: { kind: 'neutral-wall', cells: [[1, 3], [2, 3], [4, 3], [5, 3]] },
  },
]

export function createSandboxEncounter() {
  return {
    id: 'sandbox',
    name: 'Containment dish',
    description: 'Preview your slime without an enemy so you can read the build.',
    enemy: null,
    terrain: null,
  }
}

export function createLevelEncounter(index) {
  return ENCOUNTERS[Math.min(index, ENCOUNTERS.length - 1)]
}
