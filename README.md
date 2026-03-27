# Sliiime

Alien colony evolution auto-battler prototype.

## Current prototype

- React + Vite app
- 7x7 slime battle grid
- slime-first board UI
- attack / growth upgrades directly in the main board view
- graph-style skill tree popup with ranked nodes
- longer encounter ladder with neutral terrain blockers
- animated spread / combat feedback with floating numbers
- centralized gameplay tuning in `src/game/GameBalance.json`

## Core gameplay

The intended flow is:

1. grow a dense blob
2. choose when to spread
3. commit large cells into attacks
4. evolve into stronger branch identities through the skill tree

The battle model currently emphasizes:

- **growth first**: larger cells grow faster
- **expensive spread**: spreading costs setup and sends only a small payload
- **committed attacks**: attacking consumes most of a cell and creates battle zones
- **defender advantage**: defenders get a base shield edge

## Important files

- `src/game/GameBalance.json` — main balance/tuning values
- `src/game/simulation.js` — battle simulation
- `src/game/encounters.js` — enemy ladder + terrain layouts
- `src/game/tree.js` — skill tree nodes
- `src/GamePrototype.jsx` — main prototype UI

## Tweaking balance

If you want to tune the game without digging through logic first, start with:

- `defaultSpreadBias`
- `baseShield`
- `baseCellCap`
- `spreadCost`
- `spreadSpawn`
- `attackCost`
- `battleTickLimit`
- the values under `ai`

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

```bash
npm run deploy
```
