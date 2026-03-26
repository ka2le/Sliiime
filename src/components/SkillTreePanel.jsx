import { MUTATIONS } from '../game/draft'

export function SkillTreePanel({ draft, onToggleMutation }) {
  return (
    <section className="panel side-panel">
      <div className="panel-title-row">
        <h2>Mutation web</h2>
        <span className="chip">prototype</span>
      </div>

      <div className="mutation-list">
        {MUTATIONS.map((mutation) => {
          const enabled = draft.mutations.includes(mutation.id)
          return (
            <button
              key={mutation.id}
              type="button"
              className={enabled ? 'mutation-card active' : 'mutation-card'}
              onClick={() => onToggleMutation(mutation.id)}
            >
              <strong>{mutation.name}</strong>
              <p>{mutation.description}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
