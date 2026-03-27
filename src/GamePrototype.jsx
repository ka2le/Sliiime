import { useEffect, useMemo, useState } from 'react'
import { BattleGrid } from './components/BattleGrid'
import { SkillTreePanel } from './components/SkillTreePanel'
import { createInitialDraft, createResetDraft, getRemainingStatPoints, setDraftStat, tryUnlockNode } from './game/draft'
import { applyBattleOutcome, BATTLE_TICK_LIMIT, createInitialRun, getCurrentEncounter, MAX_LEVEL } from './game/run'
import { createSandboxEncounter } from './game/encounters'
import { createSimulationState, summarizeState } from './game/simulation'

const SPEED_OPTIONS = [
  { label: 'Slow', value: 1000 },
  { label: 'Normal', value: 400 },
  { label: 'Fast', value: 150 },
]


function UpgradeChip({ label, value, canUpgrade, onPlus, info, accent, large, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} className={`upgrade-chip ${accent ?? ''} ${large ? 'large-chip' : ''}`} onClick={onClick}>
      <div className="upgrade-chip-top">
        <span>{label}</span>
        {info ? <span className="info-dot" title={info}>i</span> : null}
      </div>
      <div className="upgrade-chip-main">
        <strong>{value}</strong>
        {onPlus ? <button type="button" className="mini-step" onClick={(event) => { event.stopPropagation(); onPlus() }} disabled={!canUpgrade}>+</button> : null}
      </div>
    </Tag>
  )
}

function OutcomeOverlay({ liveSummary, run, onContinue, onReset }) {
  if (run.mode === 'arena' && liveSummary.finished) {
    return (
      <div className="battle-overlay-card solid-popup">
        <span className="label">battle result</span>
        <h3>{liveSummary.winner === 'player' ? 'Battle won' : 'Run collapsed'}</h3>
        <p>{liveSummary.verdict}. {liveSummary.timeout ? 'Resolved on control.' : 'Resolved by wipeout.'}</p>
        <button type="button" className="hero-button huge-button" onClick={onContinue}>Continue</button>
      </div>
    )
  }

  if (run.mode === 'gameover') {
    return (
      <div className="battle-overlay-card solid-popup">
        <span className="label">run result</span>
        <h3>{run.wins >= MAX_LEVEL ? 'Run cleared' : 'Run over'}</h3>
        <p>{run.wins} wins. Try a different stat split, spread bias, or branch path.</p>
        <button type="button" className="hero-button huge-button" onClick={onReset}>Restart run</button>
      </div>
    )
  }

  return null
}

