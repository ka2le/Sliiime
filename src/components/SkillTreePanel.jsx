import { BRANCH_ORDER, TREE_NODES, canUnlockNode } from '../game/tree'

function BranchColumn({ branch, draft, run, remainingGenomePoints, onUnlockNode }) {
  const nodes = TREE_NODES.filter((node) => node.branch === branch)

  return (
    <div className="tree-branch">
      <div className="tree-branch-header">
        <strong>{branch}</strong>
      </div>
      <div className="tree-node-list">
        {nodes.map((node) => {
          const unlocked = draft.nodes.includes(node.id)
          const available = canUnlockNode(draft.nodes, remainingGenomePoints, node.id)

          return (
            <button
              key={node.id}
              type="button"
              className={[
                'tree-node',
                unlocked ? 'unlocked' : '',
                available ? 'available' : 'locked',
              ].join(' ')}
              onClick={() => onUnlockNode(node.id)}
              disabled={!available}
            >
              <div className="tree-node-top">
                <span className="chip">T{node.tier}</span>
                <span className="label">needs {node.requiresSpent}</span>
              </div>
              <strong>{node.name}</strong>
              <p>{node.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SkillTreePanel({ draft, run, remainingGenomePoints, onUnlockNode }) {
  return (
    <section className="panel side-panel">
      <div className="panel-title-row">
        <h2>Genome web</h2>
        <span className="chip">{remainingGenomePoints} free</span>
      </div>

      <p className="muted">Spend in one direction to unlock deeper, stronger effects in that branch.</p>

      <div className="tree-grid">
        {BRANCH_ORDER.map((branch) => (
          <BranchColumn
            key={branch}
            branch={branch}
            draft={draft}
            run={run}
            remainingGenomePoints={remainingGenomePoints}
            onUnlockNode={onUnlockNode}
          />
        ))}
      </div>
    </section>
  )
}
