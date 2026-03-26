import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { BattleGrid } from './components/BattleGrid'
import { TopBar } from './components/TopBar'
import { StatsPanel } from './components/StatsPanel'
import { SkillTreePanel } from './components/SkillTreePanel'
import { BattleControls } from './components/BattleControls'
import { createInitialDraft, applyDraftPreset, getRemainingStatPoints, setDraftStat, tryUnlockNode } from './game/draft'
import { createSandboxEncounter } from './game/encounters'
import { applyBattleOutcome, BATTLE_TICK_LIMIT, createInitialRun, getCurrentEncounter, MAX_LEVEL } from './game/run'
import { createSimulationState, summarizeState } from './game/simulation'

const TABS = ['stats', 'genome', 'run']
const SPEED_OPTIONS = [250, 400, 700, 1000]

function App() {
  const [run, setRun] = useState(() => createInitialRun())
  const [draft, setDraft] = useState(() => createInitialDraft())
  const [activeTab, setActiveTab] = useState('stats')
  const [tickMs, setTickMs] = useState(400)
  const [previewTick, setPreviewTick] = useState(0)
  const [arenaTick, setArenaTick] = useState(0)
  const [isArenaRunning, setIsArenaRunning] = useState(true)

  const workshopEncounter = useMemo(() => createSandboxEncounter(), [])
  const arenaEncounter = useMemo(() => getCurrentEncounter(run), [run])

  const previewState = useMemo(
    () => createSimulationState({ draft, encounter: workshopEncounter, tick: previewTick % 18 }),
    [draft, workshopEncounter, previewTick],
  )
  const previewSummary = useMemo(() => summarizeState(previewState), [previewState])

  const arenaState = useMemo(
    () => createSimulationState({ draft, encounter: arenaEncounter, tick: arenaTick }),
    [draft, arenaEncounter, arenaTick],
  )
  const arenaSummary = useMemo(() => summarizeState(arenaState), [arenaState])

  const remainingStatPoints = getRemainingStatPoints(draft, run)
  const remainingGenomePoints = run.genomePoints - draft.nodes.length

  useEffect(() => {
    if (run.mode !== 'workshop') return undefined
    const intervalId = window.setInterval(() => {
      setPreviewTick((current) => current + 1)
    }, 500)
    return () => window.clearInterval(intervalId)
  }, [run.mode, draft])

  useEffect(() => {
    if (run.mode !== 'arena' || !isArenaRunning || arenaSummary.finished) return undefined
    const intervalId = window.setInterval(() => {
      setArenaTick((current) => current + 1)
    }, tickMs)
    return () => window.clearInterval(intervalId)
  }, [run.mode, isArenaRunning, tickMs, arenaSummary.finished, draft, arenaEncounter])

  useEffect(() => {
    if (run.mode === 'arena' && arenaSummary.finished) {
      setIsArenaRunning(false)
    }
  }, [run.mode, arenaSummary.finished])

  const handleSetStat = (key, value) => {
    setDraft((current) => setDraftStat(current, run, key, value))
    setPreviewTick(0)
  }

  const handleUnlockNode = (nodeId) => {
    setDraft((current) => tryUnlockNode(current, run, nodeId))
    setPreviewTick(0)
  }

  const handleApplyPreset = (presetId) => {
    setDraft((current) => applyDraftPreset(current, presetId, run))
    setPreviewTick(0)
  }

  const handleStartBattle = () => {
    setArenaTick(0)
    setIsArenaRunning(true)
    setRun((current) => ({ ...current, mode: 'arena', battleResult: null }))
  }

  const handleClaimBattle = () => {
    if (!arenaSummary.finished) return
    setRun((current) =>
      applyBattleOutcome(current, {
        winner: arenaSummary.winner,
        timeout: arenaSummary.timeout,
        verdict: arenaSummary.verdict,
        playerScore: arenaSummary.playerScore,
        enemyScore: arenaSummary.enemyScore,
      }),
    )
    setArenaTick(0)
    setPreviewTick(0)
  }

  const handleResetRun = () => {
    setRun(createInitialRun())
    setDraft(createInitialDraft())
    setPreviewTick(0)
    setArenaTick(0)
    setIsArenaRunning(true)
  }

  const currentView = run.mode === 'arena' ? 'arena' : 'workshop'
  const liveSummary = currentView === 'arena' ? arenaSummary : previewSummary
  const liveState = currentView === 'arena' ? arenaState : previewState
  const liveEncounter = currentView === 'arena' ? arenaEncounter : workshopEncounter

  return (
    <div className={`app-shell ${currentView}`}>
      <TopBar
        mode={currentView}
        run={run}
        encounter={liveEncounter}
        summary={liveSummary}
        remainingStatPoints={remainingStatPoints}
        remainingGenomePoints={remainingGenomePoints}
      />

      <main className="screen-shell">
        <section className="center-stage">
          <div className="stage-card hero-stage">
            <div className="stage-header">
              <div>
                <div className="eyebrow">{currentView === 'arena' ? 'arena' : 'workshop'}</div>
                <h2>{currentView === 'arena' ? liveEncounter.name : 'Containment Preview'}</h2>
                <p className="muted">
                  {currentView === 'arena'
                    ? `${liveEncounter.description} · tick ${liveState.tick}/${BATTLE_TICK_LIMIT}`
                    : 'Preview how your strain spreads before entering the arena.'}
                </p>
              </div>
              <div className="status-pill">{liveSummary.verdict}</div>
            </div>

            <BattleGrid state={liveState} mode={currentView} />

            {currentView === 'arena' ? (
              <BattleControls
                summary={arenaSummary}
                isRunning={isArenaRunning}
                tickMs={tickMs}
                speedOptions={SPEED_OPTIONS}
                onToggleRunning={() => setIsArenaRunning((current) => !current)}
                onSetTickMs={setTickMs}
                onStep={() => setArenaTick((current) => current + 1)}
                onResetBattle={() => {
                  setArenaTick(0)
                  setIsArenaRunning(true)
                }}
                onClaimBattle={handleClaimBattle}
              />
            ) : (
              <section className="stage-actions">
                <div className="run-summary-strip">
                  <div>
                    <span className="label">level</span>
                    <strong>{run.level}</strong>
                  </div>
                  <div>
                    <span className="label">next foe</span>
                    <strong>{arenaEncounter.name}</strong>
                  </div>
                  <div>
                    <span className="label">wins</span>
                    <strong>{run.wins}/{MAX_LEVEL}</strong>
                  </div>
                </div>
                <div className="button-row centered">
                  <button type="button" onClick={handleStartBattle}>Enter arena</button>
                  <button type="button" className="ghost" onClick={handleResetRun}>Reset run</button>
                </div>
              </section>
            )}
          </div>
        </section>

        <section className="mobile-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'tab-button active' : 'tab-button'}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </section>

        <section className="bottom-panels">
          <div className={activeTab === 'stats' ? 'panel-stack active' : 'panel-stack'}>
            <StatsPanel
              draft={draft}
              run={run}
              remainingStatPoints={remainingStatPoints}
              onSetStat={handleSetStat}
              onApplyPreset={handleApplyPreset}
            />
          </div>

          <div className={activeTab === 'genome' ? 'panel-stack active' : 'panel-stack'}>
            <SkillTreePanel
              draft={draft}
              run={run}
              remainingGenomePoints={remainingGenomePoints}
              onUnlockNode={handleUnlockNode}
            />
          </div>

          <div className={activeTab === 'run' ? 'panel-stack active' : 'panel-stack'}>
            <section className="panel run-panel">
              <div className="panel-title-row">
                <h2>Run flow</h2>
                <span className="chip">{run.finished ? 'finished' : 'active'}</span>
              </div>
              <div className="run-grid">
                <div className="run-card">
                  <span className="label">current level</span>
                  <strong>{run.level}</strong>
                </div>
                <div className="run-card">
                  <span className="label">battle</span>
                  <strong>{Math.min(run.battleIndex + 1, MAX_LEVEL)}/{MAX_LEVEL}</strong>
                </div>
                <div className="run-card">
                  <span className="label">stat points</span>
                  <strong>{remainingStatPoints} free</strong>
                </div>
                <div className="run-card">
                  <span className="label">genome points</span>
                  <strong>{remainingGenomePoints} free</strong>
                </div>
              </div>

              <div className="result-card">
                <span className="label">last battle</span>
                <strong>{run.battleResult ? run.battleResult.verdict : 'None yet'}</strong>
                {run.battleResult ? (
                  <p className="muted">
                    score {run.battleResult.playerScore} - {run.battleResult.enemyScore}
                    {run.battleResult.timeout ? ' · timeout' : ''}
                  </p>
                ) : null}
              </div>

              {run.finished ? (
                <div className="button-row centered">
                  <button type="button" onClick={handleResetRun}>Start new run</button>
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
