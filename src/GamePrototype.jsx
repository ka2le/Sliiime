import { useEffect, useMemo, useState } from 'react'
import { BattleGrid } from './components/BattleGrid'
import { StatsPanel } from './components/StatsPanel'
import { SkillTreePanel } from './components/SkillTreePanel'
import { applyDraftPreset, createInitialDraft, createResetDraft, getRemainingStatPoints, setDraftStat, tryUnlockNode } from './game/draft'
import { applyBattleOutcome, BATTLE_TICK_LIMIT, createInitialRun, getCurrentEncounter, MAX_LEVEL } from './game/run'
import { createSandboxEncounter } from './game/encounters'
import { createSimulationState, summarizeState } from './game/simulation'

const SPEED_OPTIONS = [250, 400, 700]

const TUTORIAL_TEXT = {
  intro: {
    title: 'Welcome to the basin',
    body: 'You start with a solid pre-grown slime. Watch one fight first so the loop makes sense. After that, the strain partially melts back down and you rebuild its stats yourself.',
    cta: 'Start first battle',
  },
  post1: {
    title: 'Now you tune the slime',
    body: 'After every win the body destabilizes. You keep the run, but your stat shape soft-resets. Spend your fresh stat pool, then launch the next challenger.',
    cta: 'Open stat vat',
  },
  genome: {
    title: 'Genome unlocked',
    body: 'You survived three battles, so deeper mutations open up. Stats still matter, but now branch choices can create real build identities.',
    cta: 'Open genome web',
  },
}

function OverlayCard({ title, body, children, cta, onConfirm }) {
  return (
    <div className="overlay-card splash-card">
      <div className="splash-acid" />
      <h2>{title}</h2>
      <p>{body}</p>
      {children}
      {onConfirm ? (
        <div className="button-row centered">
          <button type="button" className="hero-button" onClick={onConfirm}>{cta}</button>
        </div>
      ) : null}
    </div>
  )
}

