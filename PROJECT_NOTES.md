# Sliiime Project Notes

## Goal
Build a small but expandable alien colony auto-battler where the player experiments with stat distributions and mutation combos, then watches those choices play out on a grid.

## MVP focus
- Modular React app structure
- Grid simulation first
- Sandbox mode on empty board
- `Bring in challenger` encounter loop
- Stats and mutations visible/editable while iterating

## Current architecture
- `src/game/` holds data and simulation logic
- `src/components/` holds UI panels
- `App.jsx` wires together state and layout

## Near-term next steps
1. Improve sim rules so different builds diverge more clearly
2. Add animation / autoplay loop
3. Add battle event log and post-battle explanation
4. Add proper skill-tree/progression structure instead of flat mutation toggles
5. Add art direction and stronger organism identity
