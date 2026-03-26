# SKILL TREE

## Goal
Replace the current flat mutation list with a real branching tree that rewards specialization.

---

## Tree structure
Recommended first version:
- 4 main branches
- 3 tiers per branch
- 1 point per node
- deeper tiers require prior investment in the same branch

Branches:
1. Bloom
2. Drift
3. Rupture
4. Shell

Synapse remains a stat in the first implementation and can become a branch later if needed.

---

## Unlock rules
### Tier 1
Available immediately.

### Tier 2
Requires **2 points spent in that branch**.

### Tier 3
Requires **4 points spent in that branch**.

This keeps the tree understandable and supports focused builds.

---

## Example branch layout

## Bloom branch
### Tier 1
- **Soft Division**: +1 growth in calm cells
- **Nutrient Hold**: cells above mass 5 lose less from expansion

### Tier 2
- **Fractal Splitting**: large cells divide more efficiently
- **Fresh Spawn**: new cells enter with +1 mass when possible

### Tier 3
- **Overflow Bloom**: excess growth spills to adjacent allied cells

---

## Drift branch
### Tier 1
- **Frontier Sense**: prefer expansion toward open territory
- **Slide Membrane**: expansion cost reduced in low-mass cells

### Tier 2
- **Leap Threading**: frontier expansions gain extra spawn mass
- **Encircle Instinct**: bonus when expanding near enemy-controlled cells

### Tier 3
- **Phase Surge**: first expansion each tick gains major range/priority bonus

---

## Rupture branch
### Tier 1
- **Predator Spines**: captures retain extra surviving mass
- **Weakpoint Probe**: bonus against isolated enemy cells

### Tier 2
- **Piercing Lash**: extra force on attacks from high-mass cells
- **Cascade Kill**: freshly captured cells get a short aggression bonus

### Tier 3
- **Breakline Pulse**: successful captures apply pressure to adjacent enemy tiles

---

## Shell branch
### Tier 1
- **Reinforced Membrane**: extra defense during clashes
- **Braced Core**: central cells gain hold bonus

### Tier 2
- **Linked Nodes**: adjacency support is stronger
- **Elastic Wall**: surviving defended cells retain more mass

### Tier 3
- **Static Carapace**: cells that hold for multiple ticks become very hard to remove

---

## Tree data model recommendation
Each node should eventually define:
- id
- name
- branch
- tier
- cost
- prerequisites
- effect definition
- display position for tree rendering

Example shape:

```json
{
  "id": "predator-spines",
  "name": "Predator Spines",
  "branch": "rupture",
  "tier": 1,
  "cost": 1,
  "requires": [],
  "position": { "x": 0, "y": 0 }
}
```

---

## MVP implementation order
1. define branch data structure
2. support point spending + prerequisite checks
3. render a real tree graph, not a list
4. bind chosen nodes into simulation effects
5. tune branch identity after first combat testing
