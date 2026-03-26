export function TopBar({ title, subtitle, tick, encounter, summary }) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">prototype</div>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>

      <div className="topbar-stats">
        <div className="topbar-card">
          <span className="label">tick</span>
          <strong>{tick}</strong>
        </div>
        <div className="topbar-card wide">
          <span className="label">encounter</span>
          <strong>{encounter.name}</strong>
        </div>
        <div className="topbar-card wide">
          <span className="label">state</span>
          <strong>{summary.verdict}</strong>
        </div>
      </div>
    </header>
  )
}
