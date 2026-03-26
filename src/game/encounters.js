const ENCOUNTERS = [
  {
    id: 'tutorial-bloom',
    name: 'Soft Bloom',
    description: 'A loose starter strain. Most coherent builds should beat it.',
    enemy: {
      label: 'Soft Bloom',
      stats: { bloom: 3, drift: 3, rupture: 2, shell: 2, synapse: 1 },
      mutations: ['soft-division'],
      seedPattern: 'corner-cluster',
    },
  },
  {
    id: 'needle-drifter',
    name: 'Needle Drifter',
    description: 'Fast spreader that steals open ground from clumsy builds.',
    enemy: {
      label: 'Needle Drifter',
      stats: { bloom: 3, drift: 6, rupture: 3, shell: 2, synapse: 2 },
      mutations: ['frontier-sense', 'slide-membrane'],
      seedPattern: 'diagonal-pair',
    },
  },
  {
    id: 'carapace-reef',
    name: 'Carapace Reef',
    description: 'Dense defensive colony that punishes weak frontal pressure.',
    enemy: {
      label: 'Carapace Reef',
      stats: { bloom: 2, drift: 2, rupture: 4, shell: 5, synapse: 3 },
      mutations: ['reinforced-membrane', 'linked-nodes'],
      seedPattern: 'center-mass',
    },
  },
  {
    id: 'razor-bloom',
    name: 'Razor Bloom',
    description: 'Aggressive rupture strain that breaks weak lines.',
    enemy: {
      label: 'Razor Bloom',
      stats: { bloom: 3, drift: 4, rupture: 6, shell: 2, synapse: 2 },
      mutations: ['predator-spines', 'weakpoint-probe'],
      seedPattern: 'diagonal-pair',
    },
  },
  {
    id: 'fractal-engine',
    name: 'Fractal Engine',
    description: 'Growth-heavy splitter that snowballs if ignored.',
    enemy: {
      label: 'Fractal Engine',
      stats: { bloom: 6, drift: 4, rupture: 3, shell: 3, synapse: 2 },
      mutations: ['soft-division', 'fractal-splitting', 'fresh-spawn'],
      seedPattern: 'corner-cluster',
    },
  },
  {
    id: 'bastion-mind',
    name: 'Bastion Mind',
    description: 'Final hybrid strain with real branch synergy.',
    enemy: {
      label: 'Bastion Mind',
      stats: { bloom: 4, drift: 3, rupture: 5, shell: 6, synapse: 5 },
      mutations: ['reinforced-membrane', 'linked-nodes', 'piercing-lash', 'elastic-wall'],
      seedPattern: 'double-wall',
    },
  },
]

export function createSandboxEncounter() {
  return {
    id: 'sandbox',
    name: 'Workshop Basin',
    description: 'Preview your current strain on an empty containment board.',
    enemy: null,
  }
}

export function createLevelEncounter(index) {
  return ENCOUNTERS[Math.min(index, ENCOUNTERS.length - 1)]
}