export function GamePrototype() {
  const [run, setRun] = useState(() => createInitialRun())
  const [draft, setDraft] = useState(() => createInitialDraft())
  const [arenaTick, setArenaTick] = useState(0)
  const [previewTick, setPreviewTick] = useState(0)
  const [tickMs, setTickMs] = useState(400)
  const [showStats, setShowStats] = useState(false)
  const [showGenome, setShowGenome] = useState(false)
  const [overlay, setOverlay] = useState('intro')
  const [seenGenomeUnlock, setSeenGenomeUnlock] = useState(false)

  const sandboxEncounter = useMemo(() => createSandboxEncounter(), [])
  const arenaEncounter = useMemo(() => getCurrentEncounter(run), [run])
  const liveEncounter = run.mode === 'arena' ? arenaEncounter : sandboxEncounter

  const previewState = useMemo(
    () => createSimulationState({ draft, encounter: sandboxEncounter, tick: previewTick % 20 }),
    [draft, sandboxEncounter, previewTick],
  )
  const arenaState = useMemo(
    () => createSimulationState({ draft, encounter: arenaEncounter, tick: arenaTick }),
    [draft, arenaEncounter, arenaTick],
  )

  const liveState = run.mode === 'arena' ? arenaState : previewState
  const liveSummary = useMemo(() => summarizeState(liveState), [liveState])
  const remainingStatPoints = getRemainingStatPoints(draft, run)
  const remainingGenomePoints = Math.max(0, run.genomePoints - draft.nodes.length)

  useEffect(() => {
    if (run.mode !== 'workshop' && run.mode !== 'gameover') return undefined
    const intervalId = window.setInterval(() => setPreviewTick((current) => current + 1), 550)
    return () => window.clearInterval(intervalId)
  }, [run.mode, draft])

  useEffect(() => {
    if (run.mode !== 'arena' || liveSummary.finished) return undefined
    const intervalId = window.setInterval(() => setArenaTick((current) => current + 1), tickMs)
    return () => window.clearInterval(intervalId)
  }, [run.mode, tickMs, liveSummary.finished, arenaEncounter, draft])

  useEffect(() => {
    if (run.genomeUnlocked && !seenGenomeUnlock) {
      setOverlay('genome')
      setSeenGenomeUnlock(true)
    }
  }, [run.genomeUnlocked, seenGenomeUnlock])

  const startBattle = () => {
    setArenaTick(0)
    setRun((current) => ({ ...current, mode: 'arena', battleResult: null }))
    setOverlay(null)
    setShowStats(false)
    setShowGenome(false)
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

    if (nextRun.finished) {
      setOverlay('gameover')
      return
    }

    const resetDraft = createResetDraft(draft)
    setDraft(resetDraft)
    setShowStats(true)
    setShowGenome(false)
    setOverlay(nextRun.wins === 1 ? 'post1' : null)
  }

  const resetRun = () => {
    setRun(createInitialRun())
    setDraft(createInitialDraft())
    setArenaTick(0)
    setPreviewTick(0)
    setShowStats(false)
    setShowGenome(false)
    setOverlay('intro')
    setSeenGenomeUnlock(false)
  }

  const topTitle = run.mode === 'arena' ? arenaEncounter.name : run.finished ? 'Run lost' : 'Workshop Basin'
  const topSubtitle = run.mode === 'arena'
    ? `${arenaEncounter.description} · Tick ${arenaState.tick}/${BATTLE_TICK_LIMIT}`
    : run.genomeUnlocked
      ? 'Stats and genome are both available. Rebuild carefully.'
      : 'Stats only for now. Survive three battles to unlock the genome web.'

  return (
    <div className={`proto-shell ${run.mode}`}>
      <header className="proto-topbar">
        <div className="brand-chunk">
          <div className="spray-tag">Sliiime</div>
          <h1>{topTitle}</h1>
          <p>{topSubtitle}</p>
        </div>

        <div className="top-stats-strip">
          <div className="hud-blob"><span>Level</span><strong>{run.level}</strong></div>
          <div className="hud-blob"><span>Battle</span><strong>{Math.min(run.battleIndex + 1, MAX_LEVEL)}</strong></div>
          <div className="hud-blob"><span>Score</span><strong>{run.score}</strong></div>
          <div className="hud-blob"><span>Pressure</span><strong>{liveSummary.verdict}</strong></div>
        </div>

        <div className="menu-icons">
          <button type="button" className="icon-button" onClick={() => setShowStats(true)}>⚗️</button>
          <button type="button" className="icon-button" onClick={() => run.genomeUnlocked && setShowGenome(true)} disabled={!run.genomeUnlocked}>🧬</button>
          <button type="button" className="icon-button" onClick={resetRun}>↺</button>
        </div>
      </header>

      <main className="proto-main">
        <section className="arena-shell">
          <div className="paint paint-a" />
          <div className="paint paint-b" />
          <BattleGrid state={liveState} mode={run.mode === 'arena' ? 'arena' : 'preview'} />

          <div className="under-grid-strip">
            <div><span>Your mass</span><strong>{liveSummary.playerMass}</strong></div>
            <div><span>Enemy mass</span><strong>{liveSummary.enemyMass}</strong></div>
            <div><span>Your score</span><strong>{liveSummary.playerScore ?? 0}</strong></div>
            <div><span>Enemy score</span><strong>{liveSummary.enemyScore ?? 0}</strong></div>
          </div>

          {run.mode === 'arena' && !liveSummary.finished ? (
            <div className="floating-speedbar">
              {SPEED_OPTIONS.map((speed) => (
                <button key={speed} type="button" className={tickMs === speed ? 'small active-speed' : 'small ghost'} onClick={() => setTickMs(speed)}>
                  {speed}ms
                </button>
              ))}
            </div>
          ) : null}

          {overlay === 'intro' ? (
            <OverlayCard {...TUTORIAL_TEXT.intro} onConfirm={startBattle} />
          ) : null}

          {run.mode === 'workshop' && overlay === 'post1' ? (
            <OverlayCard {...TUTORIAL_TEXT.post1} onConfirm={() => { setOverlay(null); setShowStats(true) }} />
          ) : null}

          {run.mode === 'workshop' && overlay === 'genome' ? (
            <OverlayCard {...TUTORIAL_TEXT.genome} onConfirm={() => { setOverlay(null); setShowGenome(true) }} />
          ) : null}

          {run.mode === 'workshop' && !overlay && !run.finished ? (
            <div className="battle-launcher top-floating">
              <div className="launcher-copy">
                <span className="label">next challenger</span>
                <strong>{arenaEncounter.name}</strong>
                <p>{arenaEncounter.description}</p>
              </div>
              <button type="button" className="hero-button" onClick={startBattle}>Bring in challenger</button>
            </div>
          ) : null}

          {run.mode === 'arena' && liveSummary.finished ? (
            <div className="overlay-card result-splash">
              <h2>{liveSummary.winner === 'player' ? 'Battle won' : 'Run collapsed'}</h2>
              <p>
                {liveSummary.verdict}. {liveSummary.timeout ? 'It went to control scoring.' : 'It resolved by board wipe.'}
              </p>
              <div className="run-grid wide-run-grid">
                <div className="run-card"><span className="label">your score</span><strong>{liveSummary.playerScore}</strong></div>
                <div className="run-card"><span className="label">enemy score</span><strong>{liveSummary.enemyScore}</strong></div>
                <div className="run-card"><span className="label">your mass</span><strong>{liveSummary.playerMass}</strong></div>
                <div className="run-card"><span className="label">enemy mass</span><strong>{liveSummary.enemyMass}</strong></div>
              </div>
              <div className="button-row centered">
                <button type="button" className="hero-button" onClick={finishBattle}>Continue</button>
              </div>
            </div>
          ) : null}

          {overlay === 'gameover' ? (
            <div className="overlay-card endrun-card">
              <h2>{run.wins >= MAX_LEVEL ? 'Run cleared' : 'Run over'}</h2>
              <p>
                Losing a battle ends the run. Current prototype score rewards wins, board control, and deep runs.
              </p>
              <div className="run-grid wide-run-grid">
                <div className="run-card"><span className="label">score</span><strong>{run.score}</strong></div>
                <div className="run-card"><span className="label">level reached</span><strong>{run.level}</strong></div>
                <div className="run-card"><span className="label">battles won</span><strong>{run.wins}</strong></div>
                <div className="run-card"><span className="label">largest mass</span><strong>{run.stats.largestMass}</strong></div>
                <div className="run-card"><span className="label">best board score</span><strong>{run.stats.bestScore}</strong></div>
                <div className="run-card"><span className="label">last result</span><strong>{run.battleResult?.verdict ?? 'n/a'}</strong></div>
              </div>
              <div className="button-row centered">
                <button type="button" className="hero-button" onClick={resetRun}>Rerun</button>
              </div>
            </div>
          ) : null}
        </section>
      </main>

      {showStats ? (
        <div className="modal-backdrop" onClick={() => setShowStats(false)}>
          <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-header"><h2>Stat vat</h2><button type="button" className="icon-button" onClick={() => setShowStats(false)}>✕</button></div>
            <p className="sheet-copy">Your body soft-resets between fights. Re-spend your stat mass here before launching the next test.</p>
            <StatsPanel
              draft={draft}
              run={run}
              remainingStatPoints={remainingStatPoints}
              onSetStat={(key, value) => setDraft((current) => setDraftStat(current, run, key, value))}
              onApplyPreset={(presetId) => setDraft((current) => applyDraftPreset(current, presetId, run))}
            />
          </div>
        </div>
      ) : null}

      {showGenome ? (
        <div className="modal-backdrop" onClick={() => setShowGenome(false)}>
          <div className="modal-sheet wide-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-header"><h2>Genome web</h2><button type="button" className="icon-button" onClick={() => setShowGenome(false)}>✕</button></div>
            <p className="sheet-copy">Spend branch points to unlock deeper mutations. This only opens after surviving the early tutorial fights.</p>
            <SkillTreePanel
              draft={draft}
              run={run}
              remainingGenomePoints={remainingGenomePoints}
              onUnlockNode={(nodeId) => setDraft((current) => tryUnlockNode(current, run, nodeId))}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
