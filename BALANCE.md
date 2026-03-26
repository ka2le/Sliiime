# BALANCE

## Design goals
The system should reward coherent builds and punish mismatched builds.

Desired outcomes:
- synergistic builds beat early enemies consistently
- weak but coherent builds may survive early but fail later
- incoherent builds should fail early
- defensive builds should be viable without making matches drag forever
- attack builds should feel impactful and decisive

---

## Core stat model
Each stat ranges from **0 to 10**.

### Bloom
Controls growth rate.

### Drift
Controls expansion quality.

### Rupture
Controls attack pressure.

### Shell
Controls defense during contests.

### Synapse
Controls support from adjacent friendly cells.

---

## Starting build budget
Recommended start:
- each stat begins at **2**
- player gets **8 discretionary stat points**

That yields:
- minimum total = 10
- final start total = 18

This gives enough room for specialization without immediately hitting max values.

---

## Level rewards
Per level:
- +1 stat point
- +1 genome point

This keeps raw biology and specialization advancing together.

---

## Suggested stat formulas
These are first-pass targets, not final tuned values.

### Growth
`growthGain = 1 + floor(Bloom / 4)`

Result:
- Bloom 0-3 => 1
- Bloom 4-7 => 2
- Bloom 8-10 => 3

### Expansion
`spawnMass = 1 + floor(Drift / 4)`

Result:
- Drift 0-3 => 1
- Drift 4-7 => 2
- Drift 8-10 => 3

Expansion should consume created mass from the source tile.
Source must remain at minimum 1 mass.

### Attack
`attackForce = committedMass * 2 + ruptureBonus + supportBonus`

Suggested first-pass:
`ruptureBonus = floor(Rupture / 2)`

### Defense
`defenseForce = defenderMass + shellBonus + supportBonus`

Suggested first-pass:
`shellBonus = floor(Shell / 2)`

### Support
`supportBonus = adjacentFriendlyCount * (1 + floor(Synapse / 5))`

Result:
- low Synapse supports broad play but modestly
- high Synapse strongly rewards compact formations

---

## Battle pacing
### Hard cap
- 45 ticks

### Desired default duration
- 12 to 20 seconds at default speed

### Desired outcomes
- early tutorial battles often resolve before timeout
- defensive mirrors may hit timeout
- timeout scoring favors map control slightly

---

## Build archetype expectations

### Swarm Bloom
Stats skew:
- high Bloom
- high Drift
- low Shell
- modest Rupture

Strengths:
- early territory gain
- strong tempo

Weaknesses:
- collapses in direct entrenched fights
- loses if expansion gets contained

### Bulwark Colony
Stats skew:
- high Shell
- medium/high Synapse
- low Drift

Strengths:
- holds ground well
- punishes weak frontal attacks

Weaknesses:
- slow board reach
- vulnerable to being surrounded or outpaced

### Breakthrough Predator
Stats skew:
- high Rupture
- medium Drift
- low Shell

Strengths:
- captures weakly defended cells quickly
- can break lines

Weaknesses:
- unstable in long attrition battles
- weak if denied attack angles

---

## Anti-synergy checks
The game should fail builds like:

### Bad build A
- high Shell
- attack-focused tree
- low Rupture and low Drift

Expected result:
- survives some pressure
- cannot convert survival into winning board state

### Bad build B
- high Bloom
- no expansion or capture support
- low Drift and low Rupture

Expected result:
- accumulates mass locally
- gets boxed in or outscored

---

## First enemy targets

### Level 1 enemy: tutorial pressure
Stats:
- Bloom 3
- Drift 3
- Rupture 2
- Shell 2
- Synapse 1

Goal:
- lose to most coherent builds
- beat obviously broken builds

### Level 2 enemy: anti-swarm check
Stats:
- Bloom 2
- Drift 2
- Rupture 4
- Shell 5
- Synapse 3

Goal:
- punish over-expansion and weak fronts

### Level 3 enemy: anti-turtle check
Stats:
- Bloom 4
- Drift 6
- Rupture 3
- Shell 2
- Synapse 2

Goal:
- punish slow passive builds

### Level 4 enemy: specialist check
Stats:
- optimized build with branch synergy

Goal:
- require actual player synergy to beat

---

## Balance process
Before major system expansion:
1. test 6 sample player builds
2. compare them against 4 sample enemies
3. ensure coherent archetypes outperform incoherent builds
4. tune formulas before adding complexity
