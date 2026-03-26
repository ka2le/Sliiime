# GAME LOOP

## Core structure
The game has two primary modes:

1. **Workshop**
2. **Arena**

The Workshop is where the player plans and edits their slime strain. The Arena is where the build is tested in an auto-resolving battle.

---

## Workshop

Purpose:
- adjust stats
- spend genome points
- inspect unlocked tree branches
- preview behavior on an empty board
- review current level and available resources

### Workshop screen goals
- centered square preview grid
- mobile-first layout
- tabs / drawers for stats and tree
- obvious current build summary
- clear CTA to enter the next battle

---

## Arena

Purpose:
- present a clear combat test for the current build
- auto-resolve without direct player input
- communicate tick progression, battle state, and result

### Arena battle rules
- battle starts at tick 0
- both sides act once per tick per occupied tile
- battle ends immediately if one side has no occupied cells
- battle also ends if it reaches the hard cap

### Battle cap
**Default hard cap: 45 ticks**

At 400ms per tick, that gives a battle length of about 18 seconds.

### Timeout resolution
If a battle reaches the cap, winner is decided by score:

`score = territory * 2 + totalMass`

Where:
- `territory` = occupied cells
- `totalMass` = total mass across all owned cells

If scores tie, result is treated as a narrow enemy win for now.

---

## Run progression
A run consists of a sequence of battles.

### Initial target
- 6 battles per run
- 1 enemy per battle
- escalating specialization pressure

### On win
- gain 1 level
- gain 1 stat point
- gain 1 genome point
- proceed to next battle

### On loss
- run ends
- show build summary and likely failure reason later
- return player to Workshop for rebuild / retry

---

## Player progression resources

### Stat points
Used to increase core biological attributes:
- Bloom
- Drift
- Rupture
- Shell
- Synapse

### Genome points
Used to unlock nodes in the skill tree.

---

## MVP loop
1. Start in Workshop
2. Adjust build
3. Enter Arena
4. Auto-battle resolves
5. If win: level up and return to Workshop
6. If loss: run ends, restart flow

---

## Future extensions
- elite battles
- branching path choice
- boss fights
- mutation rewards between battles
- post-battle analytics panel
- build history / retry comparisons
