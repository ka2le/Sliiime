import { useMemo, useState } from 'react'
import './App.css'
import { BattleGrid } from './components/BattleGrid'
import { TopBar } from './components/TopBar'
import { StatsPanel } from './components/StatsPanel'
import { SkillTreePanel } from './components/SkillTreePanel'
import { BattleControls } from './components/BattleControls'
import { createInitialDraft, applyDraftPreset } from './game/draft'
import { createEncounter, getNextEncounterIndex } from './game/encounters'
import { createSimulationState, advanceSimulation, summarizeState } from './game/simulation'

const TABS = ['overview', 'stats', 'mutations']

function App() {
  const [draft, setDraft] = useState(() => createInitialDraft())
  const [encounterIndex, setEncounterIndex] = useState(0)
  const [tick, setTick] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  const encounter = useMemo(
    () => createEncounter(encounterIndex),
    [encounterIndex],
  )

  const simulation = useMemo(
    () => createSimulationState({ draft, encounter, tick }),
    [draft, encounter, tick],
  )

  const summary = useMemo(() => summarizeState(simulation), [simulation])

  const handleStep = () => {
    setTick((current) => current + 1)
  }

  const handleRun = () => {
    setTick((current) => current + 12)
  }

  const handleResetBoard = () => {
    setTick(0)
  }

  const handleResetAll = () => {
    setDraft(createInitialDraft())
    setEncounterIndex(0)
    setTick(0)
  }

  const handleBringChallenger = () => {
    setEncounterIndex((current) => getNextEncounterIndex(current))
    setTick(0)
  }

  const handleSetStat = (key, value) => {
    setDraft((current) => ({
      ...current,
      stats: {
        ...current.stats,
        [key]: value,
      },
    }))
    setTick(0)
  }

  const handleToggleMutation = (mutationId) => {
    setDraft((current) => {
      const enabled = current.mutations.includes(mutationId)

      return {
        ...current,
        mutations: enabled
          ? current.mutations.filter((id) => id !== mutationId)
          : [...current.mutations, mutationId],
      }
    })
    setTick(0)
  }

  const handleApplyPreset = (presetId) => {
    setDraft((current) => applyDraftPreset(current, presetId))
    setTick(0)
  }

  return (
    <div className="app-shell">
      <TopBar
        title="Sliiime"
        subtitle="Alien colony evolution sandbox"
        tick={simulation.tick}
        encounter={encounter}
        summary={summary}
      />

      <div className="mobile-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="main-layout">
        <section className={activeTab === 'overview' ? 'board-column active' : 'board-column'}>
          <BattleControls
            encounter={encounter}
            summary={summary}
            onStep={handleStep}
            onRun={handleRun}
            onResetBoard={handleResetBoard}
            onResetAll={handleResetAll}
            onBringChallenger={handleBringChallenger}
          />
          <BattleGrid state={simulation} />
        </section>

        <aside className={activeTab === 'stats' ? 'side-column active' : 'side-column'}>
          <StatsPanel draft={draft} onSetStat={handleSetStat} onApplyPreset={handleApplyPreset} />
        </aside>

        <aside className={activeTab === 'mutations' ? 'side-column active' : 'side-column'}>
          <SkillTreePanel draft={draft} onToggleMutation={handleToggleMutation} />
        </aside>
      </main>
    </div>
  )
}

export default App