export function GamePrototype() {
  const [run, setRun] = useState(() => createInitialRun())
  const [draft, setDraft] = useState(() => createInitialDraft())
  const [arenaTick, setArenaTick] = useState(0)
  const [previewTick, setPreviewTick] = useState(0)
  const [tickMs, setTickMs] = useState(400)
  const [showTree, setShowTree] = useState(false)

  const sandboxEncounter = useMemo(() => createSandboxEncounter(), [])
  const arenaEncounter = useMemo(() => getCurrentEncounter(run), [run])

  const previewState = useMemo(
    () => createSimulationState({ draft, encounter: sandboxEncounter, tick: previewTick % 18 }),
    [draft, sandboxEncounter, previewTick],
  )
  const arenaState = useMemo(
    () => createSimulationState({ draft, encounter: arenaEncounter, tick: arenaTick }),
    [draft, arenaEncounter, arenaTick],
  )

  const liveState = run.mode === 'arena' ? arenaState : previewState
  const liveSummary = useMemo(() => summarizeState(liveState), [liveState])
  const remainingStatPoints = getRemainingStatPoints(draft, run)
  const remainingSkillPoints = Math.max(0, run.skillPoints - draft.nodes.length)
  const canStartBattle = remainingStatPoints === 0

  useEffect(() => {
    if (run.mode !== 'workshop' && run.mode !== 'gameover') return undefined
    const intervalId = window.setInterval(() => setPreviewTick((current) => current + 1), 620)
    return () => window.clearInterval(intervalId)
  }, [run.mode, draft])

  useEffect(() => {
    if (run.mode !== 'arena' || liveSummary.finished) return undefined
    const intervalId = window.setInterval(() => setArenaTick((current) => current + 1), tickMs)
    return () => window.clearInterval(intervalId)
  }, [run.mode, tickMs, liveSummary.finished, arenaEncounter, draft])

  const startBattle = () => {
    if (!canStartBattle) return
    setArenaTick(0)
    setRun((current) => ({ ...current, mode: 'arena', battleResult: null }))
  }

  const finishBattle = () => {
    if (!liveSummary.finished) return

    const nextRun = applyBattleOutcome(run, {
      winner: liveSummary.winner,
      timeout: liveSummary.timeout,
      verdict: liveSummary.verdict,
      playerScore: liveSummary.playerScore,
      enemyScore: liveSummary.enemyScore,
      playerMass: liveSummary.playerMass,
    })

    setRun(nextRun)
    setArenaTick(0)
    setPreviewTick(0)

    if (nextRun.finished) return
    setDraft((current) => createResetDraft(current))
  }

  const resetRun = () => {
    setRun(createInitialRun())
    setDraft(createInitialDraft())
    setArenaTick(0)
    setPreviewTick(0)
    setShowTree(false)
  }

  const updateStat = (key, delta) => {
    setDraft((current) => setDraftStat(current, run, key, current.stats[key] + delta))
  }

  return (
    <div className={`proto-shell ${run.mode}`}>
      <main className="proto-main rebuilt-main single-board-layout">
        <section className="board-panel main-board-panel">
          <div className="board-topline compact-topline">
            <div>
              <h1>Sliiime</h1>
              <p>{run.mode === 'arena' ? arenaEncounter.name : ''}</p>
            </div>
            <div className="board-top-actions inline-header-chips">
              <UpgradeChip label="Wins" value={run.wins} info="Battles won in the current run." />
              <UpgradeChip label="Tree" value={remainingSkillPoints} onClick={() => setShowTree(true)} info="Open the skill tree." accent="tree-chip" large />
              <button type="button" className="ghost tiny-reset" onClick={resetRun}>Reset</button>
            </div>
          </div>

          <div className="always-visible-stats interactive-stats-row compact-stat-row">
            <UpgradeChip label="Atk" value={draft.stats.attack} canUpgrade={remainingStatPoints > 0} onPlus={() => updateStat('attack', 1)} info="How hard your slime hits when it pushes into enemy cells." />
            <UpgradeChip label="Gro" value={draft.stats.growth} canUpgrade={remainingStatPoints > 0} onPlus={() => updateStat('growth', 1)} info="How strongly heavy cells scale upward when they grow." />
            <UpgradeChip label="Shield" value={5} info="Defenders always get a base shield advantage in fights." />
          </div>

          <div className="battle-stage slime-stage-main">
            <BattleGrid state={liveState} />
            <OutcomeOverlay liveSummary={liveSummary} run={run} onContinue={finishBattle} onReset={resetRun} />
          </div>

          <div className="board-bottomline central-cta-line">
            <div className="speed-cluster text-speeds">
              {SPEED_OPTIONS.map((speed) => (
                <button key={speed.value} type="button" className={tickMs === speed.value ? 'small active-speed' : 'small ghost'} onClick={() => setTickMs(speed.value)}>
                  {speed.label}
                </button>
              ))}
            </div>

            <button type="button" className="hero-button giga-button centered-cta" onClick={startBattle} disabled={!canStartBattle || run.mode !== 'workshop'}>
              {run.mode === 'workshop'
                ? canStartBattle
                  ? 'START BATTLE'
                  : `SPEND ${remainingStatPoints}`
                : 'BATTLE RUNNING'}
            </button>

            <div className="micro-summary-row compact-summary-row">
              <UpgradeChip label="Mass" value={liveSummary.playerMass} info="Current total player mass on the board." />
            </div>
          </div>
        </section>

        {showTree ? (
          <div className="modal-backdrop" onClick={() => setShowTree(false)}>
            <div className="tree-modal solid-popup" onClick={(event) => event.stopPropagation()}>
              <div className="board-topline compact-topline modal-headline">
                <div>
                  <h2>Skill tree</h2>
                  <p>{remainingSkillPoints} free</p>
                </div>
                <button type="button" className="ghost small" onClick={() => setShowTree(false)}>Close</button>
              </div>
              <SkillTreePanel
                draft={draft}
                remainingSkillPoints={remainingSkillPoints}
                onUnlockNode={(nodeId) => setDraft((current) => tryUnlockNode(current, run, nodeId))}
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
