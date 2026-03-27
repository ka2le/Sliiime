import { BRANCHES, TREE_EDGES, TREE_NODES, canUnlockNode, getNodeRank } from '../game/tree'

function TreeNode({ node, draft, remainingSkillPoints, onUnlockNode }) {
  const rank = getNodeRank(draft.nodes, node.id)
  const unlocked = rank > 0
  const available = canUnlockNode(draft.nodes, remainingSkillPoints, node.id)

  return (
    <button
      type="button"
      className={`tree-node graph-node tier-${node.tier} ${node.branch} ${unlocked ? 'unlocked' : available ? 'available' : 'locked'}`}
      onClick={() => onUnlockNode(node.id)}
      disabled={!available}
    >
      <strong>{node.name}</strong>
      <span className="rank-indicator">{rank}/{node.maxRank}</span>
      <div className="tree-tooltip">
        <strong>{node.name}</strong>
        <p>{node.effectText}</p>
        <span className="rank-indicator">{rank}/{node.maxRank}</span>
      </div>
    </button>
  )
}

function Edge({ from, to }) {
  const vertical = from.x === to.x
  const edgeClass = vertical
    ? 'edge-vertical'
    : to.x < from.x
      ? 'edge-diag-left'
      : 'edge-diag-right'

  const left = from.x === 0 ? '50%' : from.x < 0 ? '25%' : '75%'

  return <div className={`tree-edge ${edgeClass}`} style={{ left }} />
}

function BranchGraph({ branch, draft, remainingSkillPoints, onUnlockNode }) {
  const nodes = TREE_NODES.filter((node) => node.branch === branch.id)
  const root = nodes.find((node) => node.tier === 1)
  const children = nodes.filter((node) => node.tier === 2)

  return (
    <div className="branch-graph">
      <div className="branch-label">{branch.name}</div>
      <div className="graph-grid">
        <div className="graph-row root-row">
          <TreeNode node={root} draft={draft} remainingSkillPoints={remainingSkillPoints} onUnlockNode={onUnlockNode} />
        </div>

        <div className="graph-edge-layer">
          {TREE_EDGES.filter(([from]) => from === root.id).map(([fromId, toId]) => {
            const fromNode = TREE_NODES.find((node) => node.id === fromId)
            const toNode = TREE_NODES.find((node) => node.id === toId)
            return <Edge key={`${fromId}-${toId}`} from={fromNode} to={toNode} />
          })}
        </div>

        <div className="graph-row children-row">
          {children.map((node) => (
            <TreeNode key={node.id} node={node} draft={draft} remainingSkillPoints={remainingSkillPoints} onUnlockNode={onUnlockNode} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkillTreePanel({ draft, remainingSkillPoints, onUnlockNode }) {
  return (
    <section className="tree-panel-inner">
      <div className="tree-board graph-tree-board">
        <div className="tree-root-title">
          <span className="label">paths</span>
          <strong>Spend points into branches</strong>
        </div>
        <div className="graph-branches-row">
          {BRANCHES.map((branch) => (
            <BranchGraph
              key={branch.id}
              branch={branch}
              draft={draft}
              remainingSkillPoints={remainingSkillPoints}
              onUnlockNode={onUnlockNode}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
