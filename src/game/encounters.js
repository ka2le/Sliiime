const ENCOUNTERS = [
  {
    id: 'sandbox',
    name: 'Calm Petri Field',
    description: 'No challenger. Watch your strain spread on an empty board.',
    enemy: null,
  },
  {
    id: 'drifter',
    name: 'Needle Drifter',
    description: 'Fast thin spreader that steals empty space early.',
    enemy: {
      label: 'Needle Drifter',
      stats: { bloom: 3, drift: 7, rupture: 4, shell: 2, synapse: 2 },
      mutations: ['empty-lure'],
      seedPattern: 'corner-cluster',
    },
  },
  {
    id: 'bulwark',
    name: 'Carapace Reef',
    description: 'Slow but hard to remove once it locks territory.',
    enemy: {
      label: 'Carapace Reef',
      stats: { bloom: 2, drift: 2, rupture: 4, shell: 8, synapse: 6 },
      mutations: ['reinforced-membrane', 'linked-nodes'],
      seedPattern: 'center-mass',
    },
  },
  {
    id: 'predator',
    name: 'Razor Bloom',
    description: 'Aggressive breakthrough strain with high local pressure.',
    enemy: {
      label: 'Razor Bloom',
      stats: { bloom: 4, drift: 5, rupture: 7, shell: 3, synapse: 3 },
      mutations: ['predator-spines'],
      seedPattern: 'diagonal-pair',
    },
  },
]

export function createEncounter(index) {
  return ENCOUNTERS[index % ENCOUNTERS.length]
}

export function getNextEncounterIndex(index) {
  return (index + 1) % ENCOUNTERS.length
}
