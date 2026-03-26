# UI PLAN

## UI principle
The square grid is the center of the game.
Everything else supports it.

The UI should be **mobile-first**.
Desktop may show more at once, but the mobile structure should be the primary design.

---

## Primary screens

## 1. Workshop screen
Purpose:
- prepare and inspect the build
- preview slime behavior
- spend points
- navigate tree

### Layout
- top header with level, available points, and current strain summary
- large centered square preview grid
- bottom navigation or tab bar
- tapped sections open as sheets / panels:
  - Stats
  - Genome
  - Preview
  - Run

### Workshop mood
Should feel like a lab / incubator / planning chamber.

---

## 2. Arena screen
Purpose:
- show the battle as a distinct game phase
- make battle feel important and separate from planning

### Layout
- top HUD with:
  - battle number / level
  - enemy name
  - tick counter
  - speed control
  - pause
- large centered square battle grid
- bottom compact status strip:
  - player mass
  - enemy mass
  - territory counts
  - live verdict
- optional details drawer for logs and breakdowns

### Arena mood
Should feel like entering a dangerous test chamber or combat basin.
Use stronger contrast and a bigger visual shift than Workshop.

---

## View transition
There should be a strong, obvious transition between Workshop and Arena.

Examples:
- screen wipe / slide
- palette shift
- title change
- border/frame change around the grid
- intro panel for the challenger

The player should feel:
- "I am editing a build" in Workshop
- "I am testing this build" in Arena

---

## Desktop adaptation
Desktop can enhance the mobile structure by showing:
- side panel summaries
- persistent stats view
- larger tree inspector

But the app should never depend on sidebars to function.

---

## Immediate UI tasks
1. split app into Workshop and Arena views
2. center the square grid in both modes
3. move stats and tree into mobile-friendly tab/sheet interactions
4. create stronger visual distinction between preview and battle
5. simplify the top bar into game HUD language
